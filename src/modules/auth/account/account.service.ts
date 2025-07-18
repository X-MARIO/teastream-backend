import { ConflictException, Injectable } from '@nestjs/common'
import { hash } from 'argon2'

import { PrismaService } from '@/src/core/prisma'

import { CreateUserInput } from './inputs'

@Injectable()
export class AccountService {
	public constructor(private readonly prismaService: PrismaService) {}

	public async findAll() {
		const users = await this.prismaService.user.findMany()

		return users
	}

	public async create(input: CreateUserInput) {
		const { username, password, email } = input

		const isUserNameExists = await this.prismaService.user.findUnique({
			where: { username }
		})

		if (isUserNameExists) {
			throw new ConflictException('User name already exists')
		}

		const isEmailExists = await this.prismaService.user.findUnique({
			where: { email }
		})

		if (isEmailExists) {
			throw new ConflictException('Email already exists')
		}

		const user = await this.prismaService.user.create({
			data: {
				username,
				email,
				password: await hash(password),
				displayName: username
			}
		})

		return user
	}
}
