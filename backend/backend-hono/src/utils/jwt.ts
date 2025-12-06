/**
 * JWT utilities
 * Token creation and verification
 */

import { sign } from 'hono/jwt'

/**
 * Create a JWT access token
 */
export async function createAccessToken(
  email: string,
  secret: string,
  expiresInMinutes: number
): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const exp = now + expiresInMinutes * 60

  const payload = {
    sub: email,
    iat: now,
    exp: exp,
  }

  return sign(payload, secret)
}
