/**
 * Authentication middleware
 * Validates JWT tokens and extracts user information
 */

import type { Context, Next } from 'hono'
import { jwt } from 'hono/jwt'
import type { Bindings, Variables, User } from '../types/context'
import { throwUnauthorized } from './error.middleware'

/**
 * JWT middleware - validates the token
 */
export const jwtMiddleware = (c: Context<{ Bindings: Bindings }>) => {
  return jwt({
    secret: c.env.JWT_SECRET,
  })
}

/**
 * Auth middleware - extracts user from database after JWT validation
 */
export const authMiddleware = async (
  c: Context<{ Bindings: Bindings; Variables: Variables }>,
  next: Next
) => {
  // First, validate the JWT token
  const authHeader = c.req.header('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return throwUnauthorized('Missing or invalid Authorization header')
  }

  const token = authHeader.substring(7) // Remove 'Bearer ' prefix

  try {
    // Verify JWT using hono/jwt
    const { verify } = await import('hono/jwt')
    const payload = await verify(token, c.env.JWT_SECRET)

    const email = payload.sub as string

    if (!email) {
      return throwUnauthorized('Invalid token payload')
    }

    // Fetch user from database
    const user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?')
      .bind(email)
      .first<User>()

    if (!user) {
      return throwUnauthorized('User not found')
    }

    // Store user in context for use in route handlers
    c.set('user', user)

    await next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    return throwUnauthorized('Invalid or expired token')
  }
}
