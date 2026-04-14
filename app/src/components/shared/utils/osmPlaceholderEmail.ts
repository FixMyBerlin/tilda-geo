/**
 * OSM OAuth does not provide email. Better Auth requires a non-empty email; we use a reserved
 * invalid-domain placeholder (RFC 2606). See auth server and isOsmPlaceholderEmail.
 */
export const OSM_PLACEHOLDER_EMAIL_DOMAIN = 'users.openstreetmap.invalid'

export function osmPlaceholderEmail(osmId: number) {
  return `osm-${osmId}@${OSM_PLACEHOLDER_EMAIL_DOMAIN}`
}

export function isOsmPlaceholderEmail(email: string | null | undefined) {
  if (email == null || email === '') return false
  return email.endsWith(`@${OSM_PLACEHOLDER_EMAIL_DOMAIN}`)
}

export function hasContactEmail(email: string | null | undefined) {
  return Boolean(email) && !isOsmPlaceholderEmail(email)
}

type ContactProfileFields = {
  email: string | null | undefined
  firstName: string | null | undefined
  lastName: string | null | undefined
}

export function isContactProfileIncomplete(user: ContactProfileFields) {
  return !hasContactEmail(user.email) || !user.firstName?.trim() || !user.lastName?.trim()
}
