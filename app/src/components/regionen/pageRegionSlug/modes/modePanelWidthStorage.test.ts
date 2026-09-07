import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import {
  MAP_REMAINING_MIN,
  MODE_PANEL_WIDTH_DEFAULT,
  MODE_PANEL_WIDTH_MAX_ABS,
  MODE_PANEL_WIDTH_MIN,
  MODE_PANEL_WIDTH_STORAGE_KEY,
  clampModePanelWidth,
  maxModePanelWidthForViewport,
  readModePanelWidth,
  writeModePanelWidth,
} from './modePanelWidthStorage'

describe('modePanelWidthStorage', () => {
  const storage = new Map<string, string>()

  beforeEach(() => {
    vi.stubGlobal('window', { innerWidth: 1600 })
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value)
      },
      removeItem: (key: string) => {
        storage.delete(key)
      },
    })
  })

  afterEach(() => {
    storage.clear()
    vi.unstubAllGlobals()
  })

  test('clampModePanelWidth limits to min and absolute max on a wide viewport', () => {
    expect(clampModePanelWidth(100)).toBe(MODE_PANEL_WIDTH_MIN)
    expect(clampModePanelWidth(1500)).toBe(MODE_PANEL_WIDTH_MAX_ABS)
    expect(clampModePanelWidth(600)).toBe(600)
  })

  test('maxModePanelWidthForViewport respects map remaining minimum', () => {
    const viewport = MAP_REMAINING_MIN + MODE_PANEL_WIDTH_MIN + 100
    expect(maxModePanelWidthForViewport(viewport)).toBe(MODE_PANEL_WIDTH_MIN + 100)
    expect(maxModePanelWidthForViewport(1600)).toBe(MODE_PANEL_WIDTH_MAX_ABS)
  })

  test('clampModePanelWidth uses viewport ceiling when window.innerWidth is set', () => {
    vi.stubGlobal('window', { innerWidth: 1000 })
    expect(clampModePanelWidth(900)).toBe(1000 - MAP_REMAINING_MIN)
  })

  test('readModePanelWidth returns default when storage is empty', () => {
    expect(readModePanelWidth()).toBe(MODE_PANEL_WIDTH_DEFAULT)
  })

  test('writeModePanelWidth persists clamped width', () => {
    writeModePanelWidth(1500)
    expect(storage.get(MODE_PANEL_WIDTH_STORAGE_KEY)).toBe(String(MODE_PANEL_WIDTH_MAX_ABS))
    expect(readModePanelWidth()).toBe(MODE_PANEL_WIDTH_MAX_ABS)
  })
})
