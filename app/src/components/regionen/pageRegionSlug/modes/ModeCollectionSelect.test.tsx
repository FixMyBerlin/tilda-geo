/** @vitest-environment jsdom */
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import {
  ACTIVE_COLLECTION_TITLE,
  INACTIVE_COLLECTION_TITLE,
  ModeCollectionSelect,
  PRIVATE_DATASET_TITLE,
} from './ModeCollectionSelect'

describe('ModeCollectionSelect', () => {
  test('has no empty option and shows a lock on every private item', () => {
    render(
      <ModeCollectionSelect
        aria-label="Konfiguration"
        value="b"
        options={[
          { value: 'a', label: 'Alpha', private: true },
          { value: 'b', label: 'Beta', private: true },
        ]}
        onChange={vi.fn()}
      />,
    )

    expect(screen.queryByRole('option', { name: /wählen|keine/i })).toBeNull()
    expect(screen.getByRole('option', { name: 'Alpha' })).toBeTruthy()
    expect(screen.getByRole('option', { name: 'Beta' })).toBeTruthy()
    expect(screen.getAllByTitle(PRIVATE_DATASET_TITLE)).toHaveLength(2)
  })

  test('shows an info icon with the shared-region hint next to the lock', () => {
    const hint = 'Liste geteilt mit: »Alpha«, »Beta«'
    render(
      <ModeCollectionSelect
        aria-label="Prüfliste"
        value="9"
        options={[
          { value: '9', label: 'Geteilt', description: '2', private: true, regionHint: hint },
          { value: '2', label: 'Lokal', description: '1', private: true },
        ]}
      />,
    )

    expect(screen.queryByTitle(hint)).toBeNull()
    expect(screen.getByLabelText(hint)).toBeTruthy()
    expect(screen.getAllByTitle(PRIVATE_DATASET_TITLE)).toHaveLength(2)
  })

  test('QA/Prüflisten marks the selected list and has no placeholder option', () => {
    render(
      <ModeCollectionSelect
        aria-label="Prüfliste"
        value="9"
        options={[
          { value: '9', label: 'Neueste', description: '3', private: true },
          { value: '2', label: 'Ältere', description: '1', private: true },
        ]}
        onChange={vi.fn()}
      />,
    )

    expect(screen.getByRole('option', { name: /Neueste/ }).getAttribute('aria-selected')).toBe(
      'true',
    )
    expect(screen.queryByText('— keine —')).toBeNull()
    expect(screen.queryByText('— Konfiguration wählen —')).toBeNull()
  })

  test('Hinweise OSM is public and read-only does not change the value', () => {
    const onChange = vi.fn()
    render(
      <ModeCollectionSelect
        aria-label="Hinweise-Sammlung"
        value="osm"
        options={[{ value: 'osm', label: 'OpenStreetMap-Hinweise (öffentlich)', private: false }]}
        readOnly
        onChange={onChange}
      />,
    )

    expect(screen.getByRole('option', { name: 'OpenStreetMap-Hinweise (öffentlich)' })).toBeTruthy()
    expect(screen.queryByTitle(PRIVATE_DATASET_TITLE)).toBeNull()
    fireEvent.click(screen.getByRole('option', { name: 'OpenStreetMap-Hinweise (öffentlich)' }))
    expect(onChange).not.toHaveBeenCalled()
  })

  test('QA marks active and inactive configs with check-badge titles', () => {
    render(
      <ModeCollectionSelect
        aria-label="Konfiguration"
        value="a"
        options={[
          { value: 'a', label: 'Parkraum 2026 Innenstadt', private: true, inactive: false },
          { value: 'b', label: 'eUVM Parkraum 2025 Innenstadt', private: true, inactive: true },
        ]}
        onChange={vi.fn()}
      />,
    )

    expect(screen.getByTitle(ACTIVE_COLLECTION_TITLE)).toBeTruthy()
    expect(screen.getByTitle(INACTIVE_COLLECTION_TITLE)).toBeTruthy()
  })

  test('mixed Hinweise: OSM is public, folders are private, and onChange receives osm', () => {
    const onChange = vi.fn()
    render(
      <ModeCollectionSelect
        aria-label="Ordner"
        value="9"
        options={[
          { value: 'osm', label: 'OpenStreetMap-Hinweise (öffentlich)', private: false },
          { value: '9', label: 'Allgemein', description: '3', private: true },
        ]}
        onChange={onChange}
      />,
    )

    expect(screen.queryByTitle(PRIVATE_DATASET_TITLE)).toBeTruthy()
    expect(screen.getAllByTitle(PRIVATE_DATASET_TITLE)).toHaveLength(1)
    fireEvent.click(screen.getByRole('option', { name: 'OpenStreetMap-Hinweise (öffentlich)' }))
    expect(onChange).toHaveBeenCalledWith('osm')
  })

  test('internal folders (Hinweise-Ordner) are private and call onChange', () => {
    const onChange = vi.fn()
    render(
      <ModeCollectionSelect
        aria-label="Ordner"
        value="9"
        options={[
          { value: '9', label: 'Allgemein', description: '3', private: true },
          { value: '2', label: 'Kreuzungen', description: '1', private: true },
        ]}
        onChange={onChange}
      />,
    )

    expect(screen.getByRole('option', { name: /Allgemein/ }).getAttribute('aria-selected')).toBe(
      'true',
    )
    expect(screen.getAllByTitle(PRIVATE_DATASET_TITLE)).toHaveLength(2)
    fireEvent.click(screen.getByRole('option', { name: /Kreuzungen/ }))
    expect(onChange).toHaveBeenCalledWith('2')
  })
})
