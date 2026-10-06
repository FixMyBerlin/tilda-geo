import { twJoin } from 'tailwind-merge'
import {
  toggleButtonBase,
  toggleButtonInactive,
} from '@/components/shared/SegmentedChoice/radioButtonClass'
import type { PlanningScoreMode } from '@/shared/regionen/planningScoreMode.const'

/**
 * Farbe der Faktorgruppen. Dient nur dazu, die Gruppen auf einen Blick auseinanderzuhalten —
 * Anteil-Chip im zugeklappten Faktoren-Kopf, Block/Überschrift im geöffneten Formular, dieselben
 * Gruppen in der Sidebar (Hexagon-Inspector) und die Modus-Buttons (`ScoreModeSwitcher`).
 * Kombination hat bewusst keine eigene Farbe (bleibt neutral/grün) — sie ist keine Faktorgruppe,
 * sondern das gemeinsame Ergebnis. `eigendaten` ist Amber: auf dem Farbkreis der größte Abstand zu
 * Blau (bedarf, ~221°) und Lila (bebauung, ~271°) — Violett (~258°) läge dazwischen und wäre kaum
 * unterscheidbar. Bewusst in Kauf genommen: der Kartenlayer der hochgeladenen Flächen
 * (`UserObstaclesLayer` in `SourcesLayersSpaceFinder.tsx`) bleibt Violett (`#7c3aed`) und der
 * Fahrbahnen-Ausschluss-Layer ist ebenfalls Amber (`carriageways.py`/`SourcesLayersSpaceFinder.tsx`,
 * anderer Layer, andere Bedeutung) — beides Farbüberschneidungen mit anderen Kartenlayern, aber
 * keine mit den beiden übrigen Faktorgruppen. Die übrigen Farben selbst haben keine eigene
 * Bedeutung und sind bewusst nicht die der Kartenlayer.
 *
 * `chip` = farbiger Wert-Chip, `block` = linker Streifen + Tönung eines Gruppenblocks,
 * `headline` = Überschrift mit Unterstrich, `text` = nur die Textfarbe, `button` = aktiver
 * Zustand eines Toggle-Buttons (siehe `spaceFinderGroupButtonClass`).
 */
export const spaceFinderGroupStyle: Record<
  'bedarf' | 'bebauung' | 'eigendaten',
  { chip: string; block: string; headline: string; text: string; button: string }
> = {
  bedarf: {
    chip: 'bg-blue-100 text-blue-800',
    block: 'border-blue-400 bg-blue-50/60',
    headline: 'border-blue-200 text-blue-900',
    text: 'text-blue-800',
    button: 'border-blue-600 bg-blue-50 text-blue-700',
  },
  bebauung: {
    chip: 'bg-purple-100 text-purple-800',
    block: 'border-purple-400 bg-purple-50/60',
    headline: 'border-purple-200 text-purple-900',
    text: 'text-purple-800',
    button: 'border-purple-600 bg-purple-50 text-purple-700',
  },
  eigendaten: {
    chip: 'bg-amber-100 text-amber-800',
    block: 'border-amber-400 bg-amber-50/60',
    headline: 'border-amber-200 text-amber-900',
    text: 'text-amber-800',
    button: 'border-amber-600 bg-amber-50 text-amber-700',
  },
}

/**
 * Balkenfarben der Faktor-Zeilen im Hexagon-Inspector (`InspectorFeatureSpaceFinderHexagon`), in der
 * Gruppenfarbe aus `spaceFinderGroupStyle` statt einer von der Gruppe unabhängigen Farbcodierung.
 * `full` = Kriterien-Balken sowie Zuschläge, `pale` = Abschläge (Vorzeichen bleibt so über die
 * Sättigung erkennbar, ohne die Gruppenzuordnung zu verlassen).
 */
export const spaceFinderGroupBarStyle: Record<
  'bedarf' | 'bebauung' | 'eigendaten',
  { full: string; pale: string }
> = {
  bedarf: { full: 'bg-blue-600', pale: 'bg-blue-200' },
  bebauung: { full: 'bg-purple-600', pale: 'bg-purple-200' },
  eigendaten: { full: 'bg-amber-600', pale: 'bg-amber-200' },
}

/**
 * Toggle-Button in der Gruppenfarbe (aktiv) bzw. neutral (inaktiv) — für `ScoreModeSwitcher`.
 * Kombination hat keine Gruppenfarbe und fällt auf den ursprünglichen Grün-Akzent zurück.
 */
export const spaceFinderGroupButtonClass = (active: boolean, mode: PlanningScoreMode) =>
  twJoin(
    toggleButtonBase,
    active
      ? mode === 'kombination'
        ? 'border-green-700 bg-green-50 text-green-700'
        : spaceFinderGroupStyle[mode].button
      : toggleButtonInactive,
  )

/** Kompakte Eingabefelder — eine Stufe kleiner als Panel-Fließtext (`text-sm`). */
const spaceFinderInputClass =
  'rounded border border-gray-300 p-[3px] text-xs leading-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400'

export const spaceFinderNumberInputClass = `${spaceFinderInputClass} w-14 text-right tabular-nums`

export const spaceFinderTextInputClass = `${spaceFinderInputClass} w-full`

/** Volle Panel-Breite, normale Schriftgröße — für Titel/Name-Felder im Assistenten. */
export const spaceFinderPanelTitleInputClass =
  'w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none'
