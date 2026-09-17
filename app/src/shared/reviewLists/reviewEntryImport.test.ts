import { describe, expect, test } from 'vitest'
import {
  buildMatchSets,
  classifyImportFeatures,
  normalizeGeometry,
  normalizeProperties,
  resolveFeatureImportId,
  REVIEW_UPLOAD_MAX_FEATURES,
  reviewFeatureCollectionSchema,
  TILDA_RESERVED_KEY_PREFIX,
} from './reviewEntryImport'

describe('normalizeProperties', () => {
  test('drops empty values (null, undefined, blank after trim)', () => {
    expect(
      normalizeProperties({
        keep: 'yes',
        empty: '',
        spaces: '   ',
        nil: null,
        missing: undefined,
        zero: 0,
      }),
    ).toEqual({ keep: 'yes', zero: '0' })
  })

  test('stringifies objects and arrays; String() otherwise', () => {
    expect(
      normalizeProperties({
        obj: { a: 1 },
        arr: [1, 'x'],
        num: 12.5,
        bool: true,
      }),
    ).toEqual({
      obj: '{"a":1}',
      arr: '[1,"x"]',
      num: '12.5',
      bool: 'true',
    })
  })

  test('strips tilda_ keys and invents none', () => {
    expect(
      normalizeProperties({
        name: 'Elbe',
        tilda_importId: 'keep-out',
        tilda_status: 'OPEN',
        [`${TILDA_RESERVED_KEY_PREFIX}commentCount`]: 2,
      }),
    ).toEqual({ name: 'Elbe' })
    expect(normalizeProperties(null)).toEqual({})
    expect(normalizeProperties(['not', 'an', 'object'])).toEqual({})
  })
})

describe('normalizeGeometry', () => {
  test('rounds Point leaves to 8 decimals and collapses -0', () => {
    expect(
      normalizeGeometry({
        type: 'Point',
        coordinates: [13.123456789, -0, 1e-10],
      }),
    ).toEqual({
      type: 'Point',
      coordinates: [13.12345679, 0, 0],
    })
  })

  test('rounds nested Multi* coordinates', () => {
    expect(
      normalizeGeometry({
        type: 'MultiLineString',
        coordinates: [
          [
            [1.123456784, 2.123456786],
            [3.000000001, 4.999999999],
          ],
        ],
      }),
    ).toEqual({
      type: 'MultiLineString',
      coordinates: [
        [
          [1.12345678, 2.12345679],
          [3, 5],
        ],
      ],
    })

    expect(
      normalizeGeometry({
        type: 'MultiPolygon',
        coordinates: [
          [
            [
              [10.123456789, 20.987654321],
              [11.111111111, 21.222222222],
              [10.123456789, 20.987654321],
            ],
          ],
        ],
      }).coordinates,
    ).toEqual([
      [
        [
          [10.12345679, 20.98765432],
          [11.11111111, 21.22222222],
          [10.12345679, 20.98765432],
        ],
      ],
    ])
  })
})

describe('resolveFeatureImportId', () => {
  test('precedence: tilda_importId > properties.id > feature.id > tilda_reviewEntryId', () => {
    const all = {
      tilda_importId: ' from-export ',
      id: 'from-props',
      tilda_reviewEntryId: 99,
    }
    expect(resolveFeatureImportId({ id: 'from-feature' }, all)).toEqual({
      importId: 'from-export',
      fromFile: true,
      source: 'tilda_importId',
    })
    expect(
      resolveFeatureImportId({ id: 'from-feature' }, { id: 'from-props', tilda_reviewEntryId: 99 }),
    ).toEqual({ importId: 'from-props', fromFile: true, source: 'properties.id' })
    expect(resolveFeatureImportId({ id: 'from-feature' }, { tilda_reviewEntryId: 99 })).toEqual({
      importId: 'from-feature',
      fromFile: true,
      source: 'feature.id',
    })
    expect(resolveFeatureImportId({}, { tilda_reviewEntryId: 99 })).toEqual({
      importId: '99',
      fromFile: true,
      source: 'tilda_reviewEntryId',
    })
  })

  test('generates a UUID when the file has no id', () => {
    const first = resolveFeatureImportId({}, { name: 'no-id' })
    const second = resolveFeatureImportId({}, {})
    expect(first.fromFile).toBe(false)
    expect(second.fromFile).toBe(false)
    expect(first.importId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    )
    expect(first.importId).not.toBe(second.importId)
  })

  test('ignores blank ids so a later source can win', () => {
    expect(
      resolveFeatureImportId(
        { id: '  ' },
        { tilda_importId: '', id: '\t', tilda_reviewEntryId: 7 },
      ),
    ).toEqual({ importId: '7', fromFile: true, source: 'tilda_reviewEntryId' })
  })

  test('dedupe-relevant: same fromFile id repeats; generated ids do not', () => {
    const a = resolveFeatureImportId({}, { id: 'same' })
    const b = resolveFeatureImportId({}, { id: 'same' })
    expect(a.fromFile).toBe(true)
    expect(a.importId).toBe(b.importId)

    const generated = [resolveFeatureImportId({}, {}), resolveFeatureImportId({}, {})]
    expect(generated.every((item) => item.fromFile === false)).toBe(true)
    expect(new Set(generated.map((item) => item.importId)).size).toBe(2)
  })
})

describe('buildMatchSets', () => {
  test('keeps database ids and importIds in separate sets', () => {
    expect(
      buildMatchSets([
        { id: 12, importId: 'uuid-a' },
        { id: 13, properties: { importId: 'uuid-b' } },
        { id: 14, importId: null },
      ]),
    ).toEqual({
      entryIds: new Set(['12', '13', '14']),
      importIds: new Set(['uuid-a', 'uuid-b']),
    })
  })
})

describe('classifyImportFeatures', () => {
  const point = (
    coordinates: [number, number],
    properties: Record<string, unknown> | null = null,
    id?: string | number,
  ) => ({
    type: 'Feature' as const,
    ...(id === undefined ? {} : { id }),
    geometry: { type: 'Point' as const, coordinates },
    properties,
  })

  test('splits a mixed FeatureCollection into neu / ignoriert / ohne ID', () => {
    const collection = reviewFeatureCollectionSchema.parse({
      type: 'FeatureCollection',
      features: [
        point([1, 1], { id: 'new-one', name: 'Neu' }),
        point([2, 2], { id: 'already-there', name: 'Existiert' }),
        point([3, 3], { name: 'DB-Treffer' }, 10),
        point([4, 4], { name: 'Ohne ID' }),
        point([5, 5], { id: 'new-one', name: 'Duplikat' }),
        point([6, 6], { name: 'Noch eine ohne ID' }),
      ],
    })

    const classified = classifyImportFeatures(collection, [{ id: 10, importId: 'already-there' }])

    expect(classified.neu.map((item) => item.id)).toEqual(['new-one', '10'])
    expect(classified.neu[0]?.properties).toEqual({ id: 'new-one', name: 'Neu' })
    expect(classified.ignoriert.map((item) => item.id)).toEqual(['already-there', 'new-one'])
    expect(classified.ohneId).toHaveLength(2)
    expect(classified.ohneId.every((item) => item.fromFile === false)).toBe(true)
    expect(classified.ohneId[0]?.id).not.toBe(classified.ohneId[1]?.id)
    expect(classified.ohneId[0]?.properties).toEqual({ name: 'Ohne ID' })
  })

  test('does not treat a GIS properties.id as a database row id', () => {
    const collection = reviewFeatureCollectionSchema.parse({
      type: 'FeatureCollection',
      features: [point([1, 1], { id: '1', name: 'Quelle' })],
    })

    const classified = classifyImportFeatures(collection, [{ id: 1, importId: null }])

    expect(classified.neu.map((item) => item.id)).toEqual(['1'])
    expect(classified.ignoriert).toHaveLength(0)
  })

  test('ignores a tilda_reviewEntryId that matches an existing database id', () => {
    const collection = reviewFeatureCollectionSchema.parse({
      type: 'FeatureCollection',
      features: [point([1, 1], { tilda_reviewEntryId: 1, name: 'Reimport' })],
    })

    const classified = classifyImportFeatures(collection, [{ id: 1, importId: null }])

    expect(classified.ignoriert.map((item) => item.id)).toEqual(['1'])
    expect(classified.neu).toHaveLength(0)
  })

  test('ignores a source id that matches an existing importId', () => {
    const collection = reviewFeatureCollectionSchema.parse({
      type: 'FeatureCollection',
      features: [point([1, 1], { id: 'src-42' })],
    })

    const classified = classifyImportFeatures(collection, [{ id: 99, importId: 'src-42' }])

    expect(classified.ignoriert.map((item) => item.id)).toEqual(['src-42'])
    expect(classified.neu).toHaveLength(0)
  })
})

describe('reviewFeatureCollectionSchema', () => {
  test('keeps feature.id and rejects more than the max number of features', () => {
    const parsed = reviewFeatureCollectionSchema.parse({
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', id: 'src-1', geometry: { type: 'Point', coordinates: [1, 2] } },
      ],
    })
    expect(parsed.features[0]?.id).toBe('src-1')

    expect(() =>
      reviewFeatureCollectionSchema.parse({
        type: 'FeatureCollection',
        features: Array.from({ length: REVIEW_UPLOAD_MAX_FEATURES + 1 }, () => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [1, 2] },
        })),
      }),
    ).toThrow()
  })
})
