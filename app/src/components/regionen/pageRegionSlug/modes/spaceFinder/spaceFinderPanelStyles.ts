import { twJoin } from 'tailwind-merge'
import {
  toggleButtonBase,
  toggleButtonInactive,
} from '@/components/shared/SegmentedChoice/radioButtonClass'
import type { SpaceFinderScoreMode } from '@/shared/regionen/spaceFinderScoreMode.const'

/**
 * Color of the factor groups. Only serves to tell the groups apart at a glance — share chip in
 * the collapsed factors header, block/heading in the open form, the same groups in the sidebar
 * (hexagon inspector) and the mode buttons (`ScoreModeSwitcher`).
 * The colors match the hexagon ramps on the map (`HEXAGON_SCORE_RAMP` in
 * `SourcesLayersSpaceFinder.tsx`): Bedarf blue, Bebauung pink, and Kombination purple as the mix
 * of both (`spaceFinderKombinationStyle`, not a factor group). `eigendaten` is orange, like the
 * map layer of the uploaded areas (`UserObstaclesLayer`) and its switch: away from blue, purple and
 * pink on the color wheel, so it does not read as Kombination or Bebauung. Warnings stay amber.
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
    chip: 'bg-pink-100 text-pink-800',
    block: 'border-pink-400 bg-pink-50/60',
    headline: 'border-pink-200',
    title: 'text-pink-900',
    text: 'text-pink-800',
    button: 'border-pink-600 bg-pink-50 text-pink-700',
  },
  eigendaten: {
    chip: 'bg-orange-100 text-orange-800',
    block: 'border-orange-400 bg-orange-50/60',
    headline: 'border-orange-200',
    title: 'text-orange-900',
    text: 'text-orange-800',
    button: 'border-orange-600 bg-orange-50 text-orange-700',
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
  bebauung: { full: 'bg-pink-600', pale: 'bg-pink-200' },
  eigendaten: { full: 'bg-orange-600', pale: 'bg-orange-200' },
}

/**
 * Color of Kombination (Gesamtscore): purple, the mix of Bedarf blue and Bebauung pink — same hue
 * as the Kombination hexagon ramp. `block` = left stripe of the Gesamtscore header in the inspector.
 */
export const spaceFinderKombinationStyle = {
  block: 'border-purple-400',
  title: 'text-purple-900',
  button: 'border-purple-600 bg-purple-50 text-purple-700',
}

/** Neutral tag: the mode of an »Eigene Daten« dataset and the suitability class (Eignungsklasse). */
export const spaceFinderTagClass =
  'shrink-0 rounded border border-gray-400 bg-white px-1.5 py-px text-[11px] font-semibold text-gray-800'

/** Toggle button in the group color (active) or neutral (inactive) — for `ScoreModeSwitcher`. */
export const spaceFinderGroupButtonClass = (active: boolean, mode: SpaceFinderScoreMode) =>
  twJoin(
    toggleButtonBase,
    active
      ? mode === 'kombination'
        ? spaceFinderKombinationStyle.button
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
