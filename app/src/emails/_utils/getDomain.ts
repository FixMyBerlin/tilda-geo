/**
 * Base domain URL for the current environment (email templates, etc.).
 * Vite-only: use VITE_APP_ORIGIN everywhere; mailpreview sets it in package.json.
 */
export const getDomain = () =>
  process.env.VITE_APP_ORIGIN ??
  (process.env.NODE_ENV === 'development' ? 'http://127.0.0.1:5173' : '')
