import { describe, expect, it } from 'vitest'
import {
  defaultUserDatasetName,
  isDuplicateUserDatasetName,
  MAX_USER_DATASETS,
  sanitizeUserDatasets,
  userDatasetCoverage,
  userDatasetCoverageMessage,
} from './planningUserGeojson'

const square = (minX: number, minY: number, size = 0.01): GeoJSON.Polygon => ({
  type: 'Polygon',
  coordinates: [
    [
      [minX, minY],
      [minX + size, minY],
      [minX + size, minY + size],
      [minX, minY + size],
      [minX, minY],
    ],
  ],
})

const point = (x: number, y: number): GeoJSON.Point => ({ type: 'Point', coordinates: [x, y] })

const collection = (...geometries: GeoJSON.Geometry[]): GeoJSON.FeatureCollection => ({
  type: 'FeatureCollection',
  features: geometries.map((geometry) => ({ type: 'Feature', geometry, properties: {} })),
})

// Planungsgebiet: square (13.40, 52.50) – (13.50, 52.60)
const studyArea = square(13.4, 52.5, 0.1)

describe('userDatasetCoverage', () => {
  it('treats features fully inside as unremarkable', () => {
    const result = userDatasetCoverage(
      collection(point(13.45, 52.55), square(13.42, 52.52)),
      studyArea,
    )
    expect(result).toEqual({ total: 2, outside: 0, partial: 0 })
    expect(userDatasetCoverageMessage(result)).toBeNull()
  })

  it('detects features outside and those crossing the boundary', () => {
    const result = userDatasetCoverage(
      collection(point(13.45, 52.55), point(14.0, 53.0), square(13.395, 52.55, 0.02)),
      studyArea,
    )
    expect(result).toEqual({ total: 3, outside: 1, partial: 1 })
    expect(userDatasetCoverageMessage(result)).toBe(
      '1 von 3 Objekten liegt außerhalb des Planungsgebiets, 1 Objekt liegt nur teilweise im Planungsgebiet',
    )
  })

  it('warns clearly when nothing lies within the area', () => {
    const result = userDatasetCoverage(collection(point(14.0, 53.0), point(14.1, 53.1)), studyArea)
    expect(userDatasetCoverageMessage(result)).toBe(
      'Alle Objekte liegen außerhalb des Planungsgebiets – falsche Datei oder falsches Gebiet?',
    )
  })

  it('makes no statement without a Planungsgebiet', () => {
    const result = userDatasetCoverage(collection(point(14.0, 53.0)), null)
    expect(result).toEqual({ total: 1, outside: 0, partial: 0 })
  })
})

describe('defaultUserDatasetName / isDuplicateUserDatasetName', () => {
  it('appends a number when the name is already taken', () => {
    const existing = [{ name: 'Bäume' }, { name: 'bäume (2)' }]
    expect(defaultUserDatasetName('Bäume.geojson', existing)).toBe('Bäume (3)')
    expect(defaultUserDatasetName('Hecken.gpkg', existing)).toBe('Hecken')
  })

  it('detects the same name on another dataset', () => {
    const datasets = [
      { id: 'a', name: 'Bäume' },
      { id: 'b', name: ' bäume ' },
      { id: 'c', name: '' },
      { id: 'd', name: '' },
    ]
    expect(isDuplicateUserDatasetName(datasets, datasets[0]!)).toBe(true)
    expect(isDuplicateUserDatasetName(datasets, datasets[2]!)).toBe(false)
  })
})

describe('sanitizeUserDatasets', () => {
  const valid = {
    id: 'a1',
    name: ' Wunschorte ',
    mode: 'bonus',
    geojson: collection(point(13.45, 52.55)),
  }

  it('accepts valid datasets and trims the name', () => {
    const [dataset] = sanitizeUserDatasets([valid])
    expect(dataset?.name).toBe('Wunschorte')
    expect(dataset?.geojson.features).toHaveLength(1)
  })

  it('rejects duplicate names, also with different casing', () => {
    expect(() => sanitizeUserDatasets([valid, { ...valid, id: 'a2', name: 'wunschorte' }])).toThrow(
      /doppelt/,
    )
  })

  it('rejects duplicate IDs, empty names and unknown modes', () => {
    expect(() => sanitizeUserDatasets([valid, valid])).toThrow(/doppelte/)
    expect(() => sanitizeUserDatasets([{ ...valid, name: '  ' }])).toThrow(/Name/)
    expect(() => sanitizeUserDatasets([{ ...valid, mode: 'boost' }])).toThrow(/Modus/)
  })

  it('limits the number of datasets', () => {
    const many = Array.from({ length: MAX_USER_DATASETS + 1 }, (_, index) => ({
      ...valid,
      id: `d${index}`,
    }))
    expect(() => sanitizeUserDatasets(many)).toThrow(/Zu viele/)
  })

  it('rejects coordinates outside WGS84', () => {
    const projected = { ...valid, geojson: collection(point(390000, 5800000)) }
    expect(() => sanitizeUserDatasets([projected])).toThrow(/WGS84/)
  })
})
