/**
 * Private background sources share the `bg` URL param with the code catalog. The prefix keeps the
 * two id spaces apart and tells the map to load tiles through the app instead of the upstream URL.
 */
const privateBackgroundParamPrefix = 'private-'

const privateBackgroundParamPattern = new RegExp(`^${privateBackgroundParamPrefix}[a-z0-9-]+$`)

export type PrivateBackgroundParam = `${typeof privateBackgroundParamPrefix}${string}`

export const isPrivateBackgroundParam = (value: unknown): value is PrivateBackgroundParam =>
  typeof value === 'string' && privateBackgroundParamPattern.test(value)

export const privateBackgroundParam = (slug: string) =>
  `${privateBackgroundParamPrefix}${slug}` satisfies PrivateBackgroundParam

/** Tile URL template of the proxy route (`api/private-backgrounds.$slug.$z.$x.$y.ts`). */
export const privateBackgroundTilesPath = (slug: string) =>
  `/api/private-backgrounds/${slug}/{z}/{x}/{y}`
