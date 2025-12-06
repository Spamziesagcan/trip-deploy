/**
 * Global error handling middleware for Hono
 */

import type { ErrorHandler } from 'hono'
import { HTTPException } from 'hono/http-exception'

/**
 * Custom application error class
 */
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

/**
 * Global error handler
 * Catches all errors and returns consistent JSON responses
 */
export const errorHandler: ErrorHandler = (err, c) => {
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    path: c.req.path,
    method: c.req.method,
  })

  // Handle Hono's built-in HTTPException
  if (err instanceof HTTPException) {
    return c.json(
      {
        error: err.message,
        statusCode: err.status,
      },
      err.status
    )
  }

  // Handle custom AppError
  if (err instanceof AppError) {
    return c.json(
      {
        error: err.message,
        statusCode: err.statusCode,
        code: err.code,
      },
      err.statusCode as any
    )
  }

  // Handle validation errors (from Zod)
  if (err.name === 'ZodError') {
    return c.json(
      {
        error: 'Validation Error',
        statusCode: 400,
        details: (err as any).issues || (err as any).errors,
      },
      400
    )
  }

  // Handle JWT errors
  if (err.message?.includes('jwt') || err.message?.includes('token')) {
    return c.json(
      {
        error: 'Unauthorized',
        message: 'Invalid or expired token',
        statusCode: 401,
      },
      401
    )
  }

  // Default error response
  return c.json(
    {
      error: 'Internal Server Error',
      message: err.message || 'An unexpected error occurred',
      statusCode: 500,
    },
    500
  )
}

/**
 * Helper functions to throw errors
 */
export const throwBadRequest = (message: string): never => {
  throw new AppError(message, 400, 'BAD_REQUEST')
}

export const throwUnauthorized = (message: string = 'Unauthorized'): never => {
  throw new AppError(message, 401, 'UNAUTHORIZED')
}

export const throwForbidden = (message: string = 'Forbidden'): never => {
  throw new AppError(message, 403, 'FORBIDDEN')
}

export const throwNotFound = (message: string = 'Not Found'): never => {
  throw new AppError(message, 404, 'NOT_FOUND')
}

export const throwConflict = (message: string): never => {
  throw new AppError(message, 409, 'CONFLICT')
}

export const throwInternalError = (message: string = 'Internal Server Error'): never => {
  throw new AppError(message, 500, 'INTERNAL_ERROR')
}
