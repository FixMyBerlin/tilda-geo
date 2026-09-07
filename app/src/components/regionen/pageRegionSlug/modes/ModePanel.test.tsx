/** @vitest-environment jsdom */
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import type { ListHoverMarkerPosition } from './mapListHoverMarkerPosition'
import { ModePanel } from './ModePanel'

const { useCurrentMode, useListHoverMarkerPosition } = vi.hoisted(() => ({
  useCurrentMode: vi.fn(() => 'notes' as 'map' | 'notes' | 'qa' | 'reviewLists'),
  useListHoverMarkerPosition: vi.fn((): ListHoverMarkerPosition | null => null),
}))

vi.mock('./useCurrentMode', () => ({
  useCurrentMode,
}))

vi.mock('./useListHoverMarkerPosition', () => ({
  useListHoverMarkerPosition,
}))

vi.mock('@/components/shared/hooks/viewport/useBreakpoint', () => ({
  useBreakpoint: () => true,
}))

vi.mock('./useResizableModePanelWidth', () => ({
  useResizableModePanelWidth: () => ({
    panelRef: { current: null },
    onResizeHandlePointerDown: () => {},
  }),
}))

vi.mock('../PanelResizeHandle', () => ({
  PanelResizeHandle: () => null,
}))

vi.mock('@/components/shared/Tooltip/Tooltip', () => ({
  Tooltip: ({ text, children }: { text: string; children: React.ReactNode }) => (
    <div data-tooltip={text}>{children}</div>
  ),
}))

const atEdgePosition = {
  x: 24,
  y: 300,
  atEdge: true,
  edges: { left: true, right: false, top: false, bottom: false },
} satisfies ListHoverMarkerPosition

describe('ModePanel', () => {
  test('list header shows mode title, actions, subtitle, collection and filter', () => {
    useCurrentMode.mockReturnValue('reviewLists')
    useListHoverMarkerPosition.mockReturnValue(null)
    render(
      <ModePanel
        title="Prüflisten"
        subtitle="Liste geteilt mit: berlin"
        collection={<div>Collection</div>}
        filter={<div>Filter</div>}
        actions={<button type="button">Export</button>}
      >
        <p>List body</p>
      </ModePanel>,
    )

    expect(screen.getByRole('heading', { name: 'Prüflisten' })).toBeTruthy()
    expect(
      screen.getByRole('heading', { name: 'Prüflisten' }).closest('[data-tooltip]'),
    ).toHaveAttribute('data-tooltip', 'Prüflisten — Liste geteilt mit: berlin')
    expect(screen.getByText('Liste geteilt mit: berlin')).toBeTruthy()
    expect(screen.getByText('Export')).toBeTruthy()
    fireEvent.click(screen.getByRole('heading', { name: 'Prüflisten' }))
    expect(screen.getByText('Collection')).toBeTruthy()
    expect(screen.getByText('Filter')).toBeTruthy()
    expect(screen.getByText('List body')).toBeTruthy()
    expect(screen.queryByLabelText('Zurück zur Liste')).toBeNull()
  })

  test('collection stays visible without a disclosure when always open', () => {
    useCurrentMode.mockReturnValue('reviewLists')
    useListHoverMarkerPosition.mockReturnValue(null)
    render(
      <ModePanel title="Prüflisten" collection={<div>Collection</div>} collectionAlwaysOpen>
        <p>List body</p>
      </ModePanel>,
    )

    expect(screen.getByText('Collection')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Prüflisten' }).closest('button')).toBeNull()
  })

  test('does not show the OSM notes subtitle on the Hinweise list', () => {
    useCurrentMode.mockReturnValue('notes')
    useListHoverMarkerPosition.mockReturnValue(null)
    render(
      <ModePanel title="Hinweise" actions={<button type="button">Neuer Hinweis</button>}>
        <p>Notes list</p>
      </ModePanel>,
    )

    expect(screen.queryByText('Daten liegen in OpenStreetMap (schreibgeschützt)')).toBeNull()
    expect(screen.getByText('Neuer Hinweis')).toBeTruthy()
  })

  test('detail header shows back button and detail title without list chrome', () => {
    useCurrentMode.mockReturnValue('notes')
    useListHoverMarkerPosition.mockReturnValue(atEdgePosition)
    const onBack = vi.fn()
    render(
      <ModePanel
        title="Hinweise"
        collection={<div>Collection</div>}
        filter={<div>Filter</div>}
        detail={{
          title: '#eUVM-Daten',
          onBack,
          children: <p>Detail body</p>,
        }}
      >
        <p>List body</p>
      </ModePanel>,
    )

    expect(screen.getByRole('heading', { name: '#eUVM-Daten' })).toBeTruthy()
    expect(
      screen.getByRole('heading', { name: '#eUVM-Daten' }).closest('[data-tooltip]'),
    ).toHaveAttribute('data-tooltip', '#eUVM-Daten')
    expect(screen.getByText('Detail body')).toBeTruthy()
    expect(screen.queryByText('Neuer Hinweis')).toBeNull()
    expect(screen.queryByText('List body')).toBeNull()
    expect(screen.queryByText('Collection')).toBeNull()
    expect(screen.queryByText('Filter')).toBeNull()
    expect(screen.queryByText('Außerhalb des Kartenausschnitts')).toBeNull()

    fireEvent.click(screen.getByLabelText('Zurück zur Liste'))
    expect(onBack).toHaveBeenCalledOnce()
  })

  test('list footer is only shown when the hovered item is at the map edge', () => {
    useCurrentMode.mockReturnValue('notes')
    useListHoverMarkerPosition.mockReturnValue(atEdgePosition)
    const { rerender } = render(
      <ModePanel title="Hinweise">
        <p>List body</p>
      </ModePanel>,
    )
    expect(screen.getByText('Außerhalb des Kartenausschnitts')).toBeTruthy()

    useListHoverMarkerPosition.mockReturnValue({
      ...atEdgePosition,
      atEdge: false,
      edges: { left: false, right: false, top: false, bottom: false },
    })
    rerender(
      <ModePanel title="Hinweise">
        <p>List body</p>
      </ModePanel>,
    )
    expect(screen.queryByText('Außerhalb des Kartenausschnitts')).toBeNull()
  })
})
