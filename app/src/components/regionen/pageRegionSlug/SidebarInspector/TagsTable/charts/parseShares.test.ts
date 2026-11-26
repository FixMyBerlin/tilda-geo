import { describe, expect, test } from 'vitest'
import { parseShares } from './parseShares'

describe('parseShares', () => {
  test('parses labels with brackets', () => {
    const shares = parseShares(
      '47 % Sonstige Wege (Gehwege, Wege durch Grünflächen, Plätze); 41 % Radweg; 10 % Keine Radinfrastruktur vorhanden; 2 % Gemeinsamer Geh- und Radweg mit Z240',
    )
    expect(shares?.map(({ label, percentText }) => [label, percentText])).toEqual([
      ['Sonstige Wege (Gehwege, Wege durch Grünflächen, Plätze)', '47\u00a0%'],
      ['Radweg', '41\u00a0%'],
      ['Keine Radinfrastruktur vorhanden', '10\u00a0%'],
      ['Gemeinsamer Geh- und Radweg mit Z240', '2\u00a0%'],
    ])
  })

  test('keeps semicolons inside brackets in the label', () => {
    expect(parseShares('60 % Sonstige (a; b); 40 % Radweg')?.map(({ label }) => label)).toEqual([
      'Sonstige (a; b)',
      'Radweg',
    ])
  })

  test('reads <1 % as 0.5 and normalizes the widths to 100', () => {
    const shares = parseShares('88 % Radweg; 11 % Schutzstreifen; <1 % Kreuzungsbereich')
    expect(shares?.[2]).toMatchObject({ label: 'Kreuzungsbereich', percentText: '<1\u00a0%' })
    expect(shares?.[2]?.width).toBeCloseTo((0.5 / 99.5) * 100)
    const totalWidth = shares!.reduce((sum, share) => sum + share.width, 0)
    expect(totalWidth).toBeCloseTo(100)
  })

  test('parses a single entry', () => {
    expect(parseShares('100 % Radweg')).toEqual([
      { label: 'Radweg', percentText: '100\u00a0%', width: 100 },
    ])
  })

  test('returns null for text it cannot read', () => {
    expect(parseShares('Radweg')).toBeNull()
    expect(parseShares('47 % Radweg; Schutzstreifen')).toBeNull()
    expect(parseShares('')).toBeNull()
    expect(parseShares(undefined)).toBeNull()
    expect(parseShares(12)).toBeNull()
  })
})
