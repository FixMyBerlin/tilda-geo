/**
 * Service-boundary FK and business-rule checks for region create/update/delete.
 * Shared by admin UI, REST, MCP, and migration scripts — not relation reassignment.
 *
 * Unlike region-contract admin (`regions: { connect }` / `regions: { set }`), region writes set
 * `contractId` as a scalar FK on Region, so contract existence must be checked here (Zod cannot;
 * Prisma's FK error is opaque). Category/background/export/nav lists are child rows replaced via
 * nested deleteMany + create in `regionWriteInputToUpdateData`, not M2M connect/set.
 */
import db from '@/server/db.server'
import { RegionNotFoundError } from '@/server/regions/regionWriteErrors.server'

/** Prisma only verifies the contract row exists when updating contractId — not that the id is valid upfront. */
export async function assertRegionContractExists(contractId: number | null) {
  if (contractId == null) return
  const contract = await db.regionContract.findUnique({ where: { id: contractId } })
  if (!contract) {
    throw new Error(`Auftrag nicht gefunden: id=${contractId}`)
  }
}

/** Prisma FK checks upload exists, not that headerLogoId belongs to this region. */
export async function assertHeaderLogoBelongsToRegion(
  headerLogoId: number | null,
  regionId: number,
) {
  if (headerLogoId == null) return
  const upload = await db.regionUpload.findFirst({
    where: { id: headerLogoId, regionId },
  })
  if (!upload) {
    throw new Error(`Header-Logo (id=${headerLogoId}) gehört nicht zu dieser Region`)
  }
}

export async function assertRegionCanBeDeleted(slug: string) {
  const region = await db.region.findUnique({
    where: { slug },
    select: {
      slug: true,
      _count: {
        select: {
          memberships: true,
          noteRecords: true,
          qaConfigs: true,
          // Exclude the region's own auto-generated mask (a systemLayer upload that
          // deleteRegionConfig cleans up); otherwise a region with an active mask can never be
          // deleted. Only user-facing datasets should block deletion.
          mapDatasetUploads: { where: { systemLayer: false } },
        },
      },
    },
  })
  if (!region) throw new RegionNotFoundError(slug)

  const blockers: string[] = []
  const { _count } = region
  if (_count.memberships > 0) blockers.push(`${_count.memberships} Mitgliedschaft(en)`)
  if (_count.noteRecords > 0) blockers.push(`${_count.noteRecords} Notiz(en)`)
  if (_count.qaConfigs > 0) blockers.push(`${_count.qaConfigs} QA-Konfiguration(en)`)
  if (_count.mapDatasetUploads > 0) {
    blockers.push(`${_count.mapDatasetUploads} Map-Dataset-Upload(s)`)
  }

  if (blockers.length > 0) {
    throw new Error(
      `Region »${slug}« kann nicht gelöscht werden: ${blockers.join(', ')}. Bitte zuerst entfernen.`,
    )
  }
}

/** Create/update entry point: contract FK, header-logo ownership, and create-time logo rejection. */
export async function validateRegionConfigRelations(
  config: { contractId: number | null; headerLogoId: number | null },
  regionId?: number,
) {
  await assertRegionContractExists(config.contractId)
  if (regionId != null) {
    await assertHeaderLogoBelongsToRegion(config.headerLogoId, regionId)
  } else if (config.headerLogoId != null) {
    // Uploads need regionId first — set headerLogoId only after the region row exists.
    throw new Error(
      'Header-Logo kann beim Anlegen nicht gesetzt werden — Region zuerst speichern, dann Logo hochladen',
    )
  }
}
