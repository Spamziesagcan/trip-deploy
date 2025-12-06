/**
 * User service
 * Handles user-related database operations
 */

import type { D1Database } from '@cloudflare/workers-types'
import type { User } from '../types/context'
import { throwNotFound } from '../middleware/error.middleware'

/**
 * Get user by ID
 */
export async function getUserById(db: D1Database, userId: number): Promise<User> {
  const user = await db
    .prepare('SELECT * FROM users WHERE id = ?')
    .bind(userId)
    .first<User>()

  if (!user) {
    throwNotFound('User not found')
  }

  return user!
}

/**
 * Get user by email
 */
export async function getUserByEmail(db: D1Database, email: string): Promise<User | null> {
  const user = await db
    .prepare('SELECT * FROM users WHERE email = ?')
    .bind(email)
    .first<User>()

  return user
}

/**
 * Update user's full name
 */
export async function updateUserName(
  db: D1Database,
  userId: number,
  fullName: string
): Promise<void> {
  await db
    .prepare('UPDATE users SET full_name = ? WHERE id = ?')
    .bind(fullName, userId)
    .run()
}

/**
 * Delete user and all related data (cascading)
 */
export async function deleteUser(db: D1Database, userId: number): Promise<void> {
  const user = await getUserById(db, userId)

  // Delete user (profile will cascade)
  await db
    .prepare('DELETE FROM users WHERE id = ?')
    .bind(user.id)
    .run()
}

/**
 * Get users from the same college
 */
export async function getUsersByCollege(
  db: D1Database,
  collegeId: number,
  limit: number = 50
): Promise<User[]> {
  const result = await db
    .prepare(
      `SELECT id, email, full_name, college_id, created_at
       FROM users
       WHERE college_id = ?
       LIMIT ?`
    )
    .bind(collegeId, limit)
    .all<User>()

  return result.results || []
}
