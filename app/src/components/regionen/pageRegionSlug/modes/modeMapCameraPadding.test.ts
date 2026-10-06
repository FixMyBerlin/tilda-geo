import type { MapRef } from 'react-map-gl/maplibre'
import { expect, test, vi } from 'vitest'
import {
  applyModeMapCameraPadding,
  MODE_MAP_CAMERA_EDGE_INSET_PX,
  resetModeMapCameraPadding,
} from './modeMapCameraPadding'

test('adds the dock height to the bottom padding and clears it on reset', () => {
  const easeTo = vi.fn()
  const map = { easeTo } as unknown as MapRef
  applyModeMapCameraPadding(map, 200)
  expect(easeTo).toHaveBeenCalledWith({
    padding: {
      top: MODE_MAP_CAMERA_EDGE_INSET_PX,
      right: MODE_MAP_CAMERA_EDGE_INSET_PX,
      left: MODE_MAP_CAMERA_EDGE_INSET_PX,
      bottom: 200 + MODE_MAP_CAMERA_EDGE_INSET_PX,
    },
    duration: 0,
  })
  resetModeMapCameraPadding(map)
  expect(easeTo).toHaveBeenLastCalledWith({
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
    duration: 0,
  })
})

test('ignores a missing map', () => {
  expect(() => applyModeMapCameraPadding(undefined, 200)).not.toThrow()
  expect(() => resetModeMapCameraPadding(undefined)).not.toThrow()
})
