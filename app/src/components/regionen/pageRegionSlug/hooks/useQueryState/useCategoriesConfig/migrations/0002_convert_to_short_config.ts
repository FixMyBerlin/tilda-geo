import { staticRegion } from '@/data/regions.const'
import { createFreshCategoriesConfig } from '../createFreshCategoriesConfig'
import { configCustomParse } from '../v1/configCustomParse'
import { serialize } from '../v2/serialize'
import type { UrlMigration } from './types'

const migration: UrlMigration = (initialUrl) => {
  const u = new URL(initialUrl)

  const slug = u.pathname.split('/')[2] // we now that we get /regions/[slug] here
  console.assert(Boolean(slug), 'no region slug.')

  const region = staticRegion.find((r) => r.slug === slug)
  console.assert(Boolean(region), `region ${slug} not found.`)
  if (!region) throw new Error(`region ${slug} not found`)
  const freshConfig = createFreshCategoriesConfig(region.categories)
  const config = configCustomParse(u.searchParams.get('config'), freshConfig)

  const migratedConfig = serialize(config)
  u.searchParams.set('config', migratedConfig)

  return u.toString()
}

export default migration
