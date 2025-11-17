/**
 * Get the base domain URL for the current environment
 * Used for email templates (e.g., logo images)
 */
export const getDomain = () => {
  // This is for `npm run mailpreview`
  // where we set the origin manually to get the logo to show up
  if (process.env?.npm_lifecycle_event === 'mailpreview') {
    return process.env.BLITZ_DEV_SERVER_ORIGIN || process.env.NEXT_PUBLIC_APP_ORIGIN
  }

  if (process.env.NODE_ENV === 'development') {
    return process.env.BLITZ_DEV_SERVER_ORIGIN || process.env.NEXT_PUBLIC_APP_ORIGIN
  }

  return process.env.NEXT_PUBLIC_APP_ORIGIN
}
