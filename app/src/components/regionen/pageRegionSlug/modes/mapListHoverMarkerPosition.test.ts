import { describe, expect, test } from 'vitest'
import {
  edgeJumpOffset,
  edgeMarkerCenterInset,
  listHoverMarkerPosition,
  LIST_HOVER_EDGE_RING_PX,
} from './mapListHoverMarkerPosition'

const edgeInset = edgeMarkerCenterInset()

const container = { width: 800, height: 600 }

describe('listHoverMarkerPosition()', () => {
  test('in-view item: position sits on the item (not at edge)', () => {
    expect(listHoverMarkerPosition({ x: 400, y: 300 }, container)).toMatchObject({
      x: 400,
      y: 300,
      atEdge: false,
      edges: { left: false, right: false, top: false, bottom: false },
    })
    expect(listHoverMarkerPosition({ x: 0, y: 0 }, container).atEdge).toBe(false)
    expect(listHoverMarkerPosition({ x: 800, y: 600 }, container).atEdge).toBe(false)
  })

  test('clamps an item left of the viewport to the left edge at its height', () => {
    expect(listHoverMarkerPosition({ x: -150, y: 300 }, container)).toMatchObject({
      x: edgeInset,
      y: 300,
      atEdge: true,
      edges: { left: true, right: false, top: false, bottom: false },
    })
  })

  test('clamps an item right of the viewport to the right edge', () => {
    expect(listHoverMarkerPosition({ x: 1000, y: 100 }, container)).toMatchObject({
      x: container.width - edgeInset,
      y: 100,
      atEdge: true,
      edges: { left: false, right: true, top: false, bottom: false },
    })
  })

  test('clamps an item above/below the viewport to top/bottom edges', () => {
    expect(listHoverMarkerPosition({ x: 400, y: -50 }, container)).toMatchObject({
      x: 400,
      y: edgeInset,
      atEdge: true,
      edges: { left: false, right: false, top: true, bottom: false },
    })
    expect(listHoverMarkerPosition({ x: 400, y: 700 }, container)).toMatchObject({
      x: 400,
      y: container.height - edgeInset,
      atEdge: true,
      edges: { left: false, right: false, top: false, bottom: true },
    })
  })

  test('clamps diagonal offsets into the corner (both axes)', () => {
    expect(listHoverMarkerPosition({ x: -10, y: -10 }, container)).toMatchObject({
      x: edgeInset,
      y: edgeInset,
      atEdge: true,
      edges: { left: true, right: false, top: true, bottom: false },
    })
    expect(listHoverMarkerPosition({ x: 900, y: 700 }, container)).toMatchObject({
      x: container.width - edgeInset,
      y: container.height - edgeInset,
      atEdge: true,
      edges: { left: false, right: true, top: false, bottom: true },
    })
  })

  test('respects a custom margin', () => {
    expect(listHoverMarkerPosition({ x: -10, y: 300 }, container, 10)).toMatchObject({
      x: 10,
      y: 300,
      atEdge: true,
    })
  })
})

describe('edgeMarkerCenterInset()', () => {
  test('places the center so 40% of the 3× ring hangs outside the edge', () => {
    expect(LIST_HOVER_EDGE_RING_PX).toBe(66)
    expect(edgeMarkerCenterInset()).toBeCloseTo(6.6)
  })
})

describe('edgeJumpOffset()', () => {
  const none = { left: false, right: false, top: false, bottom: false }

  test('nudges toward the off-screen side', () => {
    expect(edgeJumpOffset({ ...none, left: true })).toEqual({ x: -8, y: 0 })
    expect(edgeJumpOffset({ ...none, right: true })).toEqual({ x: 8, y: 0 })
    expect(edgeJumpOffset({ ...none, top: true })).toEqual({ x: 0, y: -8 })
    expect(edgeJumpOffset({ ...none, bottom: true })).toEqual({ x: 0, y: 8 })
  })

  test('combines both axes at a corner', () => {
    expect(edgeJumpOffset({ left: true, right: false, top: true, bottom: false }, 6)).toEqual({
      x: -6,
      y: -6,
    })
  })
})
