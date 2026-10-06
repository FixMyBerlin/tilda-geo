import type { LngLatBounds } from 'maplibre-gl'
import type { MapRef } from 'react-map-gl/maplibre'
import { expect, test, vi } from 'vitest'
import { flyMapToIfOffscreen, isBboxOffscreen } from './flyMapToIfOffscreen'
import { MODE_MAP_CAMERA_EDGE_INSET_PX } from './modeMapCameraPadding'

const view = {
  contains: (coordinates: [number, number]) =>
    coordinates[0] >= 0 && coordinates[0] <= 10 && coordinates[1] >= 0 && coordinates[1] <= 10,
  getWest: () => 0,
  getEast: () => 10,
  getSouth: () => 0,
  getNorth: () => 10,
} as unknown as LngLatBounds

test('isBboxOffscreen is false when the boxes overlap', () => {
  expect(isBboxOffscreen(view, [8, 8, 12, 12])).toBe(false)
  expect(isBboxOffscreen(view, [20, 20, 21, 21])).toBe(true)
})

test('does not fit when the target is on-screen', () => {
  const fitBounds = vi.fn()
  const map = {
    getBounds: () => view,
    getZoom: () => 12,
    fitBounds,
  } as unknown as MapRef
  flyMapToIfOffscreen(map, [5, 5])
  flyMapToIfOffscreen(map, [8, 8, 12, 12])
  expect(fitBounds).not.toHaveBeenCalled()
})

test('fits a point at the current zoom (does not zoom in)', () => {
  const fitBounds = vi.fn()
  const map = {
    getBounds: () => view,
    getZoom: () => 12,
    fitBounds,
  } as unknown as MapRef
  flyMapToIfOffscreen(map, [20, 5])
  expect(fitBounds).toHaveBeenCalledWith(
    [
      [20, 5],
      [20, 5],
    ],
    {
      padding: MODE_MAP_CAMERA_EDGE_INSET_PX,
      maxZoom: 12,
    },
  )
})

test('fits an off-screen bbox without zooming in', () => {
  const fitBounds = vi.fn()
  const map = {
    getBounds: () => view,
    getZoom: () => 12,
    fitBounds,
  } as unknown as MapRef
  flyMapToIfOffscreen(map, [20, 20, 21, 21])
  expect(fitBounds).toHaveBeenCalledWith(
    [
      [20, 20],
      [21, 21],
    ],
    {
      padding: MODE_MAP_CAMERA_EDGE_INSET_PX,
      maxZoom: 12,
    },
  )
})

test('ignores a missing map', () => {
  expect(() => flyMapToIfOffscreen(undefined, [1, 2])).not.toThrow()
})
