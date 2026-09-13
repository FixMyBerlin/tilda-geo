/** @vitest-environment jsdom */
import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { LayoutRegionSlug } from './LayoutRegionSlug'

const { useLoaderData, useMatches, useMatchRoute, useParams } = vi.hoisted(() => ({
  useLoaderData: vi.fn(),
  useMatches: vi.fn(),
  useMatchRoute: vi.fn(() => () => false),
  useParams: vi.fn(() => ({ regionSlug: 'test' })),
}))

vi.mock('@tanstack/react-router', () => ({
  getRouteApi: () => ({
    useLoaderData,
    useParams,
  }),
  useMatches,
  useMatchRoute,
  Outlet: () => <div>Outlet</div>,
}))

vi.mock('react-map-gl/maplibre', () => ({
  MapProvider: ({ children }: { children: React.ReactNode }) => children,
  useMap: () => ({ mainMap: undefined }),
}))

vi.mock('@/components/layouts/Header/HeaderRegionen/HeaderRegionen', () => ({
  HeaderRegionen: () => <header>HeaderRegionen</header>,
}))

vi.mock('@/components/shared/hooks/viewport/useBreakpoint', () => ({
  useBreakpoint: () => true,
}))

vi.mock('./pageRegionSlug/MapInterface', () => ({
  MapInterface: () => <div>MapInterface</div>,
}))

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

describe('LayoutRegionSlug', () => {
  const storage = new Map<string, string>()

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
    document.documentElement.style.removeProperty('--mode-panel-width')
  })

  test('renders map interface when authorized; mode outlet stays closed on map route', () => {
    useLoaderData.mockReturnValue({
      authorized: true,
      region: { status: 'PUBLIC' },
    })
    useMatches.mockImplementation(({ select }: { select: (matches: unknown) => unknown }) =>
      select([{ routeId: '/regionen/$regionSlug/' }]),
    )

    render(<LayoutRegionSlug />)

    expect(screen.getByText('HeaderRegionen')).toBeVisible()
    expect(screen.getByText('MapInterface')).toBeVisible()
    expect(screen.queryByText('Outlet')).toBeNull()
  })

  test('renders mode outlet when a mode route is active', () => {
    useLoaderData.mockReturnValue({
      authorized: true,
      region: { status: 'PUBLIC' },
    })
    useMatches.mockImplementation(({ select }: { select: (matches: unknown) => unknown }) =>
      select([{ routeId: '/regionen/$regionSlug/hinweise' }]),
    )

    render(<LayoutRegionSlug />)

    expect(screen.getByText('MapInterface')).toBeVisible()
    // Motion FadeSlideIn starts at opacity 0; assert presence rather than visibility.
    expect(screen.getByText('Outlet')).toBeInTheDocument()
  })
})
