import { describe, expect, test } from 'vitest'
import { interactivityConfiguration } from '../../mapDataSources/generalization/interacitvityConfiguartion'
import {
  bikelaneVisualLineOffset,
  lowZoomLineWidthPx,
  withBikelaneVisualLineOffset,
} from './bikelaneLineOffset'

const INTERACTIVE_MINZOOM = interactivityConfiguration.bikelanes.minzoom

const asRecord = (paint: unknown) => paint as Record<string, unknown>

describe('lowZoomLineWidthPx', () => {
  test('uses a numeric line-width as-is', () => {
    expect(lowZoomLineWidthPx(2)).toBe(2)
  })

  test('uses the first interpolate output (clamped width below the first stop)', () => {
    expect(lowZoomLineWidthPx(['interpolate', ['linear'], ['zoom'], 8, 1.5, 16, 3])).toBe(1.5)
  })

  test('uses the step default output', () => {
    expect(lowZoomLineWidthPx(['step', ['zoom'], 1, 14, 4])).toBe(1)
  })

  test('falls back to the typical low-zoom bikelane stroke', () => {
    expect(lowZoomLineWidthPx(undefined)).toBe(1.5)
  })
})

describe('bikelaneVisualLineOffset', () => {
  test('does not read `offset` below the interactivity cutoff', () => {
    const expression = JSON.stringify(bikelaneVisualLineOffset(1.5))
    const compactStop = JSON.stringify(bikelaneVisualLineOffset(1.5)[4])
    expect(compactStop).not.toContain('offset')
    expect(expression).toContain('offset')
  })

  test('nudges left/right by half the low-zoom stroke via `id`', () => {
    const expression = bikelaneVisualLineOffset([
      'interpolate',
      ['linear'],
      ['zoom'],
      8,
      1.5,
      16,
      3,
    ])
    expect(expression[2]).toEqual(['zoom'])
    expect(expression[3]).toBe(0)
    expect(expression[4]).toEqual([
      'case',
      [
        'any',
        ['in', '/left', ['to-string', ['coalesce', ['get', 'id'], '']]],
        ['in', '/right', ['to-string', ['coalesce', ['get', 'id'], '']]],
      ],
      0.75,
      0,
    ])
    expect(expression[5]).toBe(INTERACTIVE_MINZOOM - 1)
    expect(expression[6]).toEqual(expression[4])
  })

  test('switches to meter-based `offset` at the interactivity cutoff', () => {
    const expression = bikelaneVisualLineOffset(1.5)
    expect(expression[7]).toBe(INTERACTIVE_MINZOOM)
    expect(JSON.stringify(expression[8])).toContain('offset')
    expect(expression[9]).toBe(24)
    expect(JSON.stringify(expression[10])).toContain('offset')
  })
})

describe('withBikelaneVisualLineOffset', () => {
  test("overrides line-offset on line layers from that layer's stroke width", () => {
    const [line] = withBikelaneVisualLineOffset([
      {
        id: 'visible',
        type: 'line',
        paint: {
          'line-width': ['interpolate', ['linear'], ['zoom'], 8, 2, 16, 4],
          'line-offset': ['interpolate', ['linear'], ['zoom'], 12, 0, 15, -1],
        },
      },
    ])
    const lineWidth = ['interpolate', ['linear'], ['zoom'], 8, 2, 16, 4]
    expect(asRecord(line?.paint)['line-offset']).toEqual(bikelaneVisualLineOffset(lineWidth))
  })

  test('leaves symbol layers unchanged', () => {
    const symbol = {
      id: 'label',
      type: 'symbol',
      layout: { 'symbol-placement': 'line-center' },
    }
    expect(withBikelaneVisualLineOffset([symbol])).toEqual([symbol])
  })
})

describe('bikelanes stylingKeys', () => {
  test('does not ship `offset` below the interactivity cutoff', () => {
    expect(interactivityConfiguration.bikelanes.stylingKeys).not.toContain('offset')
  })
})
