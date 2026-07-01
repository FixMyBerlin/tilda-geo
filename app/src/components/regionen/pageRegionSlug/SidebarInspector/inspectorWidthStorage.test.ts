import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import {
  INSPECTOR_WIDTH_DEFAULT,
  INSPECTOR_WIDTH_MAX,
  INSPECTOR_WIDTH_MIN,
  INSPECTOR_WIDTH_STORAGE_KEY,
  clampInspectorWidth,
  readInspectorWidth,
  writeInspectorWidth,
} from './inspectorWidthStorage'

describe('inspectorWidthStorage', () => {
  const storage = new Map<string, string>()

  beforeEach(() => {
    vi.stubGlobal('window', {})
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

  test('clampInspectorWidth limits to 320–800', () => {
    expect(clampInspectorWidth(100)).toBe(INSPECTOR_WIDTH_MIN)
    expect(clampInspectorWidth(900)).toBe(INSPECTOR_WIDTH_MAX)
    expect(clampInspectorWidth(600)).toBe(600)
  })

  test('readInspectorWidth returns default when storage is empty', () => {
    expect(readInspectorWidth()).toBe(INSPECTOR_WIDTH_DEFAULT)
  })

  test('writeInspectorWidth persists clamped width', () => {
    writeInspectorWidth(900)
    expect(storage.get(INSPECTOR_WIDTH_STORAGE_KEY)).toBe(String(INSPECTOR_WIDTH_MAX))
    expect(readInspectorWidth()).toBe(INSPECTOR_WIDTH_MAX)
  })
})
