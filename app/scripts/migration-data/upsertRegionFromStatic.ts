import type { AuditContext } from '@/server/audit/auditContext.server'
import db from '@/server/db.server'
import { updateRegionMaskConfig } from '@/server/regions/mutations/updateRegionMaskConfig.server'
import { staticBboxToGeoJson } from '@/server/regions/regionGeoJson'
import { createRegionConfig, updateRegionConfig } from '@/server/regions/regionWriteService.server'
import type { StaticRegion, StaticRegionDbFields } from './staticRegion.types'

function staticRegionToConfig(staticEntry: StaticRegion, dbFields: StaticRegionDbFields) {
  const hasBbox = staticEntry.bbox != null
  return {
    slug: staticEntry.slug,
    name: staticEntry.name,
    fullName: staticEntry.fullName,
    promoted: dbFields.promoted,
    status: dbFields.status,
    product: staticEntry.product,
    notes: staticEntry.notes,
    showSearch: staticEntry.showSearch ?? false,
    mapLat: staticEntry.map.lat,
    mapLng: staticEntry.map.lng,
    mapZoom: staticEntry.map.zoom,
    logoWhiteBackgroundRequired: staticEntry.logoWhiteBackgroundRequired,
    headerLogoId: dbFields.headerLogoId,
    bbox: hasBbox ? staticBboxToGeoJson(staticEntry.bbox!) : null,
    cacheWarming: staticEntry.cacheWarming ?? null,
    categories: [...new Set(staticEntry.categories)],
    backgroundSources: [...new Set(staticEntry.backgroundSources)],
    exports: hasBbox && staticEntry.exports ? [...new Set(staticEntry.exports)] : [],
    contractId: dbFields.contractId,
    navigationLinks: (staticEntry.navigationLinks ?? []).map((link, sortOrder) => {
      if ('to' in link) {
        return {
          name: link.name,
          internalPath: link.to,
          externalUrl: null,
          sortOrder,
        }
      }
      return {
        name: link.name,
        internalPath: null,
        externalUrl: link.href,
        sortOrder,
      }
    }),
  }
}

export async function upsertRegionFromStatic(
  staticEntry: StaticRegion,
  dbFields: StaticRegionDbFields,
  auditContext: AuditContext,
) {
  const config = staticRegionToConfig(staticEntry, dbFields)
  const existing = await db.region.findUnique({ where: { slug: config.slug } })
  const region = existing
    ? await updateRegionConfig(config.slug, config, auditContext)
    : await createRegionConfig(config, auditContext)

  if (staticEntry.mask) {
    await updateRegionMaskConfig({
      slug: config.slug,
      maskOsmRelationIds: staticEntry.mask.osmRelationIds,
      maskBufferKm: staticEntry.mask.bufferKm,
    })
  }

  return region
}
