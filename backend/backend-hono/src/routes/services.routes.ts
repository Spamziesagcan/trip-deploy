/**
 * Services routes
 * Handles service post CRUD operations
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import type { Bindings, Variables } from '../types/context.js'
import { ServicePostCreateSchema } from '../schemas/service.schema.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import {
  createServicePost,
  getAllServicePosts,
  getServicePostById,
  deleteServicePost,
} from '../services/service.service.js'

const services = new Hono<{ Bindings: Bindings; Variables: Variables }>()

/**
 * GET /api/services
 * Get all service posts (public)
 */
services.get('/', async (c) => {
  const db = c.env.DB
  const skip = parseInt(c.req.query('skip') || '0')
  const limit = parseInt(c.req.query('limit') || '20')

  const posts = await getAllServicePosts(db, skip, limit)

  return c.json(posts)
})

/**
 * GET /api/services/:id
 * Get a single service post by ID (public)
 */
services.get('/:id', async (c) => {
  const db = c.env.DB
  const postId = parseInt(c.req.param('id'))

  const post = await getServicePostById(db, postId)

  if (!post) {
    return c.json({ error: 'Service post not found' }, 404)
  }

  return c.json(post)
})

/**
 * POST /api/services
 * Create a new service post (authenticated)
 */
services.post('/', authMiddleware, zValidator('json', ServicePostCreateSchema), async (c) => {
  const postData = c.req.valid('json')
  const db = c.env.DB
  const user = c.get('user')!

  const newPost = await createServicePost(db, user, postData)

  return c.json(newPost, 201)
})

/**
 * DELETE /api/services/:id
 * Delete a service post (authenticated, owner only)
 */
services.delete('/:id', authMiddleware, async (c) => {
  const db = c.env.DB
  const postId = parseInt(c.req.param('id'))
  const user = c.get('user')!

  await deleteServicePost(db, postId, user)

  return c.body(null, 204)
})

export default services
