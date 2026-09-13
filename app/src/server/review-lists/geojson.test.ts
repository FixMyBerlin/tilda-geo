import { describe, expect, test } from 'vitest'
import type { Prisma } from '@/prisma/generated/client'
import { REVIEW_UPLOAD_MAX_FEATURES } from '@/shared/reviewLists/reviewEntryImport'
import {
  entriesToFeatureCollection,
  featureCollectionToEntries,
  geojsonTypeToEnum,
} from './geojson'

const fc = (features: unknown[]) => ({ type: 'FeatureCollection', features })
const feature = (geometry: unknown, properties: unknown = null) => ({
  type: 'Feature',
  geometry,
  properties,
})

describe('featureCollectionToEntries()', () => {
  test('maps all six supported geometry types to the enum', () => {
    const entries = featureCollectionToEntries(
      fc([
        feature({ type: 'Point', coordinates: [1, 2] }),
        feature({
          type: 'LineString',
          coordinates: [
            [1, 2],
            [3, 4],
          ],
        }),
        feature({
          type: 'Polygon',
          coordinates: [
            [
              [0, 0],
              [1, 0],
              [1, 1],
              [0, 0],
            ],
          ],
        }),
        feature({ type: 'MultiPoint', coordinates: [[1, 2]] }),
        feature({
          type: 'MultiLineString',
          coordinates: [
            [
              [1, 2],
              [3, 4],
            ],
          ],
        }),
        feature({
          type: 'MultiPolygon',
          coordinates: [
            [
              [
                [0, 0],
                [1, 0],
                [1, 1],
                [0, 0],
              ],
            ],
          ],
        }),
      ]),
    )
    expect(entries.map((e) => e.geometryType)).toEqual([
      'POINT',
      'LINESTRING',
      'POLYGON',
      'MULTIPOINT',
      'MULTILINESTRING',
      'MULTIPOLYGON',
    ])
  })

  test('keeps feature properties (empty object when none persist)', () => {
    const entries = featureCollectionToEntries(
      fc([
        feature({ type: 'Point', coordinates: [1, 2] }, { name: 'Kreuzung A' }),
        feature({ type: 'Point', coordinates: [3, 4] }),
      ]),
    )
    expect(entries[0]?.properties).toEqual({ name: 'Kreuzung A' })
    expect(entries[1]?.properties).toEqual({})
  })

  test('normalizes properties, rounds geometry to 8dp, and assigns importId', () => {
    const entries = featureCollectionToEntries(
      fc([
        feature(
          { type: 'Point', coordinates: [13.123456789, 2.987654321] },
          {
            name: '  Kreuzung  ',
            count: 3,
            empty: '',
            tilda_status: 'OPEN',
            tilda_importId: 'from-export',
          },
        ),
      ]),
    )
    expect(entries[0]?.properties).toEqual({ name: 'Kreuzung', count: '3' })
    expect(entries[0]?.geometry).toEqual({
      type: 'Point',
      coordinates: [13.12345679, 2.98765432],
    })
    expect(entries[0]?.importId).toBe('from-export')
  })

  test('keeps properties.id and uses it as importId when feature.id differs', () => {
    const entries = featureCollectionToEntries(
      fc([
        {
          type: 'Feature',
          id: 'feature-level-id',
          geometry: { type: 'Point', coordinates: [1, 2] },
          properties: { id: 'props-id', name: 'A' },
        },
      ]),
    )
    expect(entries[0]?.properties).toEqual({ id: 'props-id', name: 'A' })
    expect(entries[0]?.importId).toBe('props-id')
  })

  test('re-import of a TILDA export keeps the same importId (including id-less source)', () => {
    const firstImport = featureCollectionToEntries(
      fc([
        feature({ type: 'Point', coordinates: [1.123456789, 2] }, { name: 'ohne-id' }),
        {
          type: 'Feature',
          id: 'from-feature',
          geometry: { type: 'Point', coordinates: [3, 4] },
          properties: { name: 'with-id' },
        },
      ]),
    )
    expect(firstImport[0]?.importId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    )
    expect(firstImport[1]?.importId).toBe('from-feature')

    const exported = entriesToFeatureCollection(
      firstImport.map((entry, index) => ({
        id: index + 1,
        geometry: entry.geometry as Prisma.JsonValue,
        properties: entry.properties,
        status: 'OPEN',
        source: 'UPLOAD',
        importId: entry.importId,
      })),
    )
    const reimported = featureCollectionToEntries(exported)
    expect(reimported[0]?.importId).toBe(firstImport[0]?.importId)
    expect(reimported[1]?.importId).toBe('from-feature')
    expect(reimported[0]?.properties).toEqual({ name: 'ohne-id' })
    expect(reimported[1]?.properties).toEqual({ name: 'with-id' })
  })

  test('empty features yield an empty array', () => {
    expect(featureCollectionToEntries(fc([]))).toEqual([])
  })

  test('rejects an unsupported geometry type (GeometryCollection)', () => {
    expect(() =>
      featureCollectionToEntries(fc([feature({ type: 'GeometryCollection', geometries: [] })])),
    ).toThrow()
  })

  test('rejects a non-FeatureCollection', () => {
    expect(() => featureCollectionToEntries({ type: 'Feature' })).toThrow()
  })

  test('rejects geometry whose coordinates contain non-number leaves', () => {
    expect(() =>
      featureCollectionToEntries(fc([feature({ type: 'Point', coordinates: ['x', 2] })])),
    ).toThrow()
    expect(() =>
      featureCollectionToEntries(fc([feature({ type: 'Point', coordinates: [Infinity, 2] })])),
    ).toThrow()
    expect(() =>
      featureCollectionToEntries(
        fc([
          feature({
            type: 'Polygon',
            coordinates: [
              [
                [0, 0],
                [1, 0],
                [1, {}],
              ],
            ],
          }),
        ]),
      ),
    ).toThrow()
  })

  test('rejects more than the max number of features', () => {
    const tooMany = fc(
      Array.from({ length: REVIEW_UPLOAD_MAX_FEATURES + 1 }, () =>
        feature({ type: 'Point', coordinates: [1, 2] }),
      ),
    )
    expect(() => featureCollectionToEntries(tooMany)).toThrow()
  })
})

describe('geojsonTypeToEnum()', () => {
  test('maps known types and throws on unknown', () => {
    expect(geojsonTypeToEnum('Polygon')).toBe('POLYGON')
    expect(() => geojsonTypeToEnum('Circle')).toThrow()
  })
})

describe('entriesToFeatureCollection()', () => {
  test('round-trips geometry + exposes tilda_* system keys and importId', () => {
    const collection = entriesToFeatureCollection([
      {
        id: 7,
        geometry: { type: 'Point', coordinates: [1, 2] },
        properties: { name: 'A' },
        status: 'OPEN',
        source: 'UPLOAD',
        importId: 'import-7',
        _count: { comments: 2 },
      },
    ])
    expect(collection.type).toBe('FeatureCollection')
    expect(collection.features[0]).toMatchObject({
      type: 'Feature',
      id: 7,
      geometry: { type: 'Point', coordinates: [1, 2] },
      properties: {
        name: 'A',
        tilda_importId: 'import-7',
        tilda_reviewEntryId: 7,
        tilda_status: 'OPEN',
        tilda_source: 'UPLOAD',
        tilda_commentCount: 2,
      },
    })
  })

  test('omits tilda_importId when the entry has none', () => {
    const collection = entriesToFeatureCollection([
      {
        id: 8,
        geometry: { type: 'Point', coordinates: [1, 2] },
        properties: { name: 'B' },
        status: 'OPEN',
        source: 'MANUAL',
      },
    ])
    expect(collection.features[0]?.properties).toEqual({
      name: 'B',
      tilda_reviewEntryId: 8,
      tilda_status: 'OPEN',
      tilda_source: 'MANUAL',
    })
  })
})
