import { describe, expect, it } from 'vitest'
import { parseSpaceFinderDataNotes, spaceFinderDataNoteText } from './spaceFinderDataNotes'

describe('parseSpaceFinderDataNotes', () => {
  it('reads a list of notes', () => {
    expect(
      parseSpaceFinderDataNotes([{ factor: 'versiegelung', reason: 'tabelle_fehlt' }]),
    ).toEqual([{ factor: 'versiegelung', reason: 'tabelle_fehlt' }])
  })

  it('returns no notes for old runs and malformed values', () => {
    expect(parseSpaceFinderDataNotes(null)).toEqual([])
    expect(parseSpaceFinderDataNotes({ factor: 'x' })).toEqual([])
    expect(parseSpaceFinderDataNotes([{ factor: 'x' }])).toEqual([])
  })
})

describe('spaceFinderDataNoteText', () => {
  it('maps known reasons', () => {
    expect(spaceFinderDataNoteText({ factor: 'versiegelung', reason: 'tabelle_fehlt' })).toContain(
      'Versiegelung nicht berechnet',
    )
    expect(
      spaceFinderDataNoteText({ factor: 'vegetation', reason: 'keine_luftbildquelle' }),
    ).toContain('Luftbildquelle')
  })

  it('falls back for unknown reasons', () => {
    expect(spaceFinderDataNoteText({ factor: 'neu', reason: 'etwas_anderes' })).toBe(
      'Hinweis zur Berechnung (neu): etwas anderes',
    )
  })
})
