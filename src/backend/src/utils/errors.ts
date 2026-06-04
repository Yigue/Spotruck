export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export const errors = {
  notFound: (resource = 'Resource') =>
    new AppError(404, 'NOT_FOUND', `${resource} not found`),

  unauthorized: (reason = 'Unauthorized') =>
    new AppError(401, 'UNAUTHORIZED', reason),

  forbidden: (reason = 'Forbidden') =>
    new AppError(403, 'FORBIDDEN', reason),

  badRequest: (reason = 'Bad request', details?: unknown) =>
    new AppError(400, 'BAD_REQUEST', reason, details),

  conflict: (reason = 'Conflict') =>
    new AppError(409, 'CONFLICT', reason),

  tooManyRequests: (reason = 'Too many requests') =>
    new AppError(429, 'TOO_MANY_REQUESTS', reason),

  internal: (reason = 'Internal server error') =>
    new AppError(500, 'INTERNAL_ERROR', reason),
}
