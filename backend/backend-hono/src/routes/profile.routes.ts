/**
 * Profile routes
 * Handles user profile management
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import type { Bindings, Variables } from '../types/context.js'
import { ProfileUpdateSchema } from '../schemas/profile.schema.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { getUserProfile, updateUserProfile } from '../services/profile.service.js'

const profile = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Apply auth middleware to all profile routes
profile.use('*', authMiddleware)

/**
 * GET /api/profile/me
 * Get current user's profile
 */
profile.get('/me', async (c) => {
  const db = c.env.DB
  const user = c.get('user')!

  const profileData = await getUserProfile(db, user)

  return c.json(profileData)
})

/**
 * PUT /api/profile/me
 * Update current user's profile
 */
profile.put('/me', zValidator('json', ProfileUpdateSchema), async (c) => {
  const updateData = c.req.valid('json')
  const db = c.env.DB
  const user = c.get('user')!

  const updatedProfile = await updateUserProfile(db, user, updateData)

  return c.json(updatedProfile)
})

export default profile
