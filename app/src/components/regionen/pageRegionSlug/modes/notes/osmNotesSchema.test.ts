/** @vitest-environment node */
import { describe, expect, test } from 'vitest'
import { osmApiFeatureCollectionSchema, parseOsmApiDate } from './osmNotesSchema'

describe('parseOsmApiDate', () => {
  test('parses OSM API UTC timestamps as UTC', () => {
    const date = parseOsmApiDate('2025-07-25 16:30:30 UTC')
    expect(date.toISOString()).toBe('2025-07-25T16:30:30.000Z')
  })
})

describe('osmApiFeatureCollectionSchema', () => {
  test('turns API date strings into Date objects', () => {
    const parsed = osmApiFeatureCollectionSchema.parse({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [13.4, 52.5] },
          properties: {
            id: 1,
            url: 'https://api.openstreetmap.org/api/0.6/notes/1.json',
            status: 'open',
            date_created: '2025-07-25 16:30:30 UTC',
            comments: [
              {
                date: '2025-07-25 16:30:30 UTC',
                action: 'opened',
                html: '<p>Hi</p>',
              },
            ],
          },
        },
      ],
    })

    expect(parsed.features[0]?.properties.date_created).toBeInstanceOf(Date)
    expect(parsed.features[0]?.properties.comments[0]?.date).toBeInstanceOf(Date)
    expect(parsed.features[0]?.properties.date_created.toISOString()).toBe(
      '2025-07-25T16:30:30.000Z',
    )
  })
})
