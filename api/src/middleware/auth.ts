import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export interface AuthPayload { userId: string; role: 'admin' | 'agent' | 'user' }

declare global {
	namespace Express {
		interface Request { auth?: AuthPayload }
	}
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
	const header = req.headers.authorization || '';
	const bearer = header.startsWith('Bearer ') ? header.slice(7) : undefined;
	const cookieToken = (req as any).cookies?.access_token as string | undefined;
	const token = bearer || cookieToken;
	if (!token) return res.status(401).json({ error: 'Unauthorized' });
	try {
		const payload = jwt.verify(token, config.jwtSecret) as AuthPayload;
		req.auth = payload;
		return next();
	} catch {
		return res.status(401).json({ error: 'Unauthorized' });
	}
}

export function requireRole(...roles: Array<'admin'|'agent'|'user'>) {
	return (req: Request, res: Response, next: NextFunction) => {
		if (!req.auth) return res.status(401).json({ error: 'Unauthorized' });
		if (!roles.includes(req.auth.role)) return res.status(403).json({ error: 'Forbidden' });
		return next();
	};
}


