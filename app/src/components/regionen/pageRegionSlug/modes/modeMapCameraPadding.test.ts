/** @vitest-environment jsdom */
import { afterEach, describe, expect, test, vi } from 'vitest'
import {
  applyModeMapCameraPadding,
  clampModeMapCameraPadding,
  getModeMapCameraPadding,
  MODE_MAP_CAMERA_EDGE_INSET_PX,
  MODE_MAP_CAMERA_MIN_VISIBLE_PX,
  parseCssLengthToPx,
  resetModeMapCameraPadding,
} from './modeMapCameraPadding'

describe('parseCssLengthToPx', () => {
  test('parses px, rem, and viewport units', () => {
    expect(parseCssLengthToPx('88px')).toBe(88)
    expect(parseCssLengthToPx('5.5rem', 800, 16)).toBe(88)
    expect(parseCssLengthToPx('62dvh', 1000)).toBe(620)
    expect(parseCssLengthToPx('  ')).toBe(0)
  })
})

describe('clampModeMapCameraPadding', () => {
  test('keeps a minimum visible map when the dock is taller than the canvas', () => {
    const padding = clampModeMapCameraPadding(
      { top: 16, right: 16, bottom: 900, left: 16 },
      { width: 390, height: 400 },
    )
    expect(padding.bottom).toBe(400 - 16 - MODE_MAP_CAMERA_MIN_VISIBLE_PX)
    expect(padding.top).toBe(16)
  })
})

describe('getModeMapCameraPadding', () => {
  afterEach(() => {
    document.documentElement.style.removeProperty('--mode-mobile-dock-height')
  })

  test('adds the dock height to the bottom padding', () => {
    document.documentElement.style.setProperty('--mode-mobile-dock-height', '200px')
    const map = { getCanvas: () => ({ offsetWidth: 390, offsetHeight: 844 }) }
    expect(getModeMapCameraPadding(map)).toEqual({
      top: MODE_MAP_CAMERA_EDGE_INSET_PX,
      right: MODE_MAP_CAMERA_EDGE_INSET_PX,
      left: MODE_MAP_CAMERA_EDGE_INSET_PX,
      bottom: 200 + MODE_MAP_CAMERA_EDGE_INSET_PX,
    })
  })

  test('uses only the edge inset when the dock is closed', () => {
    document.documentElement.style.setProperty('--mode-mobile-dock-height', '0px')
    const map = { getCanvas: () => ({ offsetWidth: 1200, offsetHeight: 800 }) }
    expect(getModeMapCameraPadding(map)).toEqual({
      top: MODE_MAP_CAMERA_EDGE_INSET_PX,
      right: MODE_MAP_CAMERA_EDGE_INSET_PX,
      left: MODE_MAP_CAMERA_EDGE_INSET_PX,
      bottom: MODE_MAP_CAMERA_EDGE_INSET_PX,
    })
  })

  test('writes and clears map padding without stacking flyTo options', () => {
    document.documentElement.style.setProperty('--mode-mobile-dock-height', '200px')
    const easeTo = vi.fn()
    const map = {
      getCanvas: () => ({ offsetWidth: 390, offsetHeight: 844 }),
      easeTo,
    }
    applyModeMapCameraPadding(map)
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
})
