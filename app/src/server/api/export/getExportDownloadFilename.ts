import type { SourceExportApiIdentifier } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/export/exportIdentifier'
import { formatDateBerlin } from '@/components/shared/date/formatDateBerlin'
import type { Formats } from '@/server/api/export/ogrFormats.const'

type GetExportDownloadFilenameInput = {
  regionSlug: string
  tableName: SourceExportApiIdentifier | string
  format: Formats
  osmDataFrom?: Date | string | null
}

export function getExportDownloadFilename({
  regionSlug,
  tableName,
  format,
  osmDataFrom,
}: GetExportDownloadFilenameInput) {
  if (osmDataFrom) {
    return `${regionSlug}_${tableName}_${formatDateBerlin(osmDataFrom, 'yyyy-MM-dd')}.${format}`
  }
  return `${regionSlug}_${tableName}.${format}`
}
