import { describe, expect, test } from 'vitest'
import {
  clampViewportPadding,
  MODE_VIEWPORT_BBOX_PADDING_PX,
  paddedViewportBbox,
} from './useMapViewportBbox'

const clampTo = [13.4, 52.5, 13.5, 52.6] as const

describe('paddedViewportBbox', () => {
  test('orders corners and rounds to 4 decimals', () => {
    expect(
      paddedViewportBbox({
        width: 800,
        height: 600,
        corners: [
          { lng: 13.41234, lat: 52.49876 },
          { lng: 13.40111, lat: 52.51009 },
        ],
        clampTo: [13.4, 52.49, 13.42, 52.52],
      }),
    ).toEqual([13.4011, 52.4988, 13.4123, 52.5101])
  })

  test('spans all four corners of a rotated square viewport', () => {
    // Diamond: min/max lng and lat each come from a different corner.
    // Two opposite corners (NW+SE or NE+SW) would miss at least one extreme.
    const west = { lng: 13.4, lat: 52.55 }
    const east = { lng: 13.5, lat: 52.55 }
    const south = { lng: 13.45, lat: 52.5 }
    const north = { lng: 13.45, lat: 52.6 }
    const bbox = paddedViewportBbox({
      width: 800,
      height: 600,
      corners: [west, north, east, south],
      clampTo: [13.3, 52.4, 13.6, 52.7],
    })

    expect(bbox).toEqual([13.4, 52.5, 13.5, 52.6])
    const westEastOnly = [
      Math.min(west.lng, east.lng),
      Math.min(west.lat, east.lat),
      Math.max(west.lng, east.lng),
      Math.max(west.lat, east.lat),
    ]
    const northSouthOnly = [
      Math.min(north.lng, south.lng),
      Math.min(north.lat, south.lat),
      Math.max(north.lng, south.lng),
      Math.max(north.lat, south.lat),
    ]
    expect(westEastOnly).not.toEqual(bbox)
    expect(northSouthOnly).not.toEqual(bbox)
  })

  test('clamps corners that extend beyond clampTo', () => {
    expect(
      paddedViewportBbox({
        width: 800,
        height: 600,
        corners: [
          { lng: 13.3, lat: 52.45 },
          { lng: 13.55, lat: 52.45 },
          { lng: 13.55, lat: 52.65 },
          { lng: 13.3, lat: 52.65 },
        ],
        clampTo,
      }),
    ).toEqual([13.4, 52.5, 13.5, 52.6])
  })

  test('falls back to clampTo when a corner is not finite', () => {
    expect(
      paddedViewportBbox({
        width: 800,
        height: 600,
        corners: [
          { lng: 13.41, lat: 52.51 },
          { lng: Number.POSITIVE_INFINITY, lat: 52.52 },
        ],
        clampTo: [13.12345, 52.12345, 13.98765, 52.98765],
      }),
    ).toEqual([13.1235, 52.1235, 13.9877, 52.9877])
  })

  test('falls back to clampTo when the intersection is empty', () => {
    expect(
      paddedViewportBbox({
        width: 800,
        height: 600,
        corners: [
          { lng: 13.1, lat: 52.1 },
          { lng: 13.2, lat: 52.2 },
        ],
        clampTo,
      }),
    ).toEqual([13.4, 52.5, 13.5, 52.6])
  })

  test('falls back to clampTo when width or height is not positive', () => {
    expect(
      paddedViewportBbox({
        width: 0,
        height: 600,
        corners: [
          { lng: 13.41, lat: 52.51 },
          { lng: 13.42, lat: 52.52 },
        ],
        clampTo: [13.12345, 52.12345, 13.98765, 52.98765],
      }),
    ).toEqual([13.1235, 52.1235, 13.9877, 52.9877])
  })
})

describe('clampViewportPadding', () => {
  test('returns 10 for a normal canvas', () => {
    expect(MODE_VIEWPORT_BBOX_PADDING_PX).toBe(10)
    expect(clampViewportPadding(800, 600)).toBe(MODE_VIEWPORT_BBOX_PADDING_PX)
  })

  test('shrinks on a small canvas and never exceeds a quarter of the smaller side', () => {
    expect(clampViewportPadding(20, 20)).toBe(5)
    expect(clampViewportPadding(16, 100)).toBe(4)
  })

  test('never returns a negative padding', () => {
    expect(clampViewportPadding(0, 0)).toBe(0)
    expect(clampViewportPadding(-10, -10)).toBe(0)
  })
})
