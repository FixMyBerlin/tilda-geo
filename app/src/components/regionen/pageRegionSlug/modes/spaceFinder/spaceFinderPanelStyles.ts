import { twJoin } from 'tailwind-merge'
import type { PlanningScoreMode } from '@/shared/regionen/planningScoreMode.const'

const spaceFinderToggleButtonBase =
  'rounded border px-2 py-1.5 text-xs font-medium transition-colors'
const spaceFinderToggleButtonInactive = 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'

/** Radio-artige Auswahlbuttons (eine Option aktiv). Farbe bleibt pro Kontext. */
export const spaceFinderRadioButtonClass = (active: boolean, accent: 'blue' | 'green' = 'blue') =>
  twJoin(
    spaceFinderToggleButtonBase,
    active
      ? accent === 'green'
        ? 'border-green-700 bg-green-50 text-green-700'
        : 'border-blue-600 bg-blue-50 text-blue-700'
      : spaceFinderToggleButtonInactive,
  )

/**
 * Auf-/zuklappbare Box (Faktoren, Wizard-Schritte). Eingeklappt sieht sie sonst genauso aus wie
 * die flachen Info-/Schalterzeilen des Panels und wird als klickbar übersehen — deshalb bekommt
 * sie zugeklappt einen gefüllten Kopf. Der Rahmen bleibt auch aufgeklappt kräftig genug, um auf
 * dem getönten Panel sichtbar zu sein und die Box zusammenzuhalten.
 */
export const spaceFinderDisclosureBoxClass = (open: boolean) =>
  twJoin('rounded border', open ? 'border-gray-300' : 'border-gray-300 hover:border-gray-400')

export const spaceFinderDisclosureHeaderClass = (open: boolean, twoLine = false) =>
  twJoin(
    'flex w-full cursor-pointer px-2.5 py-2 text-left text-sm font-semibold text-gray-800',
    twoLine ? 'flex-col gap-1.5' : 'items-center gap-2',
    open ? 'border-b border-gray-300 hover:bg-gray-50' : 'rounded bg-gray-100 hover:bg-gray-200',
  )

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
    spaceFinderToggleButtonBase,
    active
      ? mode === 'kombination'
        ? 'border-green-700 bg-green-50 text-green-700'
        : spaceFinderGroupStyle[mode].button
      : spaceFinderToggleButtonInactive,
  )

/** Kompakte Eingabefelder — eine Stufe kleiner als Panel-Fließtext (`text-sm`). */
const spaceFinderInputClass =
  'rounded border border-gray-300 p-[3px] text-xs leading-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400'

export const spaceFinderNumberInputClass = `${spaceFinderInputClass} w-14 text-right tabular-nums`

export const spaceFinderTextInputClass = `${spaceFinderInputClass} w-full`

/** Volle Panel-Breite, normale Schriftgröße — für Titel/Name-Felder im Assistenten. */
export const spaceFinderPanelTitleInputClass =
  'w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none'
