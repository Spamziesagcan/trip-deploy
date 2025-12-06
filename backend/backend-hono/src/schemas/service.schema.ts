/**
 * Service post validation schemas using Zod
 */

import { z } from 'zod'

/**
 * Schema for creating a service post
 */
export const ServicePostCreateSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  is_paid: z.boolean().default(false),
  price: z.number().positive('Price must be greater than 0').optional().nullable(),
  requirements: z.array(z.string()).default([]),
  filters: z
    .array(
      z.object({
        type: z.string(),
        value: z.string(),
      })
    )
    .default([]),
})

/**
 * Schema for profile base (poster info)
 */
export const ProfileBaseSchema = z.object({
  full_name: z.string(),
  profile_image_url: z.string().nullable(),
})

/**
 * Schema for service post response
 */
export const ServicePostResponseSchema = z.object({
  id: z.number(),
  title: z.string(),
  poster_user_id: z.number(),
  is_paid: z.boolean(),
  price: z.number().nullable(),
  status: z.string(),
  created_at: z.string(),
  poster: ProfileBaseSchema,
})

/**
 * Schema for service post detail response
 */
export const ServicePostDetailSchema = ServicePostResponseSchema.extend({
  description: z.string(),
  requirements: z.array(z.string()),
  filters: z.array(
    z.object({
      type: z.string(),
      value: z.string(),
    })
  ),
})

// Type exports
export type ServicePostCreate = z.infer<typeof ServicePostCreateSchema>
export type ProfileBase = z.infer<typeof ProfileBaseSchema>
export type ServicePostResponse = z.infer<typeof ServicePostResponseSchema>
export type ServicePostDetail = z.infer<typeof ServicePostDetailSchema>
