/**
 * User validation schemas using Zod
 */

import { z } from 'zod'

/**
 * Schema for user registration
 */
export const UserCreateSchema = z.object({
  email: z.string().email('Invalid email address'),
  full_name: z.string().min(1, 'Full name is required').max(100),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  college_name: z.string().min(1, 'College name is required'),
})

/**
 * Schema for user login (OAuth2 password flow)
 */
export const LoginSchema = z.object({
  username: z.string().email('Invalid email address'), // OAuth2 uses 'username' field
  password: z.string().min(1, 'Password is required'),
})

/**
 * Schema for user response (without password)
 */
export const UserResponseSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  full_name: z.string(),
  college_id: z.number(),
})

/**
 * Schema for college
 */
export const CollegeSchema = z.object({
  id: z.number(),
  name: z.string(),
})

// Type exports
export type UserCreate = z.infer<typeof UserCreateSchema>
export type LoginCredentials = z.infer<typeof LoginSchema>
export type UserResponse = z.infer<typeof UserResponseSchema>
export type CollegeType = z.infer<typeof CollegeSchema>
