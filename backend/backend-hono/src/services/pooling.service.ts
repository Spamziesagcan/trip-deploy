/**
 * Pooling service
 * Handles ride pooling requests and matching logic
 */

import type { D1Database } from '@cloudflare/workers-types'
import type { PoolingRequestCreate, MatchedUser } from '../schemas/pooling.schema.js'
import type { PoolingRequest, User } from '../types/context.js'
import { getDistancesFromOla } from '../utils/distance.js'

// Constants for matching
const START_LOCATION_RADIUS_METERS = 5000 // 5km
const DESTINATION_RADIUS_METERS = 5000 // 5km
const ACTIVE_TIMEOUT_MINUTES = 15

/**
 * Create or update a pooling request for a user
 */
export async function createPoolingRequest(
  db: D1Database,
  userId: number,
  requestData: PoolingRequestCreate
): Promise<PoolingRequest> {
  // Cancel any existing active requests for this user
  await db
    .prepare(
      `UPDATE pooling_requests 
       SET status = 'cancelled' 
       WHERE user_id = ? AND status = 'active'`
    )
    .bind(userId)
    .run()

  // Create new request
  const result = await db
    .prepare(
      `INSERT INTO pooling_requests (
        user_id, status, start_latitude, start_longitude, 
        destination_latitude, destination_longitude, destination_name, created_at
      ) VALUES (?, 'active', ?, ?, ?, ?, ?, datetime('now'))
      RETURNING *`
    )
    .bind(
      userId,
      requestData.start_latitude,
      requestData.start_longitude,
      requestData.destination_latitude,
      requestData.destination_longitude,
      requestData.destination_name || null
    )
    .first<PoolingRequest>()

  if (!result) {
    throw new Error('Failed to create pooling request')
  }

  return result
}

/**
 * Find matches for a pooling request
 */
export async function findMatches(
  db: D1Database,
  newRequest: PoolingRequest,
  currentUser: User,
  olaApiKey: string
): Promise<MatchedUser[]> {
  console.log(`Finding matches for request ID: ${newRequest.id}`)

  // Calculate time threshold
  const now = new Date()
  const threshold = new Date(now.getTime() - ACTIVE_TIMEOUT_MINUTES * 60 * 1000)
  const timeThreshold = threshold.toISOString().replace('T', ' ').substring(0, 19)

  // Find potential matches from the same college
  const potentialMatches = await db
    .prepare(
      `SELECT pr.*, u.college_id
       FROM pooling_requests pr
       JOIN users u ON pr.user_id = u.id
       WHERE pr.status = 'active'
         AND pr.id != ?
         AND u.college_id = ?
         AND pr.created_at >= ?`
    )
    .bind(newRequest.id, currentUser.college_id, timeThreshold)
    .all<PoolingRequest & { college_id: number }>()

  if (!potentialMatches.results || potentialMatches.results.length === 0) {
    console.log('No potential matches found')
    return []
  }

  console.log(`Found ${potentialMatches.results.length} potential matches`)

  // Filter by start location proximity
  const origin: [number, number] = [newRequest.start_latitude, newRequest.start_longitude]
  const destinations: [number, number][] = potentialMatches.results.map((req) => [
    req.start_latitude,
    req.start_longitude,
  ])

  const startDistances = await getDistancesFromOla(origin, destinations, olaApiKey)

  const closeByStart = potentialMatches.results.filter((_, index) => {
    const distance = startDistances[index]
    return distance !== null && distance <= START_LOCATION_RADIUS_METERS
  })

  console.log(`${closeByStart.length} matches passed start location check`)

  if (closeByStart.length === 0) {
    return []
  }

  // Filter by destination location proximity
  const destOrigin: [number, number] = [
    newRequest.destination_latitude,
    newRequest.destination_longitude,
  ]
  const destDestinations: [number, number][] = closeByStart.map((req) => [
    req.destination_latitude,
    req.destination_longitude,
  ])

  const destDistances = await getDistancesFromOla(destOrigin, destDestinations, olaApiKey)

  const matches: MatchedUser[] = []

  for (let i = 0; i < closeByStart.length; i++) {
    const distance = destDistances[i]
    if (distance !== null && distance <= DESTINATION_RADIUS_METERS) {
      const matchedRequest = closeByStart[i]

      console.log(`Valid match found: Request ${newRequest.id} <-> Request ${matchedRequest.id}`)

      // Update both requests to 'matched' status
      await db
        .prepare(`UPDATE pooling_requests SET status = 'matched' WHERE id = ?`)
        .bind(matchedRequest.id)
        .run()

      await db
        .prepare(`UPDATE pooling_requests SET status = 'matched' WHERE id = ?`)
        .bind(newRequest.id)
        .run()

      // Get matched user details
      const matchedUser = await db
        .prepare(
          `SELECT u.id, u.full_name, p.phone_number
           FROM users u
           LEFT JOIN profiles p ON u.id = p.user_id
           WHERE u.id = ?`
        )
        .bind(matchedRequest.user_id)
        .first<{ id: number; full_name: string; phone_number: string | null }>()

      if (matchedUser) {
        matches.push({
          id: matchedUser.id,
          full_name: matchedUser.full_name,
          phone_number: matchedUser.phone_number,
          profile_image_url: null, // TODO: Add image support
        })

        // Only return first match
        break
      }
    }
  }

  console.log(`Returning ${matches.length} matches`)
  return matches
}
