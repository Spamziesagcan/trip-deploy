/**
 * Authentication service
 * Handles user registration, login, and JWT operations
 */

import type { D1Database } from '@cloudflare/workers-types'
import type { UserCreate, LoginCredentials } from '../schemas/user.schema.js'
import type { User, College } from '../types/context.js'
import { hashPassword, verifyPassword } from '../utils/crypto.js'
import { createAccessToken } from '../utils/jwt.js'
import { throwBadRequest, throwUnauthorized } from '../middleware/error.middleware.js'

/**
 * Register a new user
 */
export async function registerUser(db: D1Database, userData: UserCreate) {
  // Check if user already exists
  const existingUser = await db
    .prepare('SELECT id FROM users WHERE email = ?')
    .bind(userData.email)
    .first()

  if (existingUser) {
    throwBadRequest('Email already registered')
  }

  // Get or create college
  const college = await getOrCreateCollege(db, userData.college_name)

  // Hash password
  const hashedPassword = await hashPassword(userData.password)

  // Create user
  const result = await db
    .prepare(
      `INSERT INTO users (email, full_name, hashed_password, college_id, created_at)
       VALUES (?, ?, ?, ?, datetime('now'))
       RETURNING id, email, full_name, college_id`
    )
    .bind(userData.email, userData.full_name, hashedPassword, college.id)
    .first<User>()

  if (!result) {
    throw new Error('Failed to create user')
  }

  // Create default profile for the user
  await db
    .prepare('INSERT INTO profiles (user_id) VALUES (?)')
    .bind(result.id)
    .run()

  return {
    id: result.id,
    email: result.email,
    full_name: result.full_name,
    college_id: result.college_id,
  }
}

/**
 * Login user and return JWT token
 */
export async function loginUser(
  db: D1Database,
  credentials: LoginCredentials,
  jwtSecret: string,
  expiresInMinutes: number
) {
  // Find user by email (username field in OAuth2 flow)
  const user = await db
    .prepare('SELECT * FROM users WHERE email = ?')
    .bind(credentials.username)
    .first<User>()

  if (!user) {
    throwUnauthorized('Incorrect email or password')
  }

  // Verify password
  const isValidPassword = await verifyPassword(credentials.password, user!.hashed_password)

  if (!isValidPassword) {
    throwUnauthorized('Incorrect email or password')
  }

  // Create access token
  const accessToken = await createAccessToken(user!.email, jwtSecret, expiresInMinutes)

  return {
    access_token: accessToken,
    token_type: 'bearer',
  }
}

/**
 * Get or create a college by name
 */
async function getOrCreateCollege(db: D1Database, name: string): Promise<College> {
  // Try to find existing college
  let college = await db
    .prepare('SELECT id, name FROM colleges WHERE name = ?')
    .bind(name)
    .first<College>()

  if (college) {
    return college
  }

  // Create new college
  const result = await db
    .prepare('INSERT INTO colleges (name) VALUES (?) RETURNING id, name')
    .bind(name)
    .first<College>()

  if (!result) {
    throw new Error('Failed to create college')
  }

  return result
}
