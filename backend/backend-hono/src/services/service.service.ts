/**
 * Service post service
 * Handles service post CRUD operations
 */

import type { D1Database } from '@cloudflare/workers-types'
import type {
  ServicePostCreate,
  ServicePostResponse,
  ServicePostDetail,
} from '../schemas/service.schema'
import type { User, ServicePost } from '../types/context'
import { throwNotFound, throwForbidden } from '../middleware/error.middleware'

/**
 * Create a new service post
 */
export async function createServicePost(
  db: D1Database,
  user: User,
  postData: ServicePostCreate
): Promise<ServicePostDetail> {
  // Create the service post
  const result = await db
    .prepare(
      `INSERT INTO service_posts (
        poster_user_id, title, description, status, is_paid, price, created_at, updated_at
      ) VALUES (?, ?, ?, 'open', ?, ?, datetime('now'), datetime('now'))
      RETURNING *`
    )
    .bind(
      user.id,
      postData.title,
      postData.description,
      postData.is_paid ? 1 : 0,
      postData.is_paid && postData.price ? postData.price : null
    )
    .first<ServicePost>()

  if (!result) {
    throw new Error('Failed to create service post')
  }

  const postId = result.id

  // Create requirements
  for (const req of postData.requirements) {
    await db
      .prepare('INSERT INTO service_requirements (service_post_id, requirement) VALUES (?, ?)')
      .bind(postId, req)
      .run()
  }

  // Create filters
  for (const filter of postData.filters) {
    await db
      .prepare(
        'INSERT INTO service_filters (service_post_id, filter_type, filter_value) VALUES (?, ?, ?)'
      )
      .bind(postId, filter.type, filter.value)
      .run()
  }

  // Return the created post with all details
  return getServicePostById(db, postId) as Promise<ServicePostDetail>
}

/**
 * Get all service posts (with pagination)
 */
export async function getAllServicePosts(
  db: D1Database,
  skip: number = 0,
  limit: number = 20
): Promise<ServicePostResponse[]> {
  const posts = await db
    .prepare(
      `SELECT 
        sp.id, sp.title, sp.poster_user_id, sp.is_paid, sp.price, sp.status, sp.created_at,
        u.full_name
       FROM service_posts sp
       JOIN users u ON sp.poster_user_id = u.id
       WHERE sp.status = 'open'
       ORDER BY sp.created_at DESC
       LIMIT ? OFFSET ?`
    )
    .bind(limit, skip)
    .all<ServicePost & { full_name: string }>()

  if (!posts.results) {
    return []
  }

  return posts.results.map((post) => ({
    id: post.id,
    title: post.title,
    poster_user_id: post.poster_user_id,
    is_paid: Boolean(post.is_paid),
    price: post.price,
    status: post.status,
    created_at: post.created_at,
    poster: {
      full_name: post.full_name,
      profile_image_url: null, // TODO: Add image support
    },
  }))
}

/**
 * Get a single service post by ID with full details
 */
export async function getServicePostById(
  db: D1Database,
  postId: number
): Promise<ServicePostDetail | null> {
  // Get the main post
  const post = await db
    .prepare(
      `SELECT 
        sp.*, u.full_name
       FROM service_posts sp
       JOIN users u ON sp.poster_user_id = u.id
       WHERE sp.id = ?`
    )
    .bind(postId)
    .first<ServicePost & { full_name: string }>()

  if (!post) {
    return null
  }

  // Get requirements
  const requirements = await db
    .prepare('SELECT requirement FROM service_requirements WHERE service_post_id = ?')
    .bind(postId)
    .all<{ requirement: string }>()

  // Get filters
  const filters = await db
    .prepare('SELECT filter_type, filter_value FROM service_filters WHERE service_post_id = ?')
    .bind(postId)
    .all<{ filter_type: string; filter_value: string }>()

  return {
    id: post.id,
    title: post.title,
    description: post.description,
    poster_user_id: post.poster_user_id,
    is_paid: Boolean(post.is_paid),
    price: post.price,
    status: post.status,
    created_at: post.created_at,
    poster: {
      full_name: post.full_name,
      profile_image_url: null, // TODO: Add image support
    },
    requirements: requirements.results?.map((r) => r.requirement) || [],
    filters:
      filters.results?.map((f) => ({
        type: f.filter_type,
        value: f.filter_value,
      })) || [],
  }
}

/**
 * Delete a service post (owner only)
 */
export async function deleteServicePost(
  db: D1Database,
  postId: number,
  user: User
): Promise<void> {
  // Check if post exists and get owner
  const post = await db
    .prepare('SELECT poster_user_id FROM service_posts WHERE id = ?')
    .bind(postId)
    .first<{ poster_user_id: number }>()

  if (!post) {
    throwNotFound('Service post not found')
  }

  // Check ownership
  if (post!.poster_user_id !== user.id) {
    throwForbidden('Not authorized to delete this post')
  }

  // Delete the post (cascade will delete requirements and filters)
  await db.prepare('DELETE FROM service_posts WHERE id = ?').bind(postId).run()
}
