import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import multer from 'multer'
import { AppError } from '../utils/errors.js'

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof multer.MulterError) {
    // LIMIT_FILE_SIZE → 413 con mensaje en español (specs de avatar/documentos)
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: {
          code: 'PAYLOAD_TOO_LARGE',
          message: 'El archivo supera el tamaño máximo permitido (2 MB para avatar, 5 MB por documento)',
        },
      })
    }
    return res.status(400).json({
      error: { code: err.code, message: err.message },
    })
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    })
  }

  if (err instanceof z.ZodError) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: err.errors,
      },
    })
  }

  // Unexpected error
  console.error('[ERROR]', err)
  return res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  })
}
