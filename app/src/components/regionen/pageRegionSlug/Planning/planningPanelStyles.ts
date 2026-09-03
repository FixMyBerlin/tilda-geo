import { twJoin } from 'tailwind-merge'
import type { PlanningScoreMode } from '@/shared/regionen/planningScoreMode.const'

/** Planungspanel-Breite (etwas über Standard-`w-80`). */
export const PLANNING_PANEL_WIDTH = 'w-[22rem]'

const planningToggleButtonBase = 'rounded border px-2 py-1.5 text-xs font-medium transition-colors'
const planningToggleButtonInactive = 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'

/** Radio-artige Auswahlbuttons (eine Option aktiv). Farbe bleibt pro Kontext. */
export const planningRadioButtonClass = (active: boolean, accent: 'blue' | 'green' = 'blue') =>
  twJoin(
    planningToggleButtonBase,
    active
      ? accent === 'green'
        ? 'border-green-700 bg-green-50 text-green-700'
        : 'border-blue-600 bg-blue-50 text-blue-700'
      : planningToggleButtonInactive,
  )

/**
 * Auf-/zuklappbare Box (Faktoren, Wizard-Schritte). Eingeklappt sieht sie sonst genauso aus wie
 * die flachen Info-/Schalterzeilen des Panels und wird als klickbar übersehen — deshalb bekommt
 * sie zugeklappt einen gefüllten Kopf und einen kräftigeren Rahmen.
 */
export const planningDisclosureBoxClass = (open: boolean) =>
  twJoin('rounded border', open ? 'border-gray-200' : 'border-gray-300 hover:border-gray-400')

export const planningDisclosureHeaderClass = (open: boolean, twoLine = false) =>
  twJoin(
    'flex w-full cursor-pointer px-2.5 py-2 text-left text-sm font-semibold text-gray-800',
    twoLine ? 'flex-col gap-1.5' : 'items-center gap-2',
    open ? 'border-b border-gray-200 hover:bg-gray-50' : 'rounded bg-gray-100 hover:bg-gray-200',
  )

/**
 * Farbe der beiden Faktorgruppen. Dient nur dazu, die Gruppen auf einen Blick auseinanderzuhalten
 * — Anteil-Chip im zugeklappten Faktoren-Kopf, Block/Überschrift im geöffneten Formular, dieselben
 * Gruppen in der Sidebar (Hexagon-Inspector) und die Modus-Buttons (`ScoreModeSwitcher`).
 * Kombination hat bewusst keine eigene Farbe (bleibt neutral/grün) — sie ist keine Faktorgruppe,
 * sondern das gemeinsame Ergebnis. Die Farben selbst haben keine eigene Bedeutung und sind bewusst
 * nicht die der Kartenlayer.
 *
 * `chip` = farbiger Wert-Chip, `block` = linker Streifen + Tönung eines Gruppenblocks,
 * `headline` = Überschrift mit Unterstrich, `text` = nur die Textfarbe, `button` = aktiver
 * Zustand eines Toggle-Buttons (siehe `planningGroupButtonClass`).
 */
export const planningGroupStyle: Record<
  'bedarf' | 'bebauung',
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
}

/**
 * Toggle-Button in der Gruppenfarbe (aktiv) bzw. neutral (inaktiv) — für `ScoreModeSwitcher`.
 * Kombination hat keine Gruppenfarbe und fällt auf den ursprünglichen Grün-Akzent zurück.
 */
export const planningGroupButtonClass = (active: boolean, mode: PlanningScoreMode) =>
  twJoin(
    planningToggleButtonBase,
    active
      ? mode === 'kombination'
        ? 'border-green-700 bg-green-50 text-green-700'
        : planningGroupStyle[mode].button
      : planningToggleButtonInactive,
  )

/** Kompakte Eingabefelder — eine Stufe kleiner als Panel-Fließtext (`text-sm`). */
const planningInputClass =
  'rounded border border-gray-300 p-[3px] text-xs leading-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400'

export const planningNumberInputClass = `${planningInputClass} w-14 text-right tabular-nums`

export const planningTextInputClass = `${planningInputClass} w-full`

/** Volle Panel-Breite, normale Schriftgröße — für Titel/Name-Felder im Assistenten. */
export const planningPanelTitleInputClass =
  'w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none'
