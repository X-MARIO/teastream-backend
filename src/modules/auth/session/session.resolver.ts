import { Args, Context, Mutation, Resolver } from '@nestjs/graphql'

import { GqlContext } from '@/src/shared/types'

import { UserModel } from '../account/models'

import { LoginInput } from './inputs'
import { SessionService } from './session.service'

@Resolver('Session')
export class SessionResolver {
	public constructor(private readonly sessionService: SessionService) {}

	@Mutation(() => UserModel, { name: 'loginUser' })
	public async login(
		@Context() { req }: GqlContext,
		@Args('data') input: LoginInput
	) {
		return this.sessionService.login(req, input)
	}

	@Mutation(() => Boolean, { name: 'logoutUser' })
	public async logout(@Context() { req, res }: GqlContext) {
		return this.sessionService.logout(req, res)
	}
}
