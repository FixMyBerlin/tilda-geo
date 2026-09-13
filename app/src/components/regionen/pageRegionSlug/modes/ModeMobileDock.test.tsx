/** @vitest-environment jsdom */
import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { ModeMobileDock } from './ModeMobileDock'

const useNotesComposeActive = vi.hoisted(() => vi.fn(() => false))
const useReviewDrawActive = vi.hoisted(() => vi.fn(() => false))
const useInspectorRenderableFeatures = vi.hoisted(() => vi.fn((): { id: number }[] => []))

vi.mock('@tanstack/react-router', () => ({
  Outlet: () => <div>Outlet</div>,
}))

vi.mock('react-map-gl/maplibre', () => ({
  useMap: () => ({ mainMap: undefined }),
}))

vi.mock('./useCurrentMode', () => ({
  useOptimisticMode: () => 'notes' as const,
}))

vi.mock('./notes/useNotesComposeActive', () => ({
  useNotesComposeActive,
}))

vi.mock('./reviewLists/useReviewDrawActive', () => ({
  useReviewDrawActive,
}))

vi.mock('../SidebarInspector/useInspectorRenderableFeatures', () => ({
  useInspectorRenderableFeatures,
}))

describe('ModeMobileDock', () => {
  beforeEach(() => {
    useNotesComposeActive.mockReturnValue(false)
    useReviewDrawActive.mockReturnValue(false)
    useInspectorRenderableFeatures.mockReturnValue([])
  })

  afterEach(() => {
    document.documentElement.style.removeProperty('--mode-mobile-dock-height')
  })

  test('starts expanded and can collapse without leaving the mode', () => {
    render(<ModeMobileDock />)
    expect(screen.getByText('Outlet')).toBeInTheDocument()
    expect(screen.getByLabelText('Modus-Panel')).toHaveAttribute('data-expanded', 'true')

    fireEvent.click(screen.getByRole('button', { name: 'Panel verkleinern' }))
    expect(screen.getByLabelText('Modus-Panel')).toHaveAttribute('data-expanded', 'false')
    expect(screen.getByRole('button', { name: 'Panel vergrößern' })).toBeTruthy()
    expect(screen.getByText('Outlet')).toBeInTheDocument()
  })

  test('auto-collapses while composing a note and can be expanded again', () => {
    useNotesComposeActive.mockReturnValue(true)
    render(<ModeMobileDock />)
    expect(screen.getByLabelText('Modus-Panel')).toHaveAttribute('data-expanded', 'false')

    fireEvent.click(screen.getByRole('button', { name: 'Panel vergrößern' }))
    expect(screen.getByLabelText('Modus-Panel')).toHaveAttribute('data-expanded', 'true')
  })

  test('yields to the inspector sheet and restores after it closes', () => {
    const { rerender } = render(<ModeMobileDock />)
    expect(screen.getByLabelText('Modus-Panel')).toHaveAttribute('data-expanded', 'true')

    useInspectorRenderableFeatures.mockReturnValue([{ id: 1 }])
    rerender(<ModeMobileDock />)
    expect(screen.getByLabelText('Modus-Panel')).toHaveAttribute('data-expanded', 'false')
    expect(screen.getByRole('button', { name: 'Panel vergrößern' })).toBeDisabled()

    useInspectorRenderableFeatures.mockReturnValue([])
    rerender(<ModeMobileDock />)
    expect(screen.getByLabelText('Modus-Panel')).toHaveAttribute('data-expanded', 'true')
  })
})
