import type { NextFunction, Request, Response } from 'express'

export const asyncMiddleware = <P, ResBody, ReqBody, ReqQuery, Locals>(
	middleware: (
		req: Request<P, ResBody, ReqBody, ReqQuery, Locals>,
		res: Response<ResBody, Locals>,
		next: NextFunction
	) => Promise<any> | any) => (
		req: Request<P, ResBody, ReqBody, ReqQuery, Locals>,
		res: Response<ResBody, Locals>,
		next: NextFunction
	) => (() => {
		const cb = <T>(...args: ReadonlyArray<T>) => {
			return next(...args)
		}
		return (async () => {
			try {
				await middleware(req, res, cb);
			} catch (err) {
				return cb(err);
			}
		})()
	})();
