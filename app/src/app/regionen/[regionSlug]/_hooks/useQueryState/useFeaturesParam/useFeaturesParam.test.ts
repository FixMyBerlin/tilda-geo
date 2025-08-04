import { pick } from 'lodash'
import { describe, expect, test } from 'vitest'
import { convertToUrlFeature, serializeFeaturesParam } from './useFeaturesParam'

const allTestData = [
  // feature with string id and LineString geometry
  {
    map: {
      id: 'way/1010110070',
      source: 'cat:bikelanes--source:atlas_bikelanes--subcat:bikelanes',
      geometry: {
        type: 'LineString',
        coordinates: [
          [13.645427227020264, 52.37821900571768],
          [13.64553451538086, 52.3781404131073],
          [13.645577430725098, 52.37810111674966],
          [13.64574909210205, 52.37797012863828],
          [13.645877838134766, 52.377878436729134],
          [13.646156787872314, 52.37766885450762],
          [13.646221160888672, 52.37762955773033],
        ],
      },
    },
    url: {
      sourceId: 'atlas_bikelanes',
      id: 'way/1010110070',
      coordinates: [13.645427, 52.37763, 13.646221, 52.378219],
    },
    query: '10|way/1010110070|13.645427|52.37763|13.646221|52.378219',
  },
  // feature with numeric id and LineString geometry
  {
    map: {
      source: 'cat:parking--source:lars_parking_areas--subcat:parkingAreas',
      id: 9718,
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [9.11900270730257, 48.948290962934834],
            [9.119004383683205, 48.94808486541433],
            [9.118833392858505, 48.9480872875055],
            [9.11874420940876, 48.94808816826591],
            [9.118743874132633, 48.948288540853525],
            [9.11900270730257, 48.948290962934834],
          ],
        ],
      },
    },
    url: {
      sourceId: 'lars_parking_areas',
      id: 9718,
      coordinates: [9.118744, 48.948085, 9.119004, 48.948291],
    },
    query: '5|9718|9.118744|48.948085|9.119004|48.948291',
  },
  // feature with numeric id and Point geometry
  {
    map: {
      id: 776457396685869,
      source: 'cat:mapillary--source:mapillary_coverage--subcat:mapillaryCoverage',
      geometry: {
        type: 'Point',
        coordinates: [13.64569, 52.378193],
      },
    },
    url: {
      id: 776457396685869,
      sourceId: 'mapillary_coverage',
      coordinates: [13.64569, 52.378193],
    },
    query: '21|776457396685869|13.64569|52.378193',
  },
  // feature from source osm-notes
  {
    map: {
      id: 4055430,
      source: 'osm-notes',
      geometry: {
        type: 'Point',
        coordinates: [13.544389754533768, 52.43742985126775],
      },
    },
    url: {
      id: 4055430,
      sourceId: 'osm-notes',
      coordinates: [13.54439, 52.43743],
    },
    query: '1|4055430|13.54439|52.43743',
  },
]

describe('Test inspector url params', () => {
  const dataToTest = [0, 1, 2, 3]

  const testData = Object.values(pick(allTestData, dataToTest))
  test('Convert array of map features to url features', () => {
    testData.forEach(({ map, url }) => {
      const converted = convertToUrlFeature(map as any)
      expect(converted).toStrictEqual(url)
    })
  })

  const urlFeatures = testData.map(({ url }) => url)
  const query = testData.map(({ query }) => query).join(',')
  test('Serialize url feature to query', () => {
    const serialized = serializeFeaturesParam(urlFeatures as any)
    expect(serialized).toBe(query)
  })

  test('Parse query to url feature', () => {
    // TODO: make this work - needs mocking a context provider
    // const parsed = parseFeaturesParam(query)
    // expect(parsed).toStrictEqual(urlFeatures)
  })
})
