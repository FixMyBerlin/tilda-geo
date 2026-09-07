import { twMerge } from 'tailwind-merge'

/** Softer than card `rounded-lg` — floating chrome on the map (inspector, categories). */
const mapOverlayRadiusClassName = 'rounded'

/** Desktop category / layer-controls sheet. Fits subcategory dropdowns (`w-50` + `px-2`). */
export const mapOverlayLayerControlsWidthClassName = 'w-54'

/** Map-column cap for floating sheets: inset on top and bottom, height otherwise content-sized. */
export const mapOverlayMaxHeightClassName = 'max-h-[calc(100%-2*var(--map-overlay-inset))]'

/**
 * Shared elevation for floating map sheets / menus.
 */
const mapOverlayElevationClassName = 'shadow-md'

/**
 * Map control buttons and desktop region header — same spread as `shadow-md`, higher opacity.
 */
export const mapOverlayButtonElevationClassName =
  'shadow-[0_4px_6px_-1px_rgb(0_0_0/0.18),0_2px_4px_-2px_rgb(0_0_0/0.15)]'

/**
 * Hairline separating map chrome from the map — same outline slot as floating sheets
 * (Catalyst-style hairline at 15% opacity); `gray-950` is this app's remapped zinc ramp (see global.css).
 */
export const mapOverlayHairlineClassName = 'outline-1 outline-gray-950/15'

/**
 * White action controls (map overlay buttons, mode-header icons). Same grey as
 * `border-gray-300` form actions, as `outline` so the box size stays `size-8.5`.
 */
export const mapOverlayActionOutlineClassName = 'outline-1 outline-gray-300'

/**
 * Floating white sheet on the map (inspector, category panel).
 */
export const mapOverlaySheetClassName = twMerge(
  'bg-white',
  mapOverlayHairlineClassName,
  mapOverlayButtonElevationClassName,
  mapOverlayRadiusClassName,
)

/** Map-sitting menus / popovers (search results, background list, subcategory dropdown). */
export const mapOverlayMenuClassName = twMerge(
  'rounded-md bg-white',
  mapOverlayHairlineClassName,
  mapOverlayElevationClassName,
)

/**
 * Menus that open upward from bottom map chrome. Use with in-flow `absolute` (not a
 * viewport portal): `100%` max-height does not apply on a body portal.
 */
export const mapOverlayAnchoredMenuMaxHeightClassName = 'max-h-(--map-chrome-max-height)'

/**
 * Desktop `right` for top-right map chrome (search/zoom).
 * One 34px column (`w-8.5`) so overlay dots cannot widen the box and shift `right`.
 * `right` is inspector width + `--map-overlay-inset` (10px from the map edge), plus
 * another inset only while the inspector has width so zoom/search stay 10px off
 * the inspector. Absolute in MapInterface, so the mode panel does not need subtracting.
 * Bottom-right controls stay on the map edge (`z-10`) so the inspector (`z-20`) covers them.
 */
const mapOverlayInspectorAwareRightClassName =
  'right-[calc(var(--inspector-width)+var(--map-overlay-inset)+min(var(--inspector-width),var(--map-overlay-inset)))]'

/**
 * Open place-search / mode-filter search field: magnifier + input + X in one 40px bar.
 */
export const mapOverlaySearchFieldClassName = twMerge(
  'flex h-10 items-stretch overflow-hidden rounded-md bg-white',
  mapOverlayHairlineClassName,
  mapOverlayButtonElevationClassName,
)

/** Square map control (~15% smaller than the former 40px `size-10`). */
export const mapOverlayControlSizeClassName = 'size-8.5'

export const mapOverlayTopRightControlsClassName = twMerge(
  'pointer-events-none absolute top-(--map-overlay-inset) z-20 flex w-8.5 flex-col items-end gap-2 overflow-x-visible *:pointer-events-auto',
  mapOverlayInspectorAwareRightClassName,
)

export const mapOverlayBottomRightControlsClassName =
  'pointer-events-none z-10 flex items-end gap-2 *:pointer-events-auto max-sm:fixed max-sm:right-[calc(env(safe-area-inset-right)+0.5rem)] max-sm:bottom-[calc(env(safe-area-inset-bottom)+0.5rem)] sm:absolute sm:right-(--map-overlay-inset) sm:bottom-(--map-overlay-inset) sm:w-8.5 sm:flex-col sm:overflow-x-visible'

/** Separate buttons stacked with 8px `gap-2`. Zoom ± stays a glued group. */
export const mapOverlayControlStackClassName = 'flex w-8.5 flex-col items-end gap-2'
