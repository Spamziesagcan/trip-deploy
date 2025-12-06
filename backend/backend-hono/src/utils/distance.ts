/**
 * Distance calculation utilities
 * Integration with OLA Maps Distance Matrix API
 */

const OLA_DISTANCE_MATRIX_API_URL = 'https://api.olamaps.io/routing/v1/distanceMatrix/basic'

/**
 * Get distances from OLA Maps API
 */
export async function getDistancesFromOla(
  origin: [number, number],
  destinations: [number, number][],
  apiKey: string
): Promise<(number | null)[]> {
  if (destinations.length === 0) {
    return []
  }

  const originStr = `${origin[0]},${origin[1]}`
  const destinationsStr = destinations.map((dest) => `${dest[0]},${dest[1]}`).join('|')

  const url = new URL(OLA_DISTANCE_MATRIX_API_URL)
  url.searchParams.set('origins', originStr)
  url.searchParams.set('destinations', destinationsStr)
  url.searchParams.set('api_key', apiKey)

  try {
    const response = await fetch(url.toString())

    if (!response.ok) {
      console.error('OLA Maps API error:', response.status, await response.text())
      return destinations.map(() => null)
    }

    const data = await response.json() as any

    // Parse the response according to OLA Maps API structure
    if (data.status === 'SUCCESS' && data.rows?.[0]?.elements) {
      const elements = data.rows[0].elements
      return elements.map((element: any) => {
        if (element?.status === 'OK' && element?.distance !== undefined) {
          return element.distance
        }
        return null
      })
    }

    return destinations.map(() => null)
  } catch (error) {
    console.error('OLA Maps fetch error:', error)
    return destinations.map(() => null)
  }
}
