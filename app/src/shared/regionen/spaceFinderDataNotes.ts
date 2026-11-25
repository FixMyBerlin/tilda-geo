import { z } from 'zod'

/**
 * Run-level notes of the worker (`SpaceFinderRun.dataNotes`): which factor could not be computed
 * as asked, and why. `reason` is a machine key; the worker may add new ones at any time, so
 * unknown reasons fall back to a generic text.
 */
const SpaceFinderDataNotesSchema = z.array(z.object({ factor: z.string(), reason: z.string() }))
export type SpaceFinderDataNote = z.infer<typeof SpaceFinderDataNotesSchema>[number]

const DATA_NOTE_TEXTS: Record<string, string> = {
  'versiegelung:tabelle_fehlt':
    'Versiegelung nicht berechnet: Die OSM-Daten dazu fehlen auf diesem Server (Processing nötig).',
  'versiegelung:abfrage_fehlgeschlagen':
    'Versiegelung nicht berechnet: Die OSM-Daten dazu konnten nicht gelesen werden.',
  'vegetation:luftbild_fehlgeschlagen':
    'Vegetation ohne Luftbild: Die Luftbilder konnten nicht geladen werden.',
  'vegetation:keine_luftbildquelle':
    'Vegetation ohne Luftbild: Für dieses Gebiet gibt es keine Luftbildquelle.',
}

/**
 * Data sources the worker's PostGIS loader notes when it cannot read them
 * (`_DATA_SOURCES` in space-finder-worker/scoring/postgis_loader.py; keep both in sync).
 */
const DATA_SOURCE_LABELS: Record<string, string> = {
  gebaeude: 'Gebäude',
  eingaenge: 'Eingänge',
  radwege: 'Radwege',
  oepnv: 'ÖPNV-Haltestellen',
  plaetze: 'Plätze',
  fahrradparken: 'Fahrradparken',
  kreuzungen: 'Kreuzungsecken',
  strassen: 'Straßen',
  kfz_parken: 'Kfz-Parken',
  zensus: 'Zensus-Einwohnerdaten',
  zielorte: 'Zielorte',
}

const DATA_LOAD_REASON_TEXTS: Record<string, string> = {
  tabelle_fehlt: 'Die Daten fehlen auf diesem Server.',
  abfrage_fehlgeschlagen: 'Die Daten konnten nicht gelesen werden.',
}

/** Whether the worker could not read a data source: the run went on without it. */
export const isDataLoadNote = ({ reason }: SpaceFinderDataNote) => reason in DATA_LOAD_REASON_TEXTS

/** German text for one note, with a fallback for factor/reason pairs this app does not know yet. */
export const spaceFinderDataNoteText = (note: SpaceFinderDataNote) => {
  const { factor, reason } = note
  const known = DATA_NOTE_TEXTS[`${factor}:${reason}`]
  if (known) return known
  if (isDataLoadNote(note)) {
    return `Ohne ${DATA_SOURCE_LABELS[factor] ?? factor} berechnet: ${DATA_LOAD_REASON_TEXTS[reason]}`
  }
  return `Hinweis zur Berechnung (${factor}): ${reason.replaceAll('_', ' ')}`
}

/** Reads the stored JSON; anything that is not a list of notes (old runs: null) yields no notes. */
export const parseSpaceFinderDataNotes = (value: unknown): SpaceFinderDataNote[] => {
  const parsed = SpaceFinderDataNotesSchema.safeParse(value)
  return parsed.success ? parsed.data : []
}
