/**
 * Type definitions for Hono context
 * Defines Cloudflare bindings and request variables
 */

import type { D1Database } from '@cloudflare/workers-types'

/**
 * Cloudflare Workers bindings
 * These are injected by Cloudflare and configured in wrangler.jsonc
 */
export interface Bindings {
  // D1 Database binding
  DB: D1Database

  // Environment variables / secrets
  JWT_SECRET: string
  JWT_ALGORITHM: string
  ACCESS_TOKEN_EXPIRE_MINUTES: string
  OLA_MAPS_API_KEY: string

  // Durable Object bindings (for WebSocket)
  POOLING_WS?: DurableObjectNamespace

  // R2 bucket (if using file uploads)
  R2_BUCKET?: R2Bucket
}

/**
 * Request-scoped variables
 * Set by middleware and accessible in route handlers
 */
export interface Variables {
  // Current authenticated user (set by auth middleware)
  user?: User
}

/**
 * User type from database
 */
export interface User {
  id: number
  email: string
  full_name: string
  hashed_password: string
  college_id: number
  created_at: string
}

/**
 * College type from database
 */
export interface College {
  id: number
  name: string
}

/**
 * Profile type from database
 */
export interface Profile {
  id: number
  user_id: number
  username: string | null
  phone_number: string | null
  bio: string | null
  year_of_study: string | null
  reviews: string | null // JSON string
  preferences: string | null // JSON string
  social_media_links: string | null // JSON string
  emergency_contact: string | null // JSON string
}

/**
 * Pooling Request type from database
 */
export interface PoolingRequest {
  id: number
  user_id: number
  status: 'active' | 'matched' | 'completed' | 'cancelled'
  start_latitude: number
  start_longitude: number
  destination_latitude: number
  destination_longitude: number
  destination_name: string | null
  created_at: string
}

/**
 * Service Post type from database
 */
export interface ServicePost {
  id: number
  poster_user_id: number
  title: string
  description: string
  status: 'open' | 'in_progress' | 'completed' | 'cancelled'
  is_paid: number // SQLite boolean (0 or 1)
  price: number | null
  created_at: string
  updated_at: string
}

/**
 * Service Requirement type from database
 */
export interface ServiceRequirement {
  id: number
  service_post_id: number
  requirement: string
}

/**
 * Service Filter type from database
 */
export interface ServiceFilter {
  id: number
  service_post_id: number
  filter_type: string
  filter_value: string
}
