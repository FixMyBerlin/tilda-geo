/**
 * Shared inset for floating map chrome on mobile (header + bottom controls).
 * `0.5rem` matches Tailwind `p-2` / `gap-2` used in the top header clusters.
 */
export const mobileMapHeaderClassName =
  'pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-2 p-2 pt-[calc(env(safe-area-inset-top)+0.5rem)] pr-[calc(env(safe-area-inset-right)+0.5rem)] pl-[calc(env(safe-area-inset-left)+0.5rem)] [&_a]:pointer-events-auto [&_button]:pointer-events-auto'

/**
 * Bottom-right control cluster. Mobile insets below `max-sm`; from `sm` up, `right` tracks
 * `--inspector-width` (resizable desktop inspector). `data-map-controls` in global.css mirrors
 * the same offset for MapLibre corner controls.
 */
export const mobileMapBottomControlsClassName =
  'pointer-events-none fixed left-auto z-10 flex max-w-full flex-wrap items-end justify-end gap-2 *:pointer-events-auto max-sm:right-[calc(env(safe-area-inset-right)+0.5rem)] max-sm:bottom-[calc(env(safe-area-inset-bottom)+0.5rem)] sm:right-[calc(var(--inspector-width)+var(--map-controls-inset))] sm:bottom-4'
