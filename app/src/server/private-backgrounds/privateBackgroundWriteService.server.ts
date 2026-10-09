import { type AuditContext, runWithAuditContextAsync } from '@/server/audit/auditContext.server'
import { auditRegionLinksChange } from '@/server/audit/auditRegionLinks.server'
import db from '@/server/db.server'
import {
  assertZoomRange,
  type PrivateBackgroundConfig,
  PrivateBackgroundConfigSchema,
  type PrivateBackgroundUpdate,
  PrivateBackgroundUpdateSchema,
} from '@/server/private-backgrounds/privateBackgroundSchema'

/**
 * Everything but `tilesUrl`: the token can be written (admin MCP) but is never read back, neither
 * by the MCP nor by the admin UI. Only the tile proxy reads it.
 */
const detailSelect = {
  id: true,
  slug: true,
  name: true,
  attributionHtml: true,
  minzoom: true,
  maxzoom: true,
  tileSize: true,
  tilesUrlChangedAt: true,
  regions: { select: { slug: true }, orderBy: { slug: 'asc' as const } },
} as const

const withRegionSlugs = <T extends { regions: { slug: string }[] }>({ regions, ...source }: T) => ({
  ...source,
  regionSlugs: regions.map((region) => region.slug),
})

const model = 'PrivateBackgroundSource'

const notFoundMessage = (slug: string) => `Private Hintergrundkarte nicht gefunden: ${slug}`

/** The regions decide who may load the tiles, so their changes are audited (`auditRegionLinksChange`). */
async function findRegionLinks(slug: string) {
  const source = await db.privateBackgroundSource.findUnique({
    where: { slug },
    select: { id: true, regions: { select: { slug: true } } },
  })
  if (!source) throw new Error(notFoundMessage(slug))
  return withRegionSlugs(source)
}

export async function listPrivateBackgrounds() {
  const sources = await db.privateBackgroundSource.findMany({
    select: detailSelect,
    orderBy: { name: 'asc' },
  })
  return sources.map(withRegionSlugs)
}

export async function createPrivateBackground(
  config: PrivateBackgroundConfig,
  auditContext: AuditContext = {},
) {
  const { regionSlugs, ...data } = PrivateBackgroundConfigSchema.parse(config)
  assertZoomRange(data)
  if (await db.privateBackgroundSource.findUnique({ where: { slug: data.slug } })) {
    throw new Error(`Der Slug »${data.slug}« ist bereits vergeben.`)
  }
  const created = await runWithAuditContextAsync(auditContext, async () => {
    const source = await db.privateBackgroundSource.create({
      data: { ...data, regions: { connect: regionSlugs.map((slug) => ({ slug })) } },
      select: detailSelect,
    })
    await auditRegionLinksChange({
      model,
      recordId: source.id,
      oldRegionSlugs: [],
      newRegionSlugs: regionSlugs,
    })
    return source
  })
  return withRegionSlugs(created)
}

export async function updatePrivateBackground(
  slug: string,
  config: PrivateBackgroundUpdate,
  auditContext: AuditContext = {},
) {
  // The slug is the key of the record and of shared map links; it never changes.
  const { regionSlugs, slug: _slug, ...data } = PrivateBackgroundUpdateSchema.parse(config)
  assertZoomRange(data)
  const before = await findRegionLinks(slug)
  const updated = await runWithAuditContextAsync(auditContext, async () => {
    const source = await db.privateBackgroundSource.update({
      where: { slug },
      data: {
        ...data,
        ...(data.tilesUrl ? { tilesUrlChangedAt: new Date() } : {}),
        regions: { set: regionSlugs.map((regionSlug) => ({ slug: regionSlug })) },
      },
      select: detailSelect,
    })
    await auditRegionLinksChange({
      model,
      recordId: source.id,
      oldRegionSlugs: before.regionSlugs,
      newRegionSlugs: regionSlugs,
    })
    return source
  })
  return withRegionSlugs(updated)
}

export async function deletePrivateBackgroundBySlug(slug: string, auditContext: AuditContext = {}) {
  const before = await findRegionLinks(slug)
  await runWithAuditContextAsync(auditContext, async () => {
    await db.privateBackgroundSource.delete({ where: { slug } })
    await auditRegionLinksChange({
      model,
      recordId: before.id,
      oldRegionSlugs: before.regionSlugs,
      newRegionSlugs: [],
    })
  })
  return { slug }
}
