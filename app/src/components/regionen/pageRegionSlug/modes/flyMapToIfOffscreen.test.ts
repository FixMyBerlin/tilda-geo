import type { LngLatBounds } from 'maplibre-gl'
import type { MapRef } from 'react-map-gl/maplibre'
import { expect, test, vi } from 'vitest'
import { flyMapToIfOffscreen, isBboxOffscreen, isPointOffscreen } from './flyMapToIfOffscreen'
import { MODE_MAP_CAMERA_EDGE_INSET_PX } from './modeMapCameraPadding'

const view = {
  contains: (coordinates: [number, number]) =>
    coordinates[0] >= 0 && coordinates[0] <= 10 && coordinates[1] >= 0 && coordinates[1] <= 10,
  getWest: () => 0,
  getEast: () => 10,
  getSouth: () => 0,
  getNorth: () => 10,
} as unknown as LngLatBounds

test('isPointOffscreen is false inside the view and true outside', () => {
  expect(isPointOffscreen(view, [5, 5])).toBe(false)
  expect(isPointOffscreen(view, [20, 5])).toBe(true)
})

test('isBboxOffscreen is false when the boxes overlap', () => {
  expect(isBboxOffscreen(view, [8, 8, 12, 12])).toBe(false)
  expect(isBboxOffscreen(view, [20, 20, 21, 21])).toBe(true)
})

test('does not fly when the target is on-screen', () => {
  const flyTo = vi.fn()
  const map = {
    getBounds: () => view,
    getZoom: () => 12,
    cameraForBounds: vi.fn(),
    flyTo,
  } as unknown as MapRef
  flyMapToIfOffscreen(map, [5, 5])
  flyMapToIfOffscreen(map, [8, 8, 12, 12])
  expect(flyTo).not.toHaveBeenCalled()
})

test('pans a point at the current zoom (does not zoom in)', () => {
  const flyTo = vi.fn()
  const cameraForBounds = vi.fn(() => ({ center: { lng: 20, lat: 5 }, zoom: 18 }))
  const map = {
    getBounds: () => view,
    getZoom: () => 12,
    cameraForBounds,
    flyTo,
  } as unknown as MapRef
  flyMapToIfOffscreen(map, [20, 5])
  expect(cameraForBounds).toHaveBeenCalledWith(
    [
      [20, 5],
      [20, 5],
    ],
    { padding: MODE_MAP_CAMERA_EDGE_INSET_PX },
  )
  expect(flyTo).toHaveBeenCalledWith({ center: { lng: 20, lat: 5 }, zoom: 12 })
})

test('zooms out when the bbox is larger than the current view', () => {
  const flyTo = vi.fn()
  const map = {
    getBounds: () => view,
    getZoom: () => 12,
    cameraForBounds: () => ({ center: { lng: 20, lat: 20 }, zoom: 8 }),
    flyTo,
  } as unknown as MapRef
  flyMapToIfOffscreen(map, [20, 20, 21, 21])
  expect(flyTo).toHaveBeenCalledWith({ center: { lng: 20, lat: 20 }, zoom: 8 })
})

test('ignores a missing map', () => {
  expect(() => flyMapToIfOffscreen(undefined, [1, 2])).not.toThrow()
})
