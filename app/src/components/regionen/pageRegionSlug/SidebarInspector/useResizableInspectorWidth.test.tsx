/** @vitest-environment jsdom */
import { renderHook } from '@testing-library/react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { INSPECTOR_WIDTH_MAX, INSPECTOR_WIDTH_STORAGE_KEY } from './inspectorWidthStorage'
import { useResizableInspectorWidth } from './useResizableInspectorWidth'

// jsdom has no ResizeObserver; the hook only needs it to construct without throwing.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

type HookApi = ReturnType<typeof useResizableInspectorWidth>

const mountHook = () => {
  const hook = renderHook(() => useResizableInspectorWidth({ enabled: true, isOpen: true }))
  const panel = document.createElement('div')
  document.body.appendChild(panel)
  hook.result.current.ref(panel)
  return hook
}

describe('useResizableInspectorWidth drag persistence', () => {
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
    vi.stubGlobal('ResizeObserver', ResizeObserverStub)
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
    document.documentElement.style.removeProperty('--inspector-width')
  })

  test('persists the final clamped width and updates the CSS var on pointer up', () => {
    const { result } = mountHook()

    // Left-edge handle dragged left by 400px → wider panel (320–800 range).
    dragHandleBy(result.current, { from: 500, to: 100 })

    expect(storage.get(INSPECTOR_WIDTH_STORAGE_KEY)).toBe('400')
    expect(document.documentElement.style.getPropertyValue('--inspector-width')).toBe('400px')
  })

  test('clamps to the maximum width', () => {
    const { result } = mountHook()

    // Drag delta of 1000px exceeds the 800px max.
    dragHandleBy(result.current, { from: 1000, to: 0 })

    expect(storage.get(INSPECTOR_WIDTH_STORAGE_KEY)).toBe(String(INSPECTOR_WIDTH_MAX))
  })
})
