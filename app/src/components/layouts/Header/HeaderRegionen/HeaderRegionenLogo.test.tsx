/** @vitest-environment jsdom */
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, test, vi } from 'vitest'
import { HeaderRegionenLogo } from './HeaderRegionenLogo'

const { useLoaderData } = vi.hoisted(() => ({
  useLoaderData: vi.fn(),
}))

vi.mock('@tanstack/react-router', () => ({
  getRouteApi: () => ({
    useLoaderData,
  }),
}))

vi.mock('@/components/regionen/pageRegionSlug/regionUtils/useStaticRegion', () => ({
  useStaticRegion: () => ({
    name: 'Berlin',
    fullName: 'Berlin Baumanalyse',
    product: 'atlas',
    logoPath: null,
    externalLogoPath: null,
    logoWhiteBackgroundRequired: false,
  }),
}))

vi.mock('@/components/shared/Img', () => ({
  Img: () => <div>Img</div>,
}))

vi.mock('@/components/shared/text/Pill', () => ({
  Pill: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}))

describe('HeaderRegionenLogo', () => {
  test('renders for unauthorized private region without throwing', () => {
    useLoaderData.mockReturnValue({
      authorized: false,
      region: { status: 'PRIVATE' },
    })

    render(<HeaderRegionenLogo />)

    expect(screen.getByText('Berlin Baumanalyse')).toBeVisible()
  })

  test('renders lock and Deaktiviert label for deactivated region', () => {
    useLoaderData.mockReturnValue({
      authorized: true,
      region: { status: 'DEACTIVATED' },
    })

    const { container } = render(<HeaderRegionenLogo />)

    expect(screen.getByText('Berlin Baumanalyse')).toBeVisible()
    expect(screen.getByText('Deaktiviert')).toBeVisible()
    expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy()
  })
})
