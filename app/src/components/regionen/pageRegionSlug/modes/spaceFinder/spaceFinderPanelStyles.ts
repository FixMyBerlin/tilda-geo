import { twJoin } from 'tailwind-merge'
import {
  toggleButtonBase,
  toggleButtonInactive,
} from '@/components/shared/SegmentedChoice/radioButtonClass'
import type { PlanningScoreMode } from '@/shared/regionen/planningScoreMode.const'

/**
 * Color of the factor groups. Only serves to tell the groups apart at a glance — share chip in
 * the collapsed factors header, block/heading in the open form, the same groups in the sidebar
 * (hexagon inspector) and the mode buttons (`ScoreModeSwitcher`).
 * Kombination deliberately has no color of its own (stays neutral/green) — it is not a factor
 * group but the combined result. `eigendaten` is amber: on the color wheel the furthest from
 * blue (bedarf, ~221°) and purple (bebauung, ~271°) — violet (~258°) would sit in between and be
 * hard to tell apart. Accepted on purpose: the map layer of the uploaded areas
 * (`UserObstaclesLayer` in `SourcesLayersSpaceFinder.tsx`) stays violet (`#7c3aed`) and the
 * carriageway exclusion layer is amber too (`carriageways.py`/`SourcesLayersSpaceFinder.tsx`,
 * different layer, different meaning) — both overlap in color with other map layers, but not
 * with the two other factor groups. The colors carry no meaning of their own and are
 * deliberately not those of the map layers.
 *
 * `chip` = colored value chip, `block` = left stripe + tint of a group block,
 * `headline` = underline color of the heading, `title` = heading text color (size/weight:
 * `spaceFinderGroupHeadingClass`), `text` = text color only, `button` = active state of a
 * toggle button (see `spaceFinderGroupButtonClass`).
 */
export const spaceFinderGroupStyle: Record<
  'bedarf' | 'bebauung' | 'eigendaten',
  { chip: string; block: string; headline: string; title: string; text: string; button: string }
> = {
  bedarf: {
    chip: 'bg-blue-100 text-blue-800',
    block: 'border-blue-400 bg-blue-50/60',
    headline: 'border-blue-200',
    title: 'text-blue-900',
    text: 'text-blue-800',
    button: 'border-blue-600 bg-blue-50 text-blue-700',
  },
  bebauung: {
    chip: 'bg-purple-100 text-purple-800',
    block: 'border-purple-400 bg-purple-50/60',
    headline: 'border-purple-200',
    title: 'text-purple-900',
    text: 'text-purple-800',
    button: 'border-purple-600 bg-purple-50 text-purple-700',
  },
  eigendaten: {
    chip: 'bg-amber-100 text-amber-800',
    block: 'border-amber-400 bg-amber-50/60',
    headline: 'border-amber-200',
    title: 'text-amber-900',
    text: 'text-amber-800',
    button: 'border-amber-600 bg-amber-50 text-amber-700',
  },
}

/**
 * Bar colors of the factor rows in the hexagon inspector (`InspectorFeatureSpaceFinderHexagon`), in
 * the group color from `spaceFinderGroupStyle` instead of a group-independent color coding.
 * `full` = criteria bars and bonuses, `pale` = penalties (the sign stays recognizable via
 * saturation without leaving the group color).
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
 * Toggle button in the group color (active) or neutral (inactive) — for `ScoreModeSwitcher`.
 * Kombination has no group color and falls back to the original green accent.
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

/** Compact input fields — one step smaller than panel body text (`text-sm`). */
const spaceFinderInputClass =
  'rounded border border-gray-300 p-[3px] text-xs leading-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400'

export const spaceFinderNumberInputClass = `${spaceFinderInputClass} w-14 text-right tabular-nums`

export const spaceFinderTextInputClass = `${spaceFinderInputClass} w-full`

/** Row of discard links (»Gebiet verwerfen«, »Änderungen verwerfen«, »Auswahl leeren«), centered. */
export const spaceFinderDiscardRowClass = 'flex flex-wrap justify-center gap-x-3 gap-y-1'

/** A small text link that throws something away. */
export const spaceFinderDiscardLinkClass = 'text-xs text-gray-500 underline hover:text-gray-700'

/**
 * Text of a factor that counts in the score (weight > 0) — one step darker than the surrounding
 * panel text so active factors stand out from disabled ones. Shared by the factor editor and the
 * hexagon inspector.
 */
export const spaceFinderFactorActiveTextClass = 'text-gray-900'

/**
 * Label and value of a disabled factor (weight 0) — one gray, no extra opacity, so the factor
 * editor and the hexagon inspector look the same.
 */
export const spaceFinderFactorMutedTextClass = 'text-gray-400'

/** Empty ("–") and zero values of an active factor in the hexagon inspector. */
export const spaceFinderFactorEmptyValueClass = 'text-gray-300'

/**
 * Secondary text of a factor: the configured reach in the hexagon inspector ("Radius 15 m",
 * "bis 50 m") and the matching parameter label in the factor editor ("Radius (m)").
 */
export const spaceFinderFactorHintClass = 'text-[10px] text-gray-500'

/** `spaceFinderFactorHintClass` of a disabled parameter: the hint size with the muted gray. */
export const spaceFinderParamLabelMutedClass = `text-[10px] ${spaceFinderFactorMutedTextClass}`

/** Size and weight of the group headings (Bedarf, Bebauung, Eigene Daten); the color is `spaceFinderGroupStyle[…].title`. */
export const spaceFinderGroupHeadingClass = 'text-sm font-bold'

/**
 * Quiet label of a sub-group inside a group block ("Kriterien", "Zu- und Abschläge"). It names the
 * rows below it, it does not compete with the group heading above.
 */
export const spaceFinderFactorGroupLabelClass = 'text-xs font-medium text-gray-500'

/**
 * Wrapper of the rows of one sub-group: a thin vertical rule on the left groups them as one block
 * (instead of horizontal lines between the rows). Shared by the factor editor and the hexagon
 * inspector.
 */
export const spaceFinderFactorGroupRowsClass = 'mt-0.5 ml-0.5 border-l-2 border-gray-200 pl-3'
