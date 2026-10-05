import { LockClosedIcon } from '@heroicons/react/16/solid'
import { AdjustmentsHorizontalIcon } from '@heroicons/react/20/solid'
import { getLocationOpenersAt, providerById } from '@osm-editor-kit/street-imagery'
import {
  useArmedLocationOpenerId,
  useLocationPickActions,
} from '@osm-editor-kit/street-imagery-react'
import { useState } from 'react'
import { twJoin, twMerge } from 'tailwind-merge'
import { useMapParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useMapParam'
import { MotionCollapse } from '@/components/shared/motion/MotionCollapse'
import { Tooltip } from '@/components/shared/Tooltip/Tooltip'
import {
  mapControlButtonGroupSegmentClassName,
  mobileControlButtonClassName,
} from '../../mobile/mobileControlButton.const'
import { streetImageryOpenerIds } from '../../streetImagery/streetImageryOpeners'
import { streetImageryProviderIds } from '../../streetImagery/streetImageryParam'
import { useStreetImageryParam } from '../../streetImagery/useStreetImageryParam'
import { categoryHeaderTitleBoxClassName } from '../categoryHeader.const'
import { StreetImageryLogo } from './StreetImageryLogos'
import { StreetImagerySettings } from './StreetImagerySettings'

const SETTINGS_ID = 'street-imagery-settings'

// One connected group, as the map's zoom buttons: hairlines overlap, radius only at the ends.
const segmentClassName = (pressed: boolean) =>
  twMerge(
    mobileControlButtonClassName,
    mapControlButtonGroupSegmentClassName,
    'relative h-8.5 w-full cursor-pointer group-first/segment:rounded-l-md group-last/segment:rounded-r-md',
    pressed && 'z-10 bg-yellow-400 text-gray-950 hover:bg-yellow-400',
  )

/**
 * Street-level photos: not a category. One row of buttons, each with a pressed state: the
 * providers show their photos on the map, the other services open a place the user then clicks
 * on the map (`<StreetImageryPickOverlay>`). Style and date filter are behind the settings button.
 */
export const StreetImageryControls = () => {
  const { providers, toggleProvider } = useStreetImageryParam()
  const { mapParam } = useMapParam()
  const armedOpenerId = useArmedLocationOpenerId()
  const { toggle: toggleOpener } = useLocationPickActions()
  const [settingsOpen, setSettingsOpen] = useState(false)
  // Services without imagery at the map's centre (infra3D outside of Berlin) are left out.
  const openers = getLocationOpenersAt([mapParam.lng, mapParam.lat]).filter((opener) =>
    streetImageryOpenerIds.includes(opener.id),
  )
  const active = providers.length > 0

  return (
    <section className="@container relative z-0 border-t border-t-gray-200 bg-gray-50">
      <header className="flex min-w-0 items-stretch justify-between">
        <div
          className={twJoin(
            categoryHeaderTitleBoxClassName,
            'flex-1 justify-center',
            active ? 'text-gray-900' : 'text-gray-500',
          )}
        >
          <h2 className="w-full font-semibold">Straßenfotos</h2>
        </div>
        <button
          type="button"
          aria-expanded={settingsOpen}
          aria-controls={SETTINGS_ID}
          title="Stil und Filter"
          onClick={() => setSettingsOpen(!settingsOpen)}
          className={twJoin(
            'flex min-h-10 flex-none cursor-pointer items-center justify-center px-4 hover:bg-yellow-50 focus:ring-2 focus:ring-yellow-500 focus:outline-none focus:ring-inset sm:px-2',
            settingsOpen ? 'text-yellow-600' : 'text-yellow-500',
          )}
        >
          <AdjustmentsHorizontalIcon className="size-5" aria-hidden="true" />
          <span className="sr-only">Stil und Filter</span>
        </button>
      </header>

      <div className="isolate mx-2 mb-2 flex -space-x-px rounded-md shadow-sm">
        {streetImageryProviderIds.map((providerId) => {
          const selected = providers.includes(providerId)
          const { label } = providerById[providerId]
          return (
            <Tooltip
              key={providerId}
              className="group/segment min-w-0 flex-1"
              text={`${label}: Fotos auf der Karte ${selected ? 'ausblenden' : 'zeigen'}`}
            >
              <button
                type="button"
                aria-pressed={selected}
                aria-label={`${label}: Fotos auf der Karte zeigen`}
                onClick={() => toggleProvider(providerId)}
                className={segmentClassName(selected)}
              >
                <StreetImageryLogo id={providerId} className="size-5" mono={selected} />
              </button>
            </Tooltip>
          )
        })}
        {openers.map((opener) => {
          const armed = armedOpenerId === opener.id
          return (
            <Tooltip
              key={opener.id}
              className="group/segment min-w-0 flex-1"
              text={`${opener.label}: Ort auf der Karte wählen und dort öffnen${opener.requiresAccount ? ' (Zugang nur mit Account)' : ''}`}
            >
              <button
                type="button"
                aria-pressed={armed}
                aria-label={`${opener.label}: Ort auf der Karte wählen und dort öffnen`}
                onClick={() => toggleOpener(opener.id)}
                className={segmentClassName(armed)}
              >
                <StreetImageryLogo id={opener.id} className="size-5" mono={armed} />
                {opener.requiresAccount && (
                  <LockClosedIcon
                    className="absolute top-0.5 right-0.5 size-2.5 text-gray-500"
                    aria-hidden="true"
                  />
                )}
              </button>
            </Tooltip>
          )
        })}
      </div>

      <MotionCollapse open={settingsOpen}>
        <div id={SETTINGS_ID} className="border-t border-gray-200 px-2 py-2 text-sm">
          <StreetImagerySettings />
        </div>
      </MotionCollapse>
    </section>
  )
}
