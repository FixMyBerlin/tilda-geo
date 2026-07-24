import { Parser } from '@json2csv/plainjs'
import invariant from 'tiny-invariant'
import { getStaticDatasetUrl } from '@/components/shared/utils/getStaticDatasetUrl'
import type { MapDatasetLayerConfig, MapDatasetUpload, Region } from '@/prisma/generated/client'
import { categoryPresentationForConfigCategory } from '@/server/map-dataset-categories/queries/loadMapDatasetCategoryMap.server'
import { loadMapDatasetCategoryMap } from '@/server/map-dataset-categories/queries/loadMapDatasetCategoryMap.server'

type UploadWithRegions = MapDatasetUpload & {
  regions: Pick<Region, 'id' | 'slug'>[]
  layerConfigs: MapDatasetLayerConfig[]
}

type RegionCsvRow = {
  id: string
  name: string
  description: string
  category: string
  category_subtitle: string
  attribution: string
  licence: string
  data_updated_note: string
  licence_osm_compatible: string
  data_source: string
  geojson_download_url: string
  csv_download_url: string
  region_url: string
  public: string
}

export async function convertRegionUploadsToCsv(uploads: UploadWithRegions[], regionSlug: string) {
  if (!uploads || uploads.length === 0) {
    throw new Error('No uploads found for this region')
  }

  const categoryMap = await loadMapDatasetCategoryMap()
  const csvRows: RegionCsvRow[] = []

  console.log(`Processing ${uploads.length} uploads for region ${regionSlug}`)

  for (const upload of uploads) {
    if (upload.layerConfigs.length === 0) {
      throw new Error(`Upload "${upload.slug}" has no layer configs`)
    }

    for (const layerConfig of upload.layerConfigs) {
      const regionUrl = `${process.env.VITE_APP_ORIGIN}/regionen/${regionSlug}?data=${upload.slug}`
      const { categoryTitle, categorySubtitle } = categoryPresentationForConfigCategory(
        layerConfig.categoryKey,
        categoryMap,
      )

      const row: RegionCsvRow = {
        id: upload.slug,
        name: layerConfig.name,
        description: layerConfig.description || '',
        data_updated_note: upload.dataUpdatedNote || '',
        category: categoryTitle || '',
        category_subtitle: categorySubtitle || '',
        attribution: upload.attributionHtml || '',
        licence: upload.licence || '',
        licence_osm_compatible: upload.licenceOsmCompatible || '',
        data_source: upload.dataSourceMarkdown || '',
        geojson_download_url: getStaticDatasetUrl(upload.slug, 'geojson'),
        csv_download_url: getStaticDatasetUrl(upload.slug, 'csv'),
        region_url: regionUrl,
        public: upload.public ? 'public' : 'private',
      }

      csvRows.push(row)
    }
  }

  if (csvRows.length === 0) {
    throw new Error('No valid datasets found in uploads')
  }

  const firstRow = csvRows[0]
  invariant(firstRow, 'No valid datasets found in uploads')
  const parser = new Parser({
    fields: Object.keys(firstRow),
    delimiter: ';',
  })

  console.log(`Generated ${csvRows.length} CSV rows for region ${regionSlug}`)

  try {
    return parser.parse(csvRows)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('CSV parsing error:', error)
    console.error('Sample row keys:', Object.keys(csvRows[0] || {}))
    throw new Error(`CSV parsing failed: ${message}`)
  }
}
