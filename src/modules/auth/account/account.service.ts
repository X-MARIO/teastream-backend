import { Injectable } from '@nestjs/common'

import { PrismaService } from '@/src/core/prisma'

@Injectable()
export class AccountService {
	public constructor(private readonly prismaService: PrismaService) {}

	public async findAll() {
		const users = await this.prismaService.user.findMany()

		return users
	}
}
