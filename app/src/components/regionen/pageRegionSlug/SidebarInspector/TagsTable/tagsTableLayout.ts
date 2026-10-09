export const tagsTableContainerClass = '@container w-full min-w-0'

/** Overrides `text-sm` default line-height so all inspector table text aligns. */
export const tagsTableLeadingClass = 'leading-4'

/** `table-auto` (not fixed): label shrinks to content, value takes remaining width. */
export const tagsTableClass = `block w-full @[350px]:table ${tagsTableLeadingClass}`

export const tagsTableBodyClass =
  'block divide-y divide-gray-200 border-b border-gray-200 @[350px]:table-row-group'

/**
 * Vertical padding of label/value lives on the cell classes below, not here: descendant
 * selectors on the row outrank the `@[350px]` reset and left label and value 4px apart.
 */
export const tagsTableRowClass = 'group block @[350px]:table-row [&>td]:px-2 [&>td:only-child]:py-2'

/** `w-px` = shrink-to-fit label column; value cell grows via `w-full`. Width comes from `tagsTableLabelContentClass`. */
export const tagsTableLabelCellClass = `block w-full min-w-0 pt-2 pb-1 text-sm ${tagsTableLeadingClass} font-medium wrap-anywhere @[350px]:table-cell @[350px]:py-2 @[350px]:w-px @[350px]:align-top @[350px]:pr-2 @[350px]:pl-2`

/**
 * Wraps the label inside its cell: short labels stay on one line (`w-max`), long ones wrap at 45 % of the
 * inspector width so the value column keeps its room. `max-width` on the `td` itself is ignored by table layout.
 * Raw keys in `code` break without a hyphen, which would read as part of the key.
 */
export const tagsTableLabelContentClass =
  'block hyphens-auto [&_code]:hyphens-none @[350px]:w-max @[350px]:max-w-[45cqi]'

export const tagsTableValueCellClass = `block w-full min-w-0 pt-1 pb-2 text-sm ${tagsTableLeadingClass} wrap-anywhere @[350px]:table-cell @[350px]:py-2 @[350px]:w-full @[350px]:align-top @[350px]:px-2`

/** Nested container so sub-rows react to the value-cell width, not the full inspector. */
export const tagsTableCompositTableClass = `@container w-full min-w-0 ${tagsTableLeadingClass}`

export const tagsTableCompositRowClass =
  'border-t border-gray-200 py-2 first:border-t-0 first:pt-0 last:pb-0'

/**
 * Nested composit rows (surface/smoothness, bikelanes, …).
 * Stack label above value when the value cell is narrow; side-by-side once there is room for both cols.
 */
export const tagsTableCompositSubLabelCellClass = `w-full min-w-0 text-left align-top ${tagsTableLeadingClass} font-medium wrap-anywhere @[280px]:w-28 @[280px]:min-w-28 @[280px]:shrink-0 @[280px]:pr-1.5 @[280px]:whitespace-nowrap`

export const tagsTableCompositSubValueCellClass = `w-full min-w-0 ${tagsTableLeadingClass} break-words @[280px]:flex-1`

/** Header row for a composit sub-entry; disclosure body sits below and spans full width. */
export const tagsTableCompositSubRowHeaderClass =
  'flex flex-col items-stretch gap-y-1 @[280px]:flex-row @[280px]:items-start'
