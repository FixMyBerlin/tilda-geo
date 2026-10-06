import {
  GlobeAltIcon,
  MagnifyingGlassIcon,
  MinusIcon,
  PlusIcon,
  Square3Stack3DIcon,
} from '@heroicons/react/24/outline'
import { twJoin, twMerge } from 'tailwind-merge'
import { Spinner } from '@/components/shared/Spinner/Spinner'
import {
  mapOverlayBottomRightControlsClassName,
  mapOverlayControlSizeClassName,
  mapOverlayTopRightControlsClassName,
} from './mapOverlayChrome.const'
import {
  mapControlButtonGroupClassName,
  mapControlButtonGroupSegmentClassName,
  mapControlIconClassName,
  mobileControlButtonClassName,
} from './mobile/mobileControlButton.const'
import { mobileMapHeaderClassName } from './mobile/mobileMapChrome.const'

/** Skeleton map control — gray tile, faint icon, no elevation. */
const pendingControlClassName = twMerge(
  mobileControlButtonClassName,
  'pointer-events-none animate-pulse bg-gray-100 text-gray-400 shadow-none outline-none',
)

const pendingControlGroupClassName = twMerge(
  mapControlButtonGroupClassName,
  'pointer-events-none animate-pulse shadow-none',
)

const pendingZoomSegmentClassName = twMerge(
  pendingControlClassName,
  mapOverlayControlSizeClassName,
  mapControlButtonGroupSegmentClassName,
)

function PendingSearchButton() {
  return (
    <div className={twJoin(pendingControlClassName, mapOverlayControlSizeClassName)}>
      <MagnifyingGlassIcon className={mapControlIconClassName} aria-hidden="true" />
    </div>
  )
}

function PendingZoomButtons() {
  return (
    <div className={pendingControlGroupClassName}>
      <div className={twMerge(pendingZoomSegmentClassName, 'rounded-t-md')}>
        <PlusIcon className={mapControlIconClassName} aria-hidden="true" />
      </div>
      <div className={twMerge(pendingZoomSegmentClassName, 'rounded-b-md')}>
        <MinusIcon className={mapControlIconClassName} aria-hidden="true" />
      </div>
    </div>
  )
}

function PendingGlobeButton() {
  return (
    <div className={twJoin(pendingControlClassName, mapOverlayControlSizeClassName)}>
      <GlobeAltIcon className={mapControlIconClassName} aria-hidden="true" />
    </div>
  )
}

function PendingLayersButton() {
  return (
    <div className={twJoin(pendingControlClassName, 'size-13')}>
      <Square3Stack3DIcon className="size-8" strokeWidth={1.125} aria-hidden="true" />
    </div>
  )
}

export function RegionPagePendingMapShell() {
  return (
    <div className="relative flex h-full w-full flex-row gap-4">
      <div
        className="via-stone-200 to-stone-300/90 absolute inset-0 bg-linear-to-br from-emerald-50/50"
        aria-hidden="true"
      />

      {/* Desktop: collapsed categories button (same spot as SidebarLayerControls). */}
      <div
        className="absolute top-[var(--map-overlay-inset)] left-[var(--map-overlay-inset)] z-30 hidden sm:block"
        aria-hidden="true"
      >
        <PendingLayersButton />
      </div>

      {/* Mobile: search lives in the floating header, same as MobileMapHeader. */}
      <div
        className={twMerge(mobileMapHeaderClassName, 'justify-end sm:hidden')}
        aria-hidden="true"
      >
        <PendingSearchButton />
      </div>

      {/* Desktop: search above zoom ± — same column as MapInterface. */}
      <div
        className={twMerge(
          mapOverlayTopRightControlsClassName,
          'hidden *:pointer-events-none sm:flex',
        )}
        aria-hidden="true"
      >
        <PendingSearchButton />
        <PendingZoomButtons />
      </div>

      {/* Mobile: globe + layers, same bottom-right cluster as MapInterface. */}
      <div
        className={twMerge(
          mapOverlayBottomRightControlsClassName,
          '*:pointer-events-none sm:hidden',
        )}
        aria-hidden="true"
      >
        <PendingGlobeButton />
        <PendingLayersButton />
      </div>

      {/* Desktop: globe only (debug / download / notes are not always present). */}
      <div
        className={twMerge(
          mapOverlayBottomRightControlsClassName,
          'hidden *:pointer-events-none sm:flex',
        )}
        aria-hidden="true"
      >
        <PendingGlobeButton />
      </div>

      <div className="pointer-events-none absolute inset-0 z-5 flex flex-col items-center justify-center gap-4">
        <Spinner color="yellow" screenReaderLabel={false} size="12" />
        <p className="text-base text-gray-500">Karte wird geladen …</p>
      </div>
    </div>
  )
}
