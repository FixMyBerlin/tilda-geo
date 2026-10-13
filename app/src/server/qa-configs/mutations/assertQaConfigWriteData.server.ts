import db from '@/server/db.server'
import type { QaDatasetKey } from '../qaDatasets.const'
import type { QaIndicator } from '../schemas/qaIndicatorsSchema'
import { validateQaIndicatorTagKeys } from '../schemas/validateQaIndicatorTagKeys'

/**
 * Shared create/update guard: every indicator key must be the total or a selectable tag
 * in the dataset's topic-doc, and `areaTable` must exist in the database. Processing and the map
 * read `areaTable` immediately, so it must exist; `referenceTable` may be created later (freeze
 * happens after the config is set up), so it is not checked here. Two active configs may not share
 * a `mapTable`: processing rebuilds the map table per config, so the later one would overwrite the
 * other's cells and indicators every night. Throws on the first violation.
 */
export async function assertValidQaConfigWriteData(data: {
  id?: number
  isActive: boolean
  mapTable: string
  dataset: QaDatasetKey
  indicators: QaIndicator[]
  areaTable: string
}) {
  const tagKeyErrors = validateQaIndicatorTagKeys(data.dataset, data.indicators)
  if (tagKeyErrors.length > 0) {
    throw new Error(tagKeyErrors.join('; '))
  }

  const areaTableRows = await db.$queryRaw<Array<{ reg: string | null }>>`
    SELECT to_regclass(${data.areaTable})::text AS reg
  `
  if (!areaTableRows[0]?.reg) {
    throw new Error(`Cell-Tabelle "${data.areaTable}" existiert nicht in der Datenbank`)
  }

  if (data.isActive) {
    const sharingConfig = await db.qaConfig.findFirst({
      where: {
        isActive: true,
        mapTable: data.mapTable,
        ...(data.id ? { id: { not: data.id } } : {}),
      },
      select: { slug: true },
    })
    if (sharingConfig) {
      throw new Error(
        `Map Table "${data.mapTable}" wird schon von der aktiven QA-Konfiguration "${sharingConfig.slug}" genutzt`,
      )
    }
  }
}
