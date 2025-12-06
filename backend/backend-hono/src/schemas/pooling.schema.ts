/**
 * Pooling validation schemas using Zod
 */

import { z } from 'zod'

/**
 * Schema for creating a pooling request
 */
export const PoolingRequestCreateSchema = z.object({
  start_latitude: z.number().min(-90).max(90),
  start_longitude: z.number().min(-180).max(180),
  destination_latitude: z.number().min(-90).max(90),
  destination_longitude: z.number().min(-180).max(180),
  destination_name: z.string().optional().nullable(),
})

/**
 * Schema for matched user response
 */
export const MatchedUserSchema = z.object({
  id: z.number(),
  full_name: z.string(),
  phone_number: z.string().nullable(),
  profile_image_url: z.string().nullable(),
})

/**
 * Schema for pooling match response
 */
export const PoolingMatchResponseSchema = z.object({
  request_id: z.number(),
  matches: z.array(MatchedUserSchema),
})

// Type exports
export type PoolingRequestCreate = z.infer<typeof PoolingRequestCreateSchema>
export type MatchedUser = z.infer<typeof MatchedUserSchema>
export type PoolingMatchResponse = z.infer<typeof PoolingMatchResponseSchema>
