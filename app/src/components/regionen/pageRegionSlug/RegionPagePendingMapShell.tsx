import 'maplibre-gl/dist/maplibre-gl.css'
import { useParams } from '@tanstack/react-router'
import { twJoin } from 'tailwind-merge'
import invariant from 'tiny-invariant'
import { Spinner } from '@/components/shared/Spinner/Spinner'
import { isProd } from '@/components/shared/utils/isEnv'
import { staticRegion } from '@/data/regions.const'
import { mobileControlButtonClassName } from './mobile/mobileControlButton.const'
import {
  mobileMapHeaderClassName,
  pendingMapBottomControlsClassName,
} from './mobile/mobileMapChrome.const'

const pulseButton = twJoin(
  mobileControlButtonClassName,
  'pointer-events-none animate-pulse bg-white/80',
)

type Props = {
  previewRegionSlug?: string
}

function usePendingShellStaticRegion(previewRegionSlug?: string) {
  const params = useParams({ strict: false })
  const regionSlug = previewRegionSlug ?? params?.regionSlug
  invariant(regionSlug, 'RegionPagePendingMapShell requires a region slug')
  const resultRegion = staticRegion.find((data) => data.slug === regionSlug)
  invariant(resultRegion, `Static region not found: ${regionSlug}`)
  return resultRegion
}

export function RegionPagePendingMapShell({ previewRegionSlug }: Props = {}) {
  const staticRegion = usePendingShellStaticRegion(previewRegionSlug)
  const showDebugPlaceholder = !isProd
  const showSearchPlaceholder = staticRegion.showSearch === true

  return (
    <div className="relative flex h-full w-full flex-row gap-4">
      <div
        className="via-stone-200 to-stone-300/90 absolute inset-0 bg-linear-to-br from-emerald-50/50"
        aria-hidden="true"
      />

      {/* Desktop sidebar placeholder (mobile uses the floating buttons below) */}
      <section
        className="absolute top-0 left-0 z-20 hidden max-h-full w-65 bg-white py-px shadow-md sm:block"
        aria-hidden="true"
      />

      {/* Mobile floating-button skeleton, mirroring MobileMapHeader's layout */}
      <div className={twJoin(mobileMapHeaderClassName, 'sm:hidden')} aria-hidden="true">
        <div className="flex items-start gap-2">
          <div className={twJoin(pulseButton, 'h-10 w-12 min-w-10')} />
          <div className={twJoin(pulseButton, 'size-10')} />
          <div className={twJoin(pulseButton, 'size-10')} />
        </div>
        {(showDebugPlaceholder || showSearchPlaceholder) && (
          <div className="flex items-start gap-2">
            {showDebugPlaceholder && <div className={twJoin(pulseButton, 'size-10')} />}
            {showSearchPlaceholder && <div className={twJoin(pulseButton, 'size-10')} />}
          </div>
        )}
      </div>

      {/* Desktop zoom controls placeholder (hidden on mobile, matching the live map) */}
      <div
        className="maplibregl-ctrl pointer-events-none absolute top-2 right-2.5 z-10 hidden sm:block"
        aria-hidden="true"
      >
        <div className="maplibregl-ctrl-group">
          <button
            type="button"
            disabled
            tabIndex={-1}
            className="maplibregl-ctrl-zoom-in"
            aria-hidden="true"
          />
          <button
            type="button"
            disabled
            tabIndex={-1}
            className="maplibregl-ctrl-zoom-out"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Bottom controls skeleton — one cluster like MapInterface (mobile + desktop) */}
      <div className={pendingMapBottomControlsClassName} aria-hidden="true">
        <div className={twJoin(pulseButton, 'size-10')} />
        <div className={twJoin(pulseButton, 'size-10')} />
        <div className={twJoin(pulseButton, 'size-10')} />
        <div className={twJoin(pulseButton, 'size-10', 'hidden sm:block')} />
        <div className={twJoin(pulseButton, 'size-13 sm:size-10')} />
        {showDebugPlaceholder && (
          <div className={twJoin(pulseButton, 'size-10', 'hidden sm:block')} />
        )}
      </div>

      <div className="pointer-events-none absolute inset-0 z-5 flex flex-col items-center justify-center gap-4">
        <Spinner color="yellow" screenReaderLabel={false} size="12" />
        <p className="text-base text-gray-500">Karte wird geladen …</p>
      </div>
    </div>
  )
}
