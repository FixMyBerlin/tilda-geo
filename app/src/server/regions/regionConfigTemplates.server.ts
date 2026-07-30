import { createFreshCategoriesConfig } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/createFreshCategoriesConfig'
import type {
  MapDataCategoryConfig,
  MapDataCategoryParam,
} from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/type'
import { simplifyConfigForParams } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/utils/simplifyConfigForParams'
import { configs } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/v2/configs'
import { calcConfigChecksum } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/v2/lib'
import type { MapDataCategoryId } from '@/components/regionen/pageRegionSlug/mapData/mapDataCategories/MapDataCategoryId'
import db from '@/server/db.server'

type RegionConfigTemplateDb = Pick<typeof db, 'regionConfigTemplate'>

/**
 * Decode templates for the `?config=checksum.bits` URL param, keyed by checksum.
 *
 * The `bits` decode positionally against a template tree determined by the region's ordered category
 * list at encode time. Upserted on every region save so admin category edits produce decodable URLs
 * without pre-committed `v2/configs/*` files.
 *
 * Templates are immutable per checksum, so reads are memoised for the process lifetime.
 */
const cache = new Map<string, MapDataCategoryParam[]>()

export async function upsertRegionConfigTemplate(
  categories: MapDataCategoryId[],
  client: RegionConfigTemplateDb = db,
) {
  const freshConfig = createFreshCategoriesConfig(categories)
  const checksum = calcConfigChecksum(freshConfig)
  const template = simplifyConfigForParams(freshConfig)
  await client.regionConfigTemplate.upsert({
    where: { checksum },
    create: { checksum, template },
    update: {},
  })
  cache.set(checksum, template)
  return checksum
}

/** Tier 1 (current fresh) → tier 2 (DB) → tier 3 (frozen archive); undefined if unknown. */
export async function resolveConfigTemplate(
  checksum: string,
  freshConfig: MapDataCategoryConfig[],
) {
  if (checksum === calcConfigChecksum(freshConfig)) {
    return simplifyConfigForParams(freshConfig)
  }

  const fromDb = await getRegionConfigTemplate(checksum)
  if (fromDb) return fromDb

  if (checksum in configs) {
    return configs[checksum as keyof typeof configs] as MapDataCategoryParam[]
  }
}

export async function getRegionConfigTemplate(checksum: string) {
  const cached = cache.get(checksum)
  if (cached) return cached

  const row = await db.regionConfigTemplate.findUnique({ where: { checksum } })
  if (!row) return undefined

  const template = row.template as MapDataCategoryParam[]
  cache.set(checksum, template)
  return template
}
