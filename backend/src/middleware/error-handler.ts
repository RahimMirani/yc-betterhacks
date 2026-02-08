import { Request, Response, NextFunction } from 'express'
import { ApiResponse } from '../types'

export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response<ApiResponse<never>>,
  _next: NextFunction,
): void {
  const statusCode = err instanceof AppError ? err.statusCode : 500
  const message = err instanceof AppError ? err.message : 'Internal server error'

  if (statusCode === 500) {
    console.error('Unhandled error:', err)
  }

  res.status(statusCode).json({
    success: false,
    error: message,
  })
}
