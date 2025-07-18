import {
	Injectable,
	InternalServerErrorException,
	NotFoundException,
	UnauthorizedException
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { verify } from 'argon2'
import { Request, Response } from 'express'

import { PrismaService } from '@/src/core/prisma'
import { ms, parseBoolean, StringValue } from '@/src/shared/utils'

import { LoginInput } from './inputs'

@Injectable()
export class SessionService {
	public constructor(
		private readonly prismaService: PrismaService,
		private readonly configService: ConfigService
	) {}

	public async login(req: Request, input: LoginInput) {
		const { login, password } = input

		const user = await this.prismaService.user.findFirst({
			where: {
				OR: [
					{ username: { equals: login } },
					{ email: { equals: login } }
				]
			}
		})

		if (!user) {
			throw new NotFoundException('User does not exist')
		}

		const isValidPassword = await verify(user.password, password)

		if (!isValidPassword) {
			throw new UnauthorizedException('Passwords do not match')
		}

		return new Promise((resolve, reject) => {
			req.session.createdAt = new Date()
			req.session.userId = user.id

			req.session.save(err => {
				if (err) {
					return reject(
						new InternalServerErrorException(
							'Не удалось сохранить сессию'
						)
					)
				}

				resolve(user)
			})
		})
	}

	public async logout(req: Request, res: Response) {
		return new Promise((resolve, reject) => {
			req.session.destroy(err => {
				if (err) {
					return reject(
						new InternalServerErrorException(
							'Не удалось завершить сессию. Возможно, возникла проблема с сервером или сессия уже была завершена.'
						)
					)
				}
				res.clearCookie(
					this.configService.getOrThrow<string>('SESSION_NAME'),
					{
						path: '/',
						domain: this.configService.getOrThrow<string>(
							'SESSION_DOMAIN'
						),
						httpOnly: parseBoolean(
							this.configService.getOrThrow<string>(
								'SESSION_HTTP_ONLY'
							)
						),
						secure: parseBoolean(
							this.configService.getOrThrow<string>(
								'SESSION_SECURE'
							)
						)
					}
				)
				resolve(true)
			})
		})
	}
}
