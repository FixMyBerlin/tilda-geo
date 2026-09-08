import { twJoin, twMerge } from 'tailwind-merge'
import {
  mapOverlayActionOutlineClassName,
  mapOverlayControlSizeClassName,
} from '../mapOverlayChrome.const'
import { modeAccentTintClassName } from './modeIdentity'

/**
 * Shared Tailwind classes for the mode sidebar (`ModePanel`). Body uses the mode accent wash;
 * the inverted header is painted separately. Separation from the map / inspector is the outline
 * hairline + left shadow on `ModeColumnShell` (not a layout `border-l`).
 *
 * Shadow stack (desktop region layout): header (`z-40 shadow-md`) → mode column (`z-30`) →
 * inspector (`z-20`) → map.
 */
export const modePanelClassName = twJoin(
  'relative flex h-full w-full shrink-0 flex-col overflow-y-hidden text-gray-900',
  modeAccentTintClassName,
)

/**
 * Mode column casts onto the map/inspector to the left — same strength as button `shadow-md`,
 * but horizontal (`-4px` / `-2px` instead of downward `4px` / `2px`).
 */
export const modeColumnElevationClassName =
  'shadow-[-4px_0_6px_-1px_rgb(0_0_0/0.1),-2px_0_4px_-2px_rgb(0_0_0/0.1)]'

export const modePanelCollectionClassName = 'border-t border-white/60 px-4 py-2'

export const modePanelSectionClassName = 'border-b border-gray-200 px-4 py-2'

export const modePanelFooterClassName = 'border-t border-gray-200 px-4 py-2 text-xs text-gray-500'

export const modePanelTitleClassName = 'text-sm font-semibold text-gray-900'

/** Inverted header row (list, collection trigger, detail). 50px matches Prüflisten (`py-2` + `size-8.5`). */
export const modePanelHeaderBarClassName = 'flex min-h-12.5 min-w-0 items-center gap-2 px-4 py-2'

/** List-header actions sit beside the disclosure trigger; same height as the title row. */
export const modePanelListHeaderActionsClassName =
  'flex min-h-12.5 shrink-0 items-center gap-2 py-2 pr-4 pl-3'

/**
 * Detail-header back control: full header height (flush, no margin), right border as separator.
 */
export const modePanelBackButtonClassName =
  'inline-flex shrink-0 items-center justify-center border-r border-current/30 px-3 text-inherit transition-colors hover:bg-white/15 focus:outline-none focus-visible:bg-white/15 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-inset'

export const modePanelScrollClassName = '@container grow overflow-y-auto'

export const modePanelMutedClassName = 'text-sm text-gray-500'

/** Primary header action (Hinweise: Neuer Hinweis). Same height as square header icons. */
export const modePanelPrimaryButtonClassName = twMerge(
  'inline-flex h-8.5 items-center gap-1 rounded-md bg-white px-2 text-xs font-medium text-gray-900 shadow-sm hover:bg-yellow-50 focus:ring-2 focus:ring-white focus:outline-none disabled:cursor-not-allowed disabled:opacity-40',
  mapOverlayActionOutlineClassName,
)

/** Square header icon (Prüflisten: Neu / ⋯ / Löschen). Same size and edge as map overlay buttons. */
export const modePanelHeaderIconButtonClassName = twMerge(
  'inline-flex shrink-0 items-center justify-center rounded-md bg-white text-gray-900 shadow-sm hover:bg-yellow-50 focus:ring-2 focus:ring-white focus:outline-none disabled:cursor-not-allowed disabled:opacity-40',
  mapOverlayControlSizeClassName,
  mapOverlayActionOutlineClassName,
)

/** Small secondary action buttons in collection selectors (create/rename/delete). */
export const modePanelSmallButtonClassName =
  'rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-brand focus:outline-none disabled:cursor-not-allowed disabled:opacity-40'

/** Filter-bar controls (search icon, Status/Ausschnitt Listbox). */
export const modePanelFilterControlClassName =
  'inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-brand focus:outline-none'

export const modePanelListItemBorderClassName = 'border-b border-gray-200'

export const modePanelListItemActiveClassName = 'bg-yellow-50'

export const modePanelListItemHoverClassName = 'hover:bg-gray-50'

export const modePanelListTitleClassName = 'font-medium text-gray-900'

export const modePanelListMetaClassName = 'text-xs text-gray-500'

export const modePanelListBodyClassName = 'text-xs text-gray-600'

export const modePanelListHintClassName = 'text-[11px] text-gray-400'

export const modePanelBadgeClassName =
  'shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600'
