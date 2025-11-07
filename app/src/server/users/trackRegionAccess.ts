import db from '@/db'
import { getBlitzContext } from '@/src/blitz-server'
import { AccessedRegionType, AccessedRegionsSchema } from '@/src/server/users/schema'
import { UTCDate } from '@date-fns/utc'
import { isSameDay, startOfDay } from 'date-fns'

/**
 * Merge accessed regions arrays, updating existing entries and adding new ones
 * Converts Date objects back to numbers (timestamps) for database storage
 */
function mergeAccessedRegions(existing: AccessedRegionType[], newEntry: AccessedRegionType) {
  const index = existing.findIndex((entry) => entry.slug === newEntry.slug)

  if (index >= 0) {
    existing[index] = newEntry
  } else {
    existing.push(newEntry)
  }

  // Convert Date objects back to numbers (timestamps) for database storage
  return existing.map((entry) => ({
    slug: entry.slug,
    lastAccessedDay: entry.lastAccessedDay.getTime(),
  }))
}

/**
 * Track region access for a user
 * Updates User table directly
 */
export async function trackRegionAccess(regionSlug: string) {
  const ctx = await getBlitzContext()
  const userId = ctx.session.userId
  if (!userId) {
    return
  }

  // Read current accessedRegions from database
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { accessedRegions: true },
  })
  if (!user) {
    return
  }

  // Get start of day in UTC
  const utcStartOfDay = startOfDay(new UTCDate())

  // Parse and validate data from database (numbers) - Zod transforms to Date objects
  const accessedRegions = AccessedRegionsSchema.parse(user.accessedRegions ?? [])

  // Check if region is already in database with the same day (in UTC)
  const existingEntry = accessedRegions.find((entry) => entry.slug === regionSlug)
  if (existingEntry) {
    if (isSameDay(existingEntry.lastAccessedDay, utcStartOfDay)) {
      return
    }
  }

  // Update with new entry - merge with existing data from database
  const newEntry: AccessedRegionType = { slug: regionSlug, lastAccessedDay: utcStartOfDay }
  const updatedRegions = mergeAccessedRegions(accessedRegions, newEntry)

  // Update User table
  await db.user.update({
    where: { id: userId },
    data: { accessedRegions: updatedRegions },
  })
}
