import { migrations } from './migrations'
import type { UrlMigrationContext } from './migrations/types'

const currentVersion = Math.max(...Object.keys(migrations).map((key) => Number(key)))

/** The migration version a link was written with (`v`); 0 without one. */
export function urlMigrationVersion(url: string) {
  const v = new URL(url).searchParams.get('v')
  if (v === null) return 0
  const version = Number(v)
  if (Number.isNaN(version) || version < 0) return 0
  if (version > currentVersion) return currentVersion
  return version
}

export function migrateUrl(url: string, ctx: UrlMigrationContext) {
  const searchParamsVersion = urlMigrationVersion(url)
  let migratedUrl = url
  for (let v = searchParamsVersion + 1; v <= currentVersion; v++) {
    const migrate = migrations[v as keyof typeof migrations]
    if (!migrate) throw new Error(`Migration ${v} is missing.`)
    migratedUrl = migrate(migratedUrl, ctx)
  }
  const u = new URL(migratedUrl)
  u.searchParams.set('v', String(currentVersion))
  return u.toString()
}
