import { describe, expect, it } from 'vitest'
import {
  isDataLoadNote,
  parseSpaceFinderDataNotes,
  spaceFinderDataNoteText,
} from './spaceFinderDataNotes'

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

  it('names the data source the worker could not read', () => {
    expect(spaceFinderDataNoteText({ factor: 'gebaeude', reason: 'tabelle_fehlt' })).toBe(
      'Ohne Gebäude berechnet: Die Daten fehlen auf diesem Server.',
    )
    expect(spaceFinderDataNoteText({ factor: 'gebaeude', reason: 'abfrage_fehlgeschlagen' })).toBe(
      'Ohne Gebäude berechnet: Die Daten konnten nicht gelesen werden.',
    )
    expect(spaceFinderDataNoteText({ factor: 'neu', reason: 'tabelle_fehlt' })).toBe(
      'Ohne neu berechnet: Die Daten fehlen auf diesem Server.',
    )
  })

  it('falls back for unknown reasons', () => {
    expect(spaceFinderDataNoteText({ factor: 'neu', reason: 'etwas_anderes' })).toBe(
      'Hinweis zur Berechnung (neu): etwas anderes',
    )
  })
})

describe('isDataLoadNote', () => {
  it('is true only for notes about data the worker could not read', () => {
    expect(isDataLoadNote({ factor: 'gebaeude', reason: 'abfrage_fehlgeschlagen' })).toBe(true)
    expect(isDataLoadNote({ factor: 'versiegelung', reason: 'tabelle_fehlt' })).toBe(true)
    expect(isDataLoadNote({ factor: 'vegetation', reason: 'keine_luftbildquelle' })).toBe(false)
  })
})
