/** @vitest-environment jsdom */
import { render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { PageRegionSlug } from './PageRegionSlug'

const { useLoaderData } = vi.hoisted(() => ({
  useLoaderData: vi.fn(),
}))

vi.mock('@tanstack/react-router', () => ({
  getRouteApi: () => ({
    useLoaderData,
  }),
}))

vi.mock('@/components/layouts/Header/HeaderRegionen/HeaderRegionen', () => ({
  HeaderRegionen: () => <header>HeaderRegionen</header>,
}))

vi.mock('./pageRegionSlug/MapInterface', () => ({
  MapInterface: () => <div>MapInterface</div>,
}))

vi.mock('./pageRegionSlug/RegionDeactivated', () => ({
  RegionAccessDenied: ({ status }: { status: string }) => <div>RegionAccessDenied:{status}</div>,
}))

describe('PageRegionSlug', () => {
  test('renders map interface when authorized', () => {
    useLoaderData.mockReturnValue({
      authorized: true,
      region: { status: 'PUBLIC' },
    })

    render(<PageRegionSlug />)

    expect(screen.getByText('HeaderRegionen')).toBeVisible()
    expect(screen.getByText('MapInterface')).toBeVisible()
    expect(screen.queryByText('RegionAccessDenied:PUBLIC')).toBeNull()
  })

  test('renders access denied component for unauthorized private region', () => {
    useLoaderData.mockReturnValue({
      authorized: false,
      region: { status: 'PRIVATE' },
    })

    render(<PageRegionSlug />)

    expect(screen.getByText('HeaderRegionen')).toBeVisible()
    expect(screen.getByText('RegionAccessDenied:PRIVATE')).toBeVisible()
    expect(screen.queryByText('MapInterface')).toBeNull()
  })
})
