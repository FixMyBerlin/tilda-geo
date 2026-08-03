import { createFreshCategoriesConfig } from '../createFreshCategoriesConfig'
import { configCustomParse } from '../v1/configCustomParse'
import { serialize } from '../v2/serialize'
import type { UrlMigration } from './types'

// v2-short configs are `checksum.bits[.bits…]` — base36 dot-separated segments. v1 jsurl configs
// start with `!(` and use `~`. Detect "already v2-short" by format, not by known checksums.
const shortConfigPattern = /^[0-9a-z]+(\.[0-9a-z]+)+$/i

const isShortConfigParam = (value: string) => shortConfigPattern.test(value)

const migration: UrlMigration = (initialUrl, ctx) => {
  const u = new URL(initialUrl)

  const freshConfig = createFreshCategoriesConfig(ctx.categories)
  const configParam = u.searchParams.get('config')
  if (configParam && isShortConfigParam(configParam)) {
    return u.toString()
  }

  const config = configCustomParse(configParam, freshConfig)

  const migratedConfig = serialize(config)
  u.searchParams.set('config', migratedConfig)

  return u.toString()
}

export default migration
