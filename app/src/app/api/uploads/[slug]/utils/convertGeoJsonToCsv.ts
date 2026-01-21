import { Parser } from '@json2csv/plainjs'
import { truncate } from '@turf/truncate'
import { geoJSONToWkt } from 'betterknown'

/**
 * Converts GeoJSON FeatureCollection to CSV format
 * Uses betterknown library for modern, TypeScript-native WKT conversion
 */

interface CsvRow {
  geometry_type: string
  geometry_wkt: string
  [key: string]: any
}

export async function convertGeoJsonToCsv(geojsonData: any) {
  if (!geojsonData || geojsonData.type !== 'FeatureCollection') {
    throw new Error('Invalid GeoJSON: Expected FeatureCollection')
  }

  const csvRows: CsvRow[] = []
  const features = geojsonData.features || []

  console.log(`Processing ${features.length} features for CSV export`)

  // Process each feature
  for (const feature of features) {
    if (!feature.geometry) {
      continue // Skip features without geometry
    }

    // Truncate coordinates to max 7 decimal places for more manageable file sizes
    const truncatedGeometry = truncate(feature.geometry, { precision: 7 })

    // Convert geometry to WKT string using betterknown
    const wktString = geoJSONToWkt(truncatedGeometry)

    // Get geometry type
    const geometryType = feature.geometry.type

    // Create base row with geometry information
    const row: CsvRow = {
      geometry_type: geometryType,
      geometry_wkt: wktString,
    }

    // Add all properties as columns
    if (feature.properties) {
      Object.entries(feature.properties).forEach(([key, value]) => {
        // Sanitize field names to avoid issues with CSV parser
        // Replace dots and other problematic characters with underscores
        const sanitizedKey = key.replace(/[.\s\-\/\\]/g, '_')

        // Convert complex values to strings
        if (typeof value === 'object' && value !== null) {
          row[sanitizedKey] = JSON.stringify(value)
        } else if (value === null || value === undefined) {
          row[sanitizedKey] = ''
        } else {
          row[sanitizedKey] = String(value)
        }
      })
    }

    csvRows.push(row)
  }

  if (csvRows.length === 0) {
    throw new Error('No valid features found in GeoJSON')
  }

  // Collect all unique field names across all features
  const allFields = new Set<string>()
  csvRows.forEach((row) => {
    Object.keys(row).forEach((key) => allFields.add(key))
  })

  // Ensure geometry columns come first
  const orderedFields = [
    'geometry_type',
    'geometry_wkt',
    ...Array.from(allFields)
      .filter((field) => !['geometry_type', 'geometry_wkt'].includes(field))
      .sort(),
  ]

  // Configure CSV parser
  const parser = new Parser({
    fields: orderedFields,
    delimiter: ';',
  })

  console.log(`Generated ${csvRows.length} CSV rows with ${orderedFields.length} fields`)

  try {
    // Generate CSV
    return parser.parse(csvRows)
  } catch (error) {
    console.error('CSV parsing error:', error)
    console.error('Sample row keys:', Object.keys(csvRows[0] || {}))
    console.error('Ordered fields:', orderedFields.slice(0, 10)) // First 10 fields for debugging
    throw new Error(`CSV parsing failed: ${error.message}`)
  }
}
