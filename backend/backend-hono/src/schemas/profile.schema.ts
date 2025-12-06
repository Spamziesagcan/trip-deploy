/**
 * Profile validation schemas using Zod
 */

import { z } from 'zod'

/**
 * Schema for profile update
 */
export const ProfileUpdateSchema = z.object({
  username: z.string().max(50).optional().nullable(),
  full_name: z.string().min(1).max(100).optional(),
  phone_number: z.string().optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  year_of_study: z.string().optional().nullable(),
  preferences: z.record(z.any()).optional().nullable(),
  social_media_links: z.record(z.any()).optional().nullable(),
  emergency_contact: z.record(z.any()).optional().nullable(),
})

/**
 * Schema for profile response
 */
export const ProfileResponseSchema = z.object({
  full_name: z.string(),
  email: z.string().email(),
  college_name: z.string(),
  username: z.string().nullable(),
  phone_number: z.string().nullable(),
  bio: z.string().nullable(),
  year_of_study: z.string().nullable(),
  reviews: z.record(z.any()).nullable(),
  preferences: z.record(z.any()).nullable(),
  social_media_links: z.record(z.any()).nullable(),
  emergency_contact: z.record(z.any()).nullable(),
  has_resume: z.boolean(),
})

// Type exports
export type ProfileUpdate = z.infer<typeof ProfileUpdateSchema>
export type ProfileResponse = z.infer<typeof ProfileResponseSchema>
