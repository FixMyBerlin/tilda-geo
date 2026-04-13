import type { RegionWithAdditionalData } from '@/server/regions/queries/getRegionsWithAdditionalData.server'

type UserData = {
  accessedRegions: Array<{ slug: string }>
  Membership: Array<{ region: { slug: string } }>
} | null

export type RegionOption = {
  value: string
  label: string
  readonly?: boolean
  outerProps?: { className?: string }
}

export const getRegionSelectOptions = (
  regions: RegionWithAdditionalData[],
  userData: UserData = null,
) => {
  const result: RegionOption[] = []

  // Get slugs of regions the user has accessed
  const accessedRegionSlugs = new Set(userData?.accessedRegions?.map((r) => r.slug) || [])

  // Get slugs of regions the user already has membership for
  const membershipRegionSlugs = new Set(userData?.Membership?.map((m) => m.region.slug) || [])

  regions.forEach((p) => {
    const hasAccess = membershipRegionSlugs.has(p.slug)
    const isAccessed = accessedRegionSlugs.has(p.slug)

    // Build label with indicators
    let label = p.name
    if (hasAccess) {
      label = `${label} – bereits Rechte`
    } else if (isAccessed) {
      label = `⭐ ${label} – Nutzer:in hat Region aufgerufen aber keine Rechte bisher`
    }

    result.push({
      value: String(p.id),
      label,
      readonly: hasAccess, // Disable if user already has access
      // Add visual indicator via className if needed
      outerProps: {
        className: isAccessed && !hasAccess ? 'bg-yellow-50 p-2 rounded' : undefined,
      },
    })
  })
  return result
}
