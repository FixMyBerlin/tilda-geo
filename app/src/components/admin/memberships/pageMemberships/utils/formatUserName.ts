import { getFullname } from '@/components/admin/memberships/pageMemberships/utils/getFullname'

type UserNameFields = {
  firstName?: string | null
  lastName?: string | null
  osmName?: string | null
}

/** Real name if set, otherwise OSM username. */
export const formatUserName = (user: UserNameFields, empty = '—') =>
  getFullname(user) || user.osmName || empty

/** Real name with OSM handle in parentheses when both exist. */
export const formatUserNameWithOsmHandle = (user: UserNameFields, empty = '—') => {
  const fullname = getFullname(user)
  if (fullname && user.osmName) return `${fullname} (${user.osmName})`
  return formatUserName(user, empty)
}
