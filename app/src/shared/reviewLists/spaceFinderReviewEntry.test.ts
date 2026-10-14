import { describe, expect, test } from 'vitest'
import { SPACE_FINDER_CHECKLIST } from './spaceFinderChecklist.const'
import {
  buildSpaceFinderReviewProperties,
  parseSpaceFinderSourceMeta,
  spaceFinderImportId,
} from './spaceFinderReviewEntry'

const base = {
  areaTitle: 'Mitte',
  variantTitle: 'Standard',
  h3Id: '8b1f',
}

describe('spaceFinderImportId', () => {
  test('prefixes the h3 id', () => {
    expect(spaceFinderImportId('8b1f')).toBe('flaechenfinder:8b1f')
  })
})

describe('buildSpaceFinderReviewProperties', () => {
  test('maps tile values to readable German keys', () => {
    expect(
      buildSpaceFinderReviewProperties({
        ...base,
        candidateProperties: {
          mce_gesamtscore: 71.6,
          eignungsklasse: 'gut',
          cluster_area_m2: 1234.4,
          score_bedarf: 72.4,
          score_bebauung: 55,
          score_radweg: 80,
          score_oepnv: 60.2,
          score_vegetation: -3.4,
          score_parken: 2,
          score_platz: 0,
          score_kreuzung: null,
        },
      }),
    ).toEqual({
      Gesamtscore: '72',
      Eignungsklasse: 'gut',
      'Clusterfläche (m²)': (1234).toLocaleString('de-DE'),
      Planungsgebiet: 'Mitte',
      Variante: 'Standard',
      'H3-ID': '8b1f',
      Teilscores_markdown:
        '- Bedarf 72\n- Bebauung 55\n- Radweg 80\n- ÖPNV + Bikesharing 60\n\n' +
        'Zu-/Abschläge:\n- Vegetation −3\n- Parken +2',
      Prüfkriterien_markdown: SPACE_FINDER_CHECKLIST.map(
        (c, index) => `${index + 1}. ${c.label}`,
      ).join('\n'),
    })
  })

  test('has no position number (the selection is not saved)', () => {
    const properties = buildSpaceFinderReviewProperties({ ...base, candidateProperties: {} })
    expect(properties).not.toHaveProperty('Auswahl-Nr.')
  })

  test('lists the exclusion reasons and omits the key when none applies', () => {
    const excluded = buildSpaceFinderReviewProperties({
      ...base,
      candidateProperties: { gebaeude: true, fahrbahn: true, score_hangneigung: 0 },
    })
    expect(excluded.Ausschluss).toBe('Gebäude, Straße, Zu steil')
    const free = buildSpaceFinderReviewProperties({
      ...base,
      candidateProperties: { gebaeude: false, score_hangneigung: 40 },
    })
    expect(free).not.toHaveProperty('Ausschluss')
  })

  test('lists each Eigene-Daten dataset in the Teilscores, the exclusion stays short', () => {
    const properties = buildSpaceFinderReviewProperties({
      ...base,
      eigendatenNames: { a: 'Wunschorte', b: 'Erlaubte Zonen' },
      candidateProperties: {
        eigendaten_ausschluss: true,
        score_bedarf: 40,
        score_eigendaten: 12,
        eigendaten_details: JSON.stringify([
          { id: 'a', p: 12 },
          { id: 'b', x: 1 },
        ]),
      },
    })
    expect(properties.Ausschluss).toBe('Eigene Daten')
    expect(properties.Teilscores_markdown).toContain(
      '- Eigene Daten „Wunschorte“ +12\n- Eigene Daten „Erlaubte Zonen“ ausgeschlossen',
    )
  })

  test('falls back to the plain label for runs without per-dataset details', () => {
    const properties = buildSpaceFinderReviewProperties({
      ...base,
      candidateProperties: { eigendaten_ausschluss: true },
    })
    expect(properties.Ausschluss).toBe('Eigene Daten')
  })

  test('writes the Teilscores as a Markdown list, one value per line', () => {
    const properties = buildSpaceFinderReviewProperties({
      ...base,
      candidateProperties: { score_bedarf: 10, score_vegetation: 4 },
    })
    expect(properties.Teilscores_markdown).toBe('- Bedarf 10\n\nZu-/Abschläge:\n- Vegetation +4')
  })

  test('adds the same checklist to every candidate as a numbered Markdown list', () => {
    const properties = buildSpaceFinderReviewProperties({ ...base, candidateProperties: {} })
    const lines = properties.Prüfkriterien_markdown!.split('\n')
    expect(lines).toHaveLength(SPACE_FINDER_CHECKLIST.length)
    expect(lines.every((line, index) => line.startsWith(`${index + 1}. `))).toBe(true)
  })

  test('omits missing or invalid values', () => {
    const properties = buildSpaceFinderReviewProperties({
      ...base,
      candidateProperties: { mce_gesamtscore: null, eignungsklasse: ' ', cluster_area_m2: 'x' },
    })
    expect(Object.keys(properties)).toEqual([
      'Planungsgebiet',
      'Variante',
      'H3-ID',
      'Prüfkriterien_markdown',
    ])
  })

  test('never emits reserved tilda_ keys', () => {
    const properties = buildSpaceFinderReviewProperties({
      ...base,
      candidateProperties: { tilda_importId: 'x' },
    })
    expect(Object.keys(properties).some((key) => key.startsWith('tilda_'))).toBe(false)
  })
})

describe('parseSpaceFinderSourceMeta', () => {
  test('reads titles, variant and run', () => {
    expect(
      parseSpaceFinderSourceMeta({
        areaTitle: 'Mitte',
        variantTitle: 'Standard',
        variantId: 5,
        runId: 9,
      }),
    ).toEqual({ areaTitle: 'Mitte', variantTitle: 'Standard', variantId: 5, runId: 9 })
  })

  test('returns null for anything that is not an object', () => {
    expect(parseSpaceFinderSourceMeta(null)).toBeNull()
    expect(parseSpaceFinderSourceMeta('x')).toBeNull()
    expect(parseSpaceFinderSourceMeta([1])).toBeNull()
  })
})
