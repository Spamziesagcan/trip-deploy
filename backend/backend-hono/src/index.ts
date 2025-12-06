/**
 * TripSync API - Hono on Cloudflare Workers
 * 
 * Main application entry point with clean architecture:
 * - Global middleware (CORS, logging, error handling)
 * - API route mounting with /api prefix
 * - Type-safe context with D1 database bindings
 * - Cloudflare Workers compatible
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'

// Types
import type { Bindings, Variables } from './types/context'

// Middleware
import { errorHandler } from './middleware/error.middleware'

// Route Modules
import authRoutes from './routes/auth.routes'
import healthRoutes from './routes/health.routes'
import poolingRoutes from './routes/pooling.routes'
import profileRoutes from './routes/profile.routes'
import servicesRoutes from './routes/services.routes'

// ============================================================================
// Application Setup
// ============================================================================

// Create Hono app with type-safe bindings (D1, secrets, etc.)
const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// ============================================================================
// Global Middleware (Applied to all routes)
// ============================================================================

/**
 * Logger - Logs all incoming requests
 * Format: [METHOD] /path - status time
 */
app.use('*', logger())

/**
 * Pretty JSON - Formats JSON responses with indentation
 * Note: Minimal performance impact on edge runtime
 */
app.use('*', prettyJSON())

/**
 * CORS - Cross-Origin Resource Sharing
 * Allows frontend apps to access the API from any origin
 */
app.use(
  '*',
  cors({
    origin: '*', // Allow all origins (configure for production)
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
)

// ============================================================================
// Routes
// ============================================================================

/**
 * Root endpoint - API status check
 */
app.get('/', (c) => {
  return c.json({
    message: 'TripSync API is running!',
    version: '2.0.0',
    runtime: 'Cloudflare Workers + Hono',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      pooling: '/api/pool',
      profile: '/api/profile',
      services: '/api/services',
    },
  })
})

/**
 * API Router - All API routes are prefixed with /api
 */
const api = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Mount feature routes
api.route('/health', healthRoutes)   // Health check endpoint
api.route('/auth', authRoutes)       // Authentication (signup, login)
api.route('/pool', poolingRoutes)    // Ride pooling (create, match)
api.route('/profile', profileRoutes) // User profiles
api.route('/services', servicesRoutes) // Service marketplace

// Mount API router
app.route('/api', api)

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Global error handler
 * Catches all errors and returns standardized JSON responses
 */
app.onError(errorHandler)

/**
 * 404 Not Found handler
 * Handles undefined routes with proper error response
 */
app.notFound((c) => {
  return c.json(
    {
      error: 'Not Found',
      message: `Route ${c.req.method} ${c.req.path} not found`,
      hint: 'Check the available endpoints at /',
    },
    404
  )
})

// ============================================================================
// Export
// ============================================================================

/**
 * Export default app for Cloudflare Workers
 * The Workers runtime expects a default export with fetch handler
 */
export default app
