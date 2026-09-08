/** @vitest-environment jsdom */
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { MapNavigationButtons } from './MapNavigationButtons'

const { zoomIn, zoomOut, resetNorthPitch, on, off, camera } = vi.hoisted(() => ({
  zoomIn: vi.fn(),
  zoomOut: vi.fn(),
  resetNorthPitch: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  camera: { zoom: 10, minZoom: 4, maxZoom: 22 },
}))

const mapLibreMap = {
  zoomIn,
  zoomOut,
  resetNorthPitch,
  getZoom: () => camera.zoom,
  getBearing: () => 0,
  getPitch: () => 0,
  getRoll: () => 0,
  getMinZoom: () => camera.minZoom,
  getMaxZoom: () => camera.maxZoom,
  on,
  off,
}

vi.mock('react-map-gl/maplibre', () => ({
  useMap: () => ({
    mainMap: {
      getMap: () => mapLibreMap,
    },
  }),
}))

describe('MapNavigationButtons', () => {
  test('calls MapLibre zoomIn/zoomOut with the original event', () => {
    camera.zoom = 10
    render(<MapNavigationButtons mapId="mainMap" />)

    fireEvent.click(screen.getByRole('button', { name: 'Hineinzoomen' }))
    expect(zoomIn).toHaveBeenCalledWith({}, { originalEvent: expect.any(MouseEvent) })

    fireEvent.click(screen.getByRole('button', { name: 'Herauszoomen' }))
    expect(zoomOut).toHaveBeenCalledWith({}, { originalEvent: expect.any(MouseEvent) })
    expect(screen.queryByRole('button', { name: 'Nach Norden ausrichten' })).not.toBeInTheDocument()
  })

  test('shows compass and resets north pitch', () => {
    camera.zoom = 10
    render(<MapNavigationButtons mapId="mainMap" showCompass />)

    fireEvent.click(screen.getByRole('button', { name: 'Nach Norden ausrichten' }))
    expect(resetNorthPitch).toHaveBeenCalledWith({}, { originalEvent: expect.any(MouseEvent) })
  })

  test('disables zoom in at max zoom and zoom out at min zoom', () => {
    camera.zoom = 22
    const { rerender } = render(<MapNavigationButtons mapId="mainMap" />)
    expect(screen.getByRole('button', { name: 'Hineinzoomen' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Herauszoomen' })).toBeEnabled()

    camera.zoom = 4
    rerender(<MapNavigationButtons mapId="mainMap" />)
    expect(screen.getByRole('button', { name: 'Hineinzoomen' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Herauszoomen' })).toBeDisabled()
  })
})
