export type UserDisplayNameFields = {
  firstName?: string | null
  lastName?: string | null
  osmName?: string | null
}

/** First + last name; OSM name only when those are empty. */
export const formatUserDisplayName = (user: UserDisplayNameFields | null | undefined) => {
  if (!user) return undefined
  const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ')
  return displayName || user.osmName || undefined
}

export type RegionMemberDisplay = {
  osmName: string
  firstName: string | null
  lastName: string | null
}

/** TILDA name when this OSM account is a region member; otherwise the OSM name. */
export const displayNameForOsmUser = (
  osmName: string | undefined,
  members: RegionMemberDisplay[] | undefined,
) => {
  if (!osmName) return undefined
  const member = members?.find((entry) => entry.osmName.toLowerCase() === osmName.toLowerCase())
  return formatUserDisplayName({ ...member, osmName })
}
