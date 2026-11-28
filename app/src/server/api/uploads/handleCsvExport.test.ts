import { beforeEach, describe, expect, test, vi } from 'vitest'

const { headObject, fetchS3Json } = vi.hoisted(() => ({
  headObject: vi.fn(),
  fetchS3Json: vi.fn(),
}))

vi.mock('@better-upload/server/helpers', () => ({ headObject }))
vi.mock('@/server/s3Client.server', () => ({ getConfiguredS3Client: () => ({}) }))
vi.mock('./fetchS3Json.server', () => ({ fetchS3Json }))

import { handleCsvExport } from './handleCsvExport'

const GEOJSON_URL = 'https://bucket.s3.example/uploads/my-dataset.geojson'
const csvRequest = (method = 'GET', headers: Record<string, string> = {}) =>
  new Request('https://tilda-geo.de/api/uploads/my-dataset.csv', { method, headers })

beforeEach(() => {
  headObject.mockReset()
  fetchS3Json.mockReset()
  headObject.mockResolvedValue({ eTag: '"abc123"' })
  fetchS3Json.mockResolvedValue({
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [13.4, 52.5] },
        properties: { name: 'A' },
      },
    ],
  })
})

describe('handleCsvExport', () => {
  test('GET converts the file and sends an ETag derived from the S3 object', async () => {
    const response = await handleCsvExport(csvRequest(), GEOJSON_URL, 'my-dataset')

    expect(response.status).toBe(200)
    expect(await response.text()).toContain('geometry_wkt')
    expect(response.headers.get('ETag')).toBe('W/"abc123-csv-v1"')
    expect(response.headers.get('Content-Type')).toBe('text/csv')
    expect(response.headers.get('Content-Disposition')).toBe(
      'attachment; filename="my-dataset.csv"',
    )
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
    expect(headObject).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ bucket: 'bucket', key: 'uploads/my-dataset.geojson' }),
    )
  })

  test('a matching If-None-Match is 304 and the file is neither fetched nor converted', async () => {
    const response = await handleCsvExport(
      csvRequest('GET', { 'If-None-Match': 'W/"abc123-csv-v1"' }),
      GEOJSON_URL,
      'my-dataset',
    )

    expect(response.status).toBe(304)
    expect(response.body).toBeNull()
    expect(response.headers.get('ETag')).toBe('W/"abc123-csv-v1"')
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
    expect(fetchS3Json).not.toHaveBeenCalled()
  })

  test('an If-None-Match of an older version gets the new CSV', async () => {
    const response = await handleCsvExport(
      csvRequest('GET', { 'If-None-Match': '"old-csv", W/"older-csv"' }),
      GEOJSON_URL,
      'my-dataset',
    )

    expect(response.status).toBe(200)
    expect(fetchS3Json).toHaveBeenCalledTimes(1)
  })

  test('the ETag has the conversion version: one of the same file before the version gets the new CSV', async () => {
    const response = await handleCsvExport(
      csvRequest('GET', { 'If-None-Match': 'W/"abc123-csv"' }),
      GEOJSON_URL,
      'my-dataset',
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('ETag')).toBe('W/"abc123-csv-v1"')
    expect(fetchS3Json).toHaveBeenCalledTimes(1)
  })

  test('HEAD answers the headers without a body; the file is neither fetched nor converted', async () => {
    const response = await handleCsvExport(csvRequest('HEAD'), GEOJSON_URL, 'my-dataset')

    expect(response.status).toBe(200)
    expect(response.body).toBeNull()
    expect(response.headers.get('ETag')).toBe('W/"abc123-csv-v1"')
    expect(response.headers.get('Content-Type')).toBe('text/csv')
    expect(response.headers.get('Content-Length')).toBeNull()
    expect(fetchS3Json).not.toHaveBeenCalled()
  })

  test('S3 failing is a 500 with CORS headers', async () => {
    headObject.mockRejectedValue(new Error('NotFound'))
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      const response = await handleCsvExport(csvRequest(), GEOJSON_URL, 'my-dataset')

      expect(response.status).toBe(500)
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
    } finally {
      error.mockRestore()
    }
  })
})
