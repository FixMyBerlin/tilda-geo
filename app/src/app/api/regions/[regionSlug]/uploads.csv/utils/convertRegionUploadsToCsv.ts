import { MetaData } from '@/scripts/StaticDatasets/types'
import { getStaticDatasetUrl } from '@/src/app/_components/utils/getStaticDatasetUrl'
import { staticDatasetCategories } from '@/src/app/regionen/[regionSlug]/_mapData/mapDataStaticDatasetCategories/staticDatasetCategories.const'
import { Parser } from '@json2csv/plainjs'
import type { Region, Upload } from '@prisma/client'

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

  const csvRows: RegionCsvRow[] = []

  console.log(`Processing ${uploads.length} uploads for region ${regionSlug}`)

  // Process each upload
  for (const upload of uploads) {
    const configs = upload.configs as MetaData['configs']

    // Each upload can have multiple configs (datasets)
    for (const config of configs) {
      const regionUrl = `${process.env.NEXT_PUBLIC_APP_ORIGIN}/regionen/${regionSlug}?data=${upload.slug}`
      const categoryTitle =
        (config.category && staticDatasetCategories[config.category]?.title) || config.category
      const categorySubtitle: string | undefined = config.category
        ? staticDatasetCategories[config.category]?.subtitle
        : undefined

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

  // Configure CSV parser with semicolon delimiter for QGIS compatibility
  const parser = new Parser({
    fields: Object.keys(csvRows[0]!),
    delimiter: ';',
  })

  console.log(`Generated ${csvRows.length} CSV rows for region ${regionSlug}`)

  try {
    return parser.parse(csvRows)
  } catch (error) {
    console.error('CSV parsing error:', error)
    console.error('Sample row keys:', Object.keys(csvRows[0] || {}))
    throw new Error(`CSV parsing failed: ${error.message}`)
  }
}
