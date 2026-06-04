import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { config } from '../config/index.js'
import { errors } from '../utils/errors.js'

export interface AuthPayload {
  sub: string
  role: string
  email: string
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload
    }
  }
}

export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return next(errors.unauthorized('Missing or invalid authorization header'))
  }

  const token = header.slice(7)
  try {
    const payload = jwt.verify(token, config.jwt.secret) as AuthPayload
    req.user = payload
    next()
  } catch {
    next(errors.unauthorized('Invalid or expired token'))
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(errors.unauthorized())
    if (!roles.includes(req.user.role)) {
      return next(errors.forbidden('Insufficient permissions'))
    }
    next()
  }
}
