import { ArrowUpIcon, MinusIcon, PlusIcon } from '@heroicons/react/24/outline'
import type React from 'react'
import { twMerge } from 'tailwind-merge'
import {
  mapControlButtonGroupClassName,
  mapControlButtonGroupSegmentClassName,
  mapControlIconClassName,
  mobileMapIconButtonClassName,
} from '../mobile/mobileControlButton.const'
import { compassNeedleTransform } from './compassNeedleTransform'
import { useMapNavigationCamera } from './useMapNavigationCamera'

const navButtonClassName = twMerge(
  mobileMapIconButtonClassName,
  mapControlButtonGroupSegmentClassName,
  'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white',
)

type Props = {
  showCompass?: boolean
}

export const MapNavigationButtons = ({ showCompass = false }: Props) => {
  const { map, camera } = useMapNavigationCamera()

  if (!map) return null

  const zoomInDisabled = camera.zoom === camera.maxZoom
  const zoomOutDisabled = camera.zoom === camera.minZoom

  const handleZoomIn = (event: React.MouseEvent<HTMLButtonElement>) => {
    map.zoomIn({}, { originalEvent: event.nativeEvent })
  }
  const handleZoomOut = (event: React.MouseEvent<HTMLButtonElement>) => {
    map.zoomOut({}, { originalEvent: event.nativeEvent })
  }
  const handleResetNorthPitch = (event: React.MouseEvent<HTMLButtonElement>) => {
    map.resetNorthPitch({}, { originalEvent: event.nativeEvent })
  }

  return (
    <div className={mapControlButtonGroupClassName}>
      <button
        type="button"
        className={twMerge(navButtonClassName, 'rounded-t-md')}
        title="Hineinzoomen"
        aria-label="Hineinzoomen"
        disabled={zoomInDisabled}
        onClick={handleZoomIn}
      >
        <PlusIcon className={mapControlIconClassName} aria-hidden="true" />
      </button>
      <button
        type="button"
        className={twMerge(navButtonClassName, !showCompass && 'rounded-b-md')}
        title="Herauszoomen"
        aria-label="Herauszoomen"
        disabled={zoomOutDisabled}
        onClick={handleZoomOut}
      >
        <MinusIcon className={mapControlIconClassName} aria-hidden="true" />
      </button>
      {showCompass && (
        <button
          type="button"
          className={twMerge(navButtonClassName, 'rounded-b-md')}
          title="Nach Norden ausrichten"
          aria-label="Nach Norden ausrichten"
          style={{ perspective: '120px' }}
          onClick={handleResetNorthPitch}
        >
          <ArrowUpIcon
            className={mapControlIconClassName}
            aria-hidden="true"
            style={{
              transform: compassNeedleTransform(camera.bearing, camera.pitch, camera.roll),
              transformOrigin: 'center',
            }}
          />
        </button>
      )}
    </div>
  )
}
