/**
 * Pooling routes
 * Handles ride pooling requests and matching
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import type { Bindings, Variables } from '../types/context.js'
import { PoolingRequestCreateSchema } from '../schemas/pooling.schema.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { createPoolingRequest, findMatches } from '../services/pooling.service.js'

const pooling = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Apply auth middleware to all pooling routes
pooling.use('*', authMiddleware)

/**
 * POST /api/pool/requests
 * Create a pooling request and find matches
 */
pooling.post('/requests', zValidator('json', PoolingRequestCreateSchema), async (c) => {
  const requestData = c.req.valid('json')
  const db = c.env.DB
  const user = c.get('user')!
  const olaApiKey = c.env.OLA_MAPS_API_KEY

  // Create the pooling request
  const newRequest = await createPoolingRequest(db, user.id, requestData)

  // Find matches for this request
  const matches = await findMatches(db, newRequest, user, olaApiKey)

  return c.json({
    request_id: newRequest.id,
    matches,
  })
})

export default pooling
