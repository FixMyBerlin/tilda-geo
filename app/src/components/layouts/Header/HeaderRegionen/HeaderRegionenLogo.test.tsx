/** @vitest-environment jsdom */
import { render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { HeaderRegionenLogo } from './HeaderRegionenLogo'

const { useRegionMock } = vi.hoisted(() => ({
  useRegionMock: vi.fn(),
}))

vi.mock('@/components/regionen/pageRegionSlug/regionUtils/useRegion', () => ({
  useRegion: () => useRegionMock(),
}))

vi.mock('@/components/shared/Img', () => ({
  Img: () => <div>Img</div>,
}))

const privateRegion = {
  name: 'Berlin',
  fullName: 'Berlin Baumanalyse',
  product: 'analysis' as const,
  status: 'PRIVATE' as const,
  logoPath: null,
  logoWhiteBackgroundRequired: false,
}

describe('HeaderRegionenLogo', () => {
  test('renders for private region without throwing', () => {
    useRegionMock.mockReturnValue(privateRegion)

    render(<HeaderRegionenLogo />)

    expect(screen.getByText('Berlin Baumanalyse')).toBeVisible()
  })

  test('renders lock and Deaktiviert label for deactivated region', () => {
    useRegionMock.mockReturnValue({ ...privateRegion, status: 'DEACTIVATED' })

    const { container } = render(<HeaderRegionenLogo />)

    expect(screen.getByText('Berlin Baumanalyse')).toBeVisible()
    expect(screen.getByText('Deaktiviert')).toBeVisible()
    expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy()
  })
})
