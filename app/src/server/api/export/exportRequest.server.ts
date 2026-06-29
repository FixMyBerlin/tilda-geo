import { z } from 'zod'
import { exportApiIdentifier } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/export/exportIdentifier'
import { formatDateBerlin } from '@/components/shared/date/formatDateBerlin'
import { formats } from '@/server/api/export/ogrFormats.const'
import { getProcessingMeta } from '@/server/api/util/getProcessingMeta.server'

export const exportParamsSchema = z.object({
  regionSlug: z.string(),
  tableName: z.enum(exportApiIdentifier),
})

export const exportSearchSchema = z.object({
  apiKey: z.string().optional(),
  minlon: z.coerce.number(),
  minlat: z.coerce.number(),
  maxlon: z.coerce.number(),
  maxlat: z.coerce.number(),
  format: z.enum(formats),
})

export function parseExportSearch(rawSearchParams: URLSearchParams) {
  return exportSearchSchema.safeParse({
    apiKey: rawSearchParams.get('apiKey') || '',
    minlon: rawSearchParams.get('minlon'),
    minlat: rawSearchParams.get('minlat'),
    maxlon: rawSearchParams.get('maxlon'),
    maxlat: rawSearchParams.get('maxlat'),
    format: rawSearchParams.get('format') || 'fgb',
  })
}

/** `<tableName>_<osm-date>.<format>`, falling back to `<tableName>.<format>`. */
export async function buildExportFilename(tableName: string, format: string) {
  const metadata = await getProcessingMeta()
  return metadata.osm_data_from
    ? `${tableName}_${formatDateBerlin(metadata.osm_data_from, 'yyyy-MM-dd')}.${format}`
    : `${tableName}.${format}`
}
