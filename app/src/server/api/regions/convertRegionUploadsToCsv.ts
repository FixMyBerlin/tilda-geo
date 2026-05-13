import { Parser } from '@json2csv/plainjs'
import invariant from 'tiny-invariant'
import { getStaticDatasetUrl } from '@/components/shared/utils/getStaticDatasetUrl'
import type { Region, Upload } from '@/prisma/generated/client'
import type { MetaData } from '@/scripts/StaticDatasets/types'
import { categoryPresentationForConfigCategory } from '@/server/static-dataset-categories/queries/loadStaticDatasetCategoryMap.server'
import { loadStaticDatasetCategoryMap } from '@/server/static-dataset-categories/queries/loadStaticDatasetCategoryMap.server'

/**
 * Upload with regions included (matching our DB queries)
 */
type UploadWithRegions = Upload & {
  regions: Pick<Region, 'id' | 'slug'>[]
}

/**
 * Converts region uploads to CSV format
 * Contains metadata about datasets
 */
type RegionCsvRow = {
  id: string
  name: string
  description: string
  category: string
  category_subtitle: string
  attribution: string
  licence: string
  updated_at: string
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

  const categoryMap = await loadStaticDatasetCategoryMap()
  const csvRows: RegionCsvRow[] = []

  console.log(`Processing ${uploads.length} uploads for region ${regionSlug}`)

  for (const upload of uploads) {
    const configs = upload.configs as MetaData['configs']

    for (const config of configs) {
      const regionUrl = `${process.env.VITE_APP_ORIGIN}/regionen/${regionSlug}?data=${upload.slug}`
      const { categoryTitle, categorySubtitle } = categoryPresentationForConfigCategory(
        config.category,
        categoryMap,
      )

      const row: RegionCsvRow = {
        id: upload.slug,
        name: config.name || '',
        description: config.description || '',
        updated_at: config.updatedAt || '',
        category: categoryTitle || '',
        category_subtitle: categorySubtitle || '',
        attribution: config.attributionHtml || '',
        licence: config.licence || '',
        licence_osm_compatible: config.licenceOsmCompatible || '',
        data_source: config.dataSourceMarkdown || '',
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
