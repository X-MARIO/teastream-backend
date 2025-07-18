import { Request, Response } from 'express'

export interface GqlContext {
	readonly req: Request
	readonly res: Response
}
