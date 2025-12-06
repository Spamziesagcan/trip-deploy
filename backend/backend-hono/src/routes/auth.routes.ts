/**
 * Authentication routes
 * Handles user registration and login
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import type { Bindings, Variables } from '../types/context'
import { UserCreateSchema, LoginSchema } from '../schemas/user.schema'
import { registerUser, loginUser } from '../services/auth.service'

const auth = new Hono<{ Bindings: Bindings; Variables: Variables }>()

/**
 * POST /api/auth/register
 * Register a new user
 */
auth.post('/register', zValidator('json', UserCreateSchema), async (c) => {
  const userData = c.req.valid('json')
  const db = c.env.DB

  try {
    const user = await registerUser(db, userData)

    return c.json(user, 201)
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      return c.json(
        {
          error: 'Email already registered',
        },
        400
      )
    }
    throw error
  }
})

/**
 * POST /api/auth/token
 * Login and get JWT token (OAuth2 password flow)
 */
auth.post('/token', zValidator('form', LoginSchema), async (c) => {
  const credentials = c.req.valid('form')
  const db = c.env.DB
  const jwtSecret = c.env.JWT_SECRET
  const expiresIn = parseInt(c.env.ACCESS_TOKEN_EXPIRE_MINUTES) || 30

  const tokenResponse = await loginUser(db, credentials, jwtSecret, expiresIn)

  return c.json(tokenResponse)
})

export default auth
