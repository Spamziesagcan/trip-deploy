/**
 * Profile service
 * Handles user profile operations
 */

import type { D1Database } from '@cloudflare/workers-types'
import type { ProfileUpdate, ProfileResponse } from '../schemas/profile.schema'
import type { User, Profile } from '../types/context'
import { throwNotFound } from '../middleware/error.middleware'

/**
 * Get user's profile with all details
 */
export async function getUserProfile(db: D1Database, user: User): Promise<ProfileResponse> {
  // Fetch user with profile and college
  const result = await db
    .prepare(
      `SELECT 
        u.full_name, u.email,
        c.name as college_name,
        p.username, p.phone_number, p.bio, p.year_of_study,
        p.reviews, p.preferences, p.social_media_links, p.emergency_contact
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       LEFT JOIN colleges c ON u.college_id = c.id
       WHERE u.id = ?`
    )
    .bind(user.id)
    .first<{
      full_name: string
      email: string
      college_name: string
      username: string | null
      phone_number: string | null
      bio: string | null
      year_of_study: string | null
      reviews: string | null
      preferences: string | null
      social_media_links: string | null
      emergency_contact: string | null
    }>()

  if (!result) {
    throwNotFound('Profile not found')
  }

  // Parse JSON fields
  const parseJson = (jsonStr: string | null) => {
    if (!jsonStr) return null
    try {
      return JSON.parse(jsonStr)
    } catch {
      return null
    }
  }

  return {
    full_name: result!.full_name,
    email: result!.email,
    college_name: result!.college_name,
    username: result!.username,
    phone_number: result!.phone_number,
    bio: result!.bio,
    year_of_study: result!.year_of_study,
    reviews: parseJson(result!.reviews),
    preferences: parseJson(result!.preferences),
    social_media_links: parseJson(result!.social_media_links),
    emergency_contact: parseJson(result!.emergency_contact),
    has_resume: false, // TODO: Implement resume check
  }
}

/**
 * Update user's profile
 */
export async function updateUserProfile(
  db: D1Database,
  user: User,
  updateData: ProfileUpdate
): Promise<ProfileResponse> {
  // Ensure profile exists
  const profile = await db
    .prepare('SELECT id FROM profiles WHERE user_id = ?')
    .bind(user.id)
    .first<Profile>()

  if (!profile) {
    // Create profile if it doesn't exist
    await db.prepare('INSERT INTO profiles (user_id) VALUES (?)').bind(user.id).run()
  }

  // Update user's full_name if provided
  if (updateData.full_name) {
    await db
      .prepare('UPDATE users SET full_name = ? WHERE id = ?')
      .bind(updateData.full_name, user.id)
      .run()
  }

  // Build profile update query dynamically
  const updates: string[] = []
  const values: any[] = []

  if (updateData.username !== undefined) {
    updates.push('username = ?')
    values.push(updateData.username)
  }
  if (updateData.phone_number !== undefined) {
    updates.push('phone_number = ?')
    values.push(updateData.phone_number)
  }
  if (updateData.bio !== undefined) {
    updates.push('bio = ?')
    values.push(updateData.bio)
  }
  if (updateData.year_of_study !== undefined) {
    updates.push('year_of_study = ?')
    values.push(updateData.year_of_study)
  }
  if (updateData.preferences !== undefined) {
    updates.push('preferences = ?')
    values.push(updateData.preferences ? JSON.stringify(updateData.preferences) : null)
  }
  if (updateData.social_media_links !== undefined) {
    updates.push('social_media_links = ?')
    values.push(
      updateData.social_media_links ? JSON.stringify(updateData.social_media_links) : null
    )
  }
  if (updateData.emergency_contact !== undefined) {
    updates.push('emergency_contact = ?')
    values.push(updateData.emergency_contact ? JSON.stringify(updateData.emergency_contact) : null)
  }

  if (updates.length > 0) {
    const query = `UPDATE profiles SET ${updates.join(', ')} WHERE user_id = ?`
    await db.prepare(query).bind(...values, user.id).run()
  }

  // Return updated profile
  return getUserProfile(db, user)
}
