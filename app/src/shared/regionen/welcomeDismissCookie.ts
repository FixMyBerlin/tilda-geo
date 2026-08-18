import { z } from 'zod'

/** Single cookie listing region slugs whose welcome panel was dismissed. */
export const WELCOME_DISMISSED_COOKIE_NAME = 'tilda-welcome-dismissed'

/** Keep the cookie under typical browser size limits (~4KB). */
export const WELCOME_DISMISSED_MAX_SLUGS = 80

export const WELCOME_DISMISSED_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 400

/** Comma-separated cookie value we write → unique slugs (empty parts dropped). */
export const welcomeDismissedSlugsSchema = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((raw) => (raw ? [...new Set(raw.split(',').filter(Boolean))] : []))

export const serializeWelcomeDismissedSlugs = (slugs: string[]) => slugs.join(',')

export const isWelcomeDismissedSlug = (raw: string | undefined | null, slug: string) =>
  welcomeDismissedSlugsSchema.parse(raw).includes(slug)

/** Append slug (deduped); drop oldest entries when over the cap. */
export const addWelcomeDismissedSlug = (raw: string | undefined | null, slug: string) => {
  const next = [
    ...welcomeDismissedSlugsSchema.parse(raw).filter((entry) => entry !== slug),
    slug,
  ].slice(-WELCOME_DISMISSED_MAX_SLUGS)
  return serializeWelcomeDismissedSlugs(next)
}
