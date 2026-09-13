/** @vitest-environment jsdom */
import { renderHook } from '@testing-library/react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import {
  MAP_REMAINING_MIN,
  MODE_PANEL_WIDTH_MAX_ABS,
  MODE_PANEL_WIDTH_STORAGE_KEY,
} from './modePanelWidthStorage'
import { useResizableModePanelWidth } from './useResizableModePanelWidth'

vi.mock('./useCurrentMode', () => ({
  useOptimisticMode: () => 'notes' as const,
  useCurrentMode: () => 'notes' as const,
}))

type HookApi = ReturnType<typeof useResizableModePanelWidth>

const mountHook = () => {
  const hook = renderHook(() => useResizableModePanelWidth({ enabled: true }))
  const panel = document.createElement('section')
  document.body.appendChild(panel)
  hook.result.current.panelRef.current = panel
  return hook
}

describe('useResizableModePanelWidth drag persistence', () => {
  const storage = new Map<string, string>()

  // jsdom reports offsetWidth 0, so the gesture starts from 0 and the width equals the drag delta.
  const dragHandleBy = (api: HookApi, { from, to }: { from: number; to: number }) => {
    const handle = document.createElement('div')
    handle.setPointerCapture = vi.fn()
    document.body.appendChild(handle)

    api.onResizeHandlePointerDown({
      preventDefault() {},
      currentTarget: handle,
      clientX: from,
      pointerId: 1,
    } as unknown as ReactPointerEvent<HTMLDivElement>)

    handle.dispatchEvent(new MouseEvent('pointermove', { clientX: to }))
    handle.dispatchEvent(new MouseEvent('pointerup'))
  }

  beforeEach(() => {
    vi.stubGlobal('window', { innerWidth: 2000 })
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
    document.documentElement.style.removeProperty('--mode-panel-width')
  })

  test('persists the final clamped width on pointer up', () => {
    const { result } = mountHook()

    // Left-edge handle dragged left by 400px → wider panel.
    dragHandleBy(result.current, { from: 500, to: 100 })

    expect(storage.get(MODE_PANEL_WIDTH_STORAGE_KEY)).toBe('400')
  })

  test('clamps to the viewport-aware maximum width', () => {
    vi.stubGlobal('window', { innerWidth: 1000 })
    const { result } = mountHook()

    // Drag delta of 1000px left exceeds viewport max (1000 - MAP_REMAINING_MIN).
    dragHandleBy(result.current, { from: 1000, to: 0 })

    expect(storage.get(MODE_PANEL_WIDTH_STORAGE_KEY)).toBe(String(1000 - MAP_REMAINING_MIN))
  })

  test('clamps to the absolute maximum on a wide viewport', () => {
    const { result } = mountHook()

    dragHandleBy(result.current, { from: 2000, to: 0 })

    expect(storage.get(MODE_PANEL_WIDTH_STORAGE_KEY)).toBe(String(MODE_PANEL_WIDTH_MAX_ABS))
  })
})
