/**
 * Health check routes
 */

import { Hono } from 'hono'
import type { Bindings, Variables } from '../types/context'

const health = new Hono<{ Bindings: Bindings; Variables: Variables }>()

/**
 * GET /api/health
 * Basic health check endpoint
 */
health.get('/', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'TripSync API',
  })
})

/**
 * GET /api/health/db
 * Database health check
 */
health.get('/db', async (c) => {
  try {
    // Simple query to check DB connectivity
    const result = await c.env.DB.prepare('SELECT 1 as health').first()

    if (result?.health === 1) {
      return c.json({
        status: 'healthy',
        database: 'connected',
        timestamp: new Date().toISOString(),
      })
    }

    return c.json(
      {
        status: 'unhealthy',
        database: 'disconnected',
        timestamp: new Date().toISOString(),
      },
      503
    )
  } catch (error) {
    return c.json(
      {
        status: 'unhealthy',
        database: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      503
    )
  }
})

export default health
