import { LabeledRadiobuttonProps } from '@/src/app/_components/forms/LabeledRadiobutton'

type UserData = {
  accessedRegions: Array<{ slug: string }>
  Membership: Array<{ region: { slug: string } }>
} | null

export const getRegionSelectOptions = (regions: any, userData: UserData = null) => {
  const result: Omit<LabeledRadiobuttonProps, 'scope'>[] = []

  // Get slugs of regions the user has accessed
  const accessedRegionSlugs = new Set(userData?.accessedRegions?.map((r) => r.slug) || [])

  // Get slugs of regions the user already has membership for
  const membershipRegionSlugs = new Set(userData?.Membership?.map((m) => m.region.slug) || [])

  regions.forEach((p: any) => {
    const hasAccess = membershipRegionSlugs.has(p.slug)
    const isAccessed = accessedRegionSlugs.has(p.slug)

    // Build label with indicators
    let label = p.name
    if (isAccessed && !hasAccess) {
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
