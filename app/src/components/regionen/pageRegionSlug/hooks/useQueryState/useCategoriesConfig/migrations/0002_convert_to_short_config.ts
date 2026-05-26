import { staticRegion } from '@/data/regions.const'
import { createFreshCategoriesConfig } from '../createFreshCategoriesConfig'
import { configCustomParse } from '../v1/configCustomParse'
import { configs } from '../v2/configs'
import { serialize } from '../v2/serialize'
import type { UrlMigration } from './types'

const base36Pattern = /^[0-9a-z]+$/i

const isShortConfigParam = (value: string) => {
  const [checksum, ...encodedParts] = value.split('.')
  if (!checksum || !(checksum in configs) || encodedParts.length === 0) return false
  return encodedParts.every((part) => part.length > 0 && base36Pattern.test(part))
}

const migration: UrlMigration = (initialUrl) => {
  const u = new URL(initialUrl)

  const slug = u.pathname.split('/')[2] // we now that we get /regions/[slug] here
  console.assert(Boolean(slug), 'no region slug.')

  const region = staticRegion.find((r) => r.slug === slug)
  console.assert(Boolean(region), `region ${slug} not found.`)
  if (!region) throw new Error(`region ${slug} not found`)
  const freshConfig = createFreshCategoriesConfig(region.categories)
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
