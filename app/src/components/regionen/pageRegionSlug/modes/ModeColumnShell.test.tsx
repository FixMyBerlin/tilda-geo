/** @vitest-environment jsdom */
import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { ModeColumnShell } from './ModeColumnShell'

const { useMatches, useMatchRoute, useParams, useLoaderData } = vi.hoisted(() => ({
  useLoaderData: vi.fn(),
  useMatches: vi.fn(),
  useMatchRoute: vi.fn(() => () => false),
  useParams: vi.fn(() => ({ regionSlug: 'test' })),
}))

const useBreakpoint = vi.hoisted(() => vi.fn(() => true))

vi.mock('@tanstack/react-router', () => ({
  getRouteApi: () => ({
    useLoaderData,
    useParams,
  }),
  useMatches,
  useMatchRoute,
  Outlet: () => <div>Outlet</div>,
}))

vi.mock('@/components/shared/hooks/viewport/useBreakpoint', () => ({
  useBreakpoint,
}))

vi.mock('./ModeMobileDock', () => ({
  ModeMobileDock: () => <div>ModeMobileDock</div>,
}))

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

describe('ModeColumnShell', () => {
  const storage = new Map<string, string>()

  beforeEach(() => {
    useBreakpoint.mockReturnValue(true)
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
    document.documentElement.style.removeProperty('--mode-panel-width')
  })

  const renderOnHinweise = () => {
    useMatches.mockImplementation(({ select }: { select: (matches: unknown) => unknown }) =>
      select([{ routeId: '/regionen/$regionSlug/hinweise' }]),
    )
    return render(<ModeColumnShell />)
  }

  test('desktop mode route renders the right column outlet, not the mobile dock', () => {
    useBreakpoint.mockReturnValue(true)
    renderOnHinweise()
    expect(screen.getByText('Outlet')).toBeInTheDocument()
    expect(screen.queryByText('ModeMobileDock')).toBeNull()
  })

  test('mobile mode route renders the dock and does not take flex column width', () => {
    useBreakpoint.mockReturnValue(false)
    renderOnHinweise()
    expect(screen.getByText('ModeMobileDock')).toBeInTheDocument()
    expect(screen.queryByText('Outlet')).toBeNull()
    expect(document.documentElement.style.getPropertyValue('--mode-panel-width')).toBe('0px')
  })

  test('mobile map route renders neither column nor dock', () => {
    useBreakpoint.mockReturnValue(false)
    useMatches.mockImplementation(({ select }: { select: (matches: unknown) => unknown }) =>
      select([{ routeId: '/regionen/$regionSlug/' }]),
    )
    render(<ModeColumnShell />)
    expect(screen.queryByText('ModeMobileDock')).toBeNull()
    expect(screen.queryByText('Outlet')).toBeNull()
  })
})
