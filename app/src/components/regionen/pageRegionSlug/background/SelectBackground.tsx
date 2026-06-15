import { Listbox, ListboxButton, ListboxOptions } from '@headlessui/react'
import { ChevronUpDownIcon, GlobeAltIcon } from '@heroicons/react/24/outline'
import type React from 'react'
import { useMap } from 'react-map-gl/maplibre'
import { twJoin } from 'tailwind-merge'
import {
  defaultBackgroundParam,
  useBackgroundParam,
  type BackgroundParam,
} from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useBackgroundParam'
import { useRegionLoaderData } from '@/components/regionen/pageRegionSlug/hooks/useRegionLoaderData'
import { sourcesBackgroundsRaster } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/sourcesBackgroundsRaster.const'
import { useBreakpoint } from '../utils/useBreakpoint'
import { ListOption } from './ListOption'

export const SelectBackground: React.FC = () => {
  const { mainMap } = useMap()
  const { backgroundParam, setBackgroundParam } = useBackgroundParam()
  const { region } = useRegionLoaderData()
  const isSmBreakpointOrAbove = useBreakpoint('sm')

  if (!region?.backgroundSources) return null

  const backgrounds = sourcesBackgroundsRaster.filter((s) =>
    region?.backgroundSources?.includes(s.id),
  )

  const onChange = (value: BackgroundParam) => {
    void setBackgroundParam(value)
  }

  if (!mainMap) return null
  if (!backgroundParam) return null

  return (
    <Listbox<'section', BackgroundParam>
      as="section"
      className=""
      value={backgroundParam}
      onChange={onChange}
    >
      <ListboxButton
        aria-label="Hintergrundkarten"
        className={twJoin(
          'inline-flex items-center justify-center rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 shadow-md hover:bg-yellow-50 focus:ring-2 focus:ring-yellow-500 focus:outline-none',
          isSmBreakpointOrAbove ? 'px-4 py-2' : 'size-10',
        )}
      >
        {isSmBreakpointOrAbove ? (
          <>
            Hintergrundkarten
            <ChevronUpDownIcon className="-mr-1 ml-2 size-5" aria-hidden="true" />
          </>
        ) : (
          <GlobeAltIcon className="size-6" aria-hidden="true" />
        )}
      </ListboxButton>
      <ListboxOptions
        transition
        anchor="top end"
        className="absolute right-0 z-10 mt-2 max-h-[calc(100%-2.5rem)] w-60 overflow-auto rounded-md bg-white text-sm shadow-lg outline-1 outline-black/5 transition data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
      >
        {backgrounds.map(({ name, id }) => {
          return <ListOption key={id} value={id} name={name} />
        })}
        <ListOption
          key={`${backgroundParam}-default`}
          value={defaultBackgroundParam}
          name="Standard"
        />
      </ListboxOptions>
    </Listbox>
  )
}
