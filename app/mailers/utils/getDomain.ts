/**
 * Get the base domain URL for the current environment
 * Used for email templates (e.g., logo images)
 *
 * Similar to trassenscout's getPrdOrStgDomain but adapted for tilda-geo
 */
export const getDomain = () => {
  const origin =
    process.env.NEXT_PUBLIC_APP_ORIGIN?.replace('http:', 'https:') || 'https://staging.tilda-geo.de'

  // This is for `npm run mailpreview`
  // where we set the origin manually to get the logo to show up
  if (process.env?.npm_lifecycle_event === 'mailpreview') {
    return process.env.BLITZ_DEV_SERVER_ORIGIN || process.env.NEXT_PUBLIC_APP_ORIGIN || origin
  }

  if (process.env.NODE_ENV === 'development') {
    return process.env.BLITZ_DEV_SERVER_ORIGIN || process.env.NEXT_PUBLIC_APP_ORIGIN || origin
  }

  return origin
}
