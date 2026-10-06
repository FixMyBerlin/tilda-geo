/**
 * Shared inset for floating map chrome on mobile (header).
 * `0.5rem` matches Tailwind `p-2` / `gap-2` used in the top header clusters.
 */
export const mobileMapHeaderClassName =
  'pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-2 p-2 pt-[calc(env(safe-area-inset-top)+0.5rem)] pr-[calc(env(safe-area-inset-right)+0.5rem)] pl-[calc(env(safe-area-inset-left)+0.5rem)] [&_a]:pointer-events-auto [&_button]:pointer-events-auto'
