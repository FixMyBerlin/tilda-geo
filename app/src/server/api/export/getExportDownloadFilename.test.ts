import { describe, expect, test } from 'vitest'
import { getExportDownloadFilename } from './getExportDownloadFilename'

describe('getExportDownloadFilename', () => {
  test('prefixes region slug and appends Berlin date', () => {
    expect(
      getExportDownloadFilename({
        regionSlug: 'berlin',
        tableName: 'bikelanes',
        format: 'geojson',
        osmDataFrom: new Date('2026-09-16T12:00:00Z'),
      }),
    ).toBe('berlin_bikelanes_2026-09-16.geojson')
  })

  test('omits date when osm_data_from is missing', () => {
    expect(
      getExportDownloadFilename({
        regionSlug: 'berlin',
        tableName: 'bikelanes',
        format: 'gpkg',
        osmDataFrom: null,
      }),
    ).toBe('berlin_bikelanes.gpkg')
  })
})
