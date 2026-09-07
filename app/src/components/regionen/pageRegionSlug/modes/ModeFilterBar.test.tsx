/** @vitest-environment jsdom */
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { ModeFilterBar } from './ModeFilterBar'
import { ModeFilterSelect, modeFilterIcons } from './ModeFilterSelect'
import {
  NOTES_COMMENTED_FILTER_OPTIONS,
  NOTES_REACTION_FILTER_OPTIONS,
  NOTES_STATUS_FILTER_OPTIONS,
  notesAuthorFilterOptions,
  uniqueOsmNoteAuthorNames,
} from './notes/notesModeFilters'
import { QA_STATUS_FILTER_OPTIONS, QA_STATUS_SELECT_ALL } from './qa/qaConfigStyles'
import { REVIEW_STATUS_FILTER_OPTIONS } from './reviewLists/reviewListsModeFilters'

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', ResizeObserverStub)
})

describe('notes author options', () => {
  test('OSM Autor:in uses comment[0] user names, includes Meine, and does not mix cuids', () => {
    const osmAuthorNames = uniqueOsmNoteAuthorNames([
      { properties: { comments: [{ user: 'alice' }] } },
      { properties: { comments: [{ user: 'bob' }] } },
      { properties: { comments: [{ user: 'alice' }] } },
      { properties: { comments: [{}] } },
    ])
    expect(osmAuthorNames).toEqual(['alice', 'bob'])

    const options = notesAuthorFilterOptions({
      authors: [{ id: 'cuid_should_not_appear', osmName: 'internal-user', currentUser: true }],
      osmAuthorNames,
      myValue: 'alice',
    })
    expect(options.map((option) => option.label)).toEqual(['Alle', 'Meine', 'bob'])
    expect(options.map((option) => option.value)).toEqual(['', 'alice', 'bob'])
    expect(options.some((option) => option.value === 'cuid_should_not_appear')).toBe(false)
  })

  test('internal Autor:in uses author cuids and Meine from currentUser', () => {
    const options = notesAuthorFilterOptions({
      authors: [
        { id: 'cuid-me', osmName: 'ich', currentUser: true },
        { id: 'cuid-other', osmName: 'other', currentUser: false },
      ],
      osmAuthorNames: [],
      myValue: 'cuid-me',
    })
    expect(options).toEqual([
      { value: '', label: 'Alle' },
      { value: 'cuid-me', label: 'Meine' },
      { value: 'cuid-other', label: 'other' },
    ])
  })
})

describe('filter dropdown options', () => {
  test('Hinweise poles include opposite Status, Kommentare, Reaktion', () => {
    expect(NOTES_STATUS_FILTER_OPTIONS.map((option) => option.label)).toEqual([
      'Alle',
      'Offen',
      'Erledigt',
    ])
    expect(NOTES_COMMENTED_FILTER_OPTIONS.map((option) => option.label)).toEqual([
      'Alle',
      'Mit Kommentar',
      'Ohne Kommentar',
    ])
    expect(NOTES_REACTION_FILTER_OPTIONS.map((option) => option.label)).toEqual([
      'Alle',
      'Keine eigene',
      'Eigene Reaktion',
    ])
  })

  test('QA status has no Aus; first option is the default status', () => {
    const values = QA_STATUS_FILTER_OPTIONS.map((option) => option.value)
    expect(values[0]).toBe('pending-needs-review')
    expect(values).toContain(QA_STATUS_SELECT_ALL)
    expect(values).toHaveLength(8)
  })

  test('Hinweise Autor:in dropdown lists Alle, Meine, then OSM authors', () => {
    const options = notesAuthorFilterOptions({
      authors: [],
      osmAuthorNames: ['bob'],
      myValue: 'alice',
    })
    render(
      <ModeFilterSelect
        label="Autor:in"
        icon={modeFilterIcons.author}
        value=""
        options={options}
        onChange={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Autor:in: Alle' }))
    expect(screen.getByRole('option', { name: 'Alle' })).toBeTruthy()
    expect(screen.getByRole('option', { name: 'Meine' })).toBeTruthy()
    expect(screen.getByRole('option', { name: 'bob' })).toBeTruthy()
  })

  test('Prüflisten status and Ausschnitt dropdowns render their options', () => {
    const onStatus = vi.fn()
    const onExtent = vi.fn()
    render(
      <ModeFilterBar search="" onSearchChange={vi.fn()} extent="view" onExtentChange={onExtent}>
        <ModeFilterSelect
          label="Status"
          icon={modeFilterIcons.status}
          value="all"
          options={REVIEW_STATUS_FILTER_OPTIONS}
          onChange={onStatus}
        />
      </ModeFilterBar>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Status: Alle' }))
    expect(screen.getByRole('option', { name: 'Alle' })).toBeTruthy()
    expect(screen.getByRole('option', { name: 'Offen' })).toBeTruthy()
    expect(screen.getByRole('option', { name: 'OK' })).toBeTruthy()
    expect(screen.getByRole('option', { name: 'Problem' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Status: Alle' }))

    expect(screen.getByRole('button', { name: 'Ausschnitt: Nur Karte' })).toHaveTextContent(
      'Nur Karte',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Ausschnitt: Nur Karte' }))
    expect(screen.getByRole('option', { name: 'Nur Karte' })).toBeTruthy()
    expect(screen.getByRole('option', { name: 'Überall' })).toBeTruthy()
  })
})

describe('ModeFilterBar', () => {
  test('collapsed search is an icon; click expands; stays open when query is set', () => {
    const onSearchChange = vi.fn()
    const { rerender } = render(
      <ModeFilterBar
        search=""
        onSearchChange={onSearchChange}
        searchPlaceholder="Hinweise durchsuchen…"
      />,
    )

    expect(screen.queryByPlaceholderText('Hinweise durchsuchen…')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Suchen' }))
    expect(screen.getByPlaceholderText('Hinweise durchsuchen…')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Suche schließen' })).toBeTruthy()

    rerender(
      <ModeFilterBar
        search="kreuzung"
        onSearchChange={onSearchChange}
        searchPlaceholder="Hinweise durchsuchen…"
      />,
    )
    expect(screen.getByPlaceholderText('Hinweise durchsuchen…')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Suchen' })).toBeNull()
  })

  test('extent is optional so callers without onExtentChange omit Ausschnitt', () => {
    render(<ModeFilterBar search="" onSearchChange={vi.fn()} />)
    expect(screen.queryByRole('button', { name: /Ausschnitt/ })).toBeNull()
  })
})
