import { useRegion } from '@/src/app/regionen/[regionSlug]/_components/regionUtils/useRegion'
import {
  defaultBackgroundParam,
  useBackgroundParam,
} from '@/src/app/regionen/[regionSlug]/_hooks/useQueryState/useBackgroundParam'
import { Listbox, ListboxButton, ListboxOptions } from '@headlessui/react'
import { ChevronUpDownIcon } from '@heroicons/react/24/outline'
import React from 'react'
import { useMap } from 'react-map-gl/maplibre'
import {
  SourcesRasterIds,
  sourcesBackgroundsRaster,
} from '../../_mapData/mapDataSources/sourcesBackgroundsRaster.const'
import { ListOption } from './ListOption'

export const SelectBackground: React.FC = () => {
  const { mainMap } = useMap()
  const { backgroundParam, setBackgroundParam } = useBackgroundParam()
  const region = useRegion()

  if (!region?.backgroundSources) return null

  const backgrounds = sourcesBackgroundsRaster.filter((s) =>
    region?.backgroundSources?.includes(s.id),
  )

  const onChange = (value: SourcesRasterIds) => {
    void setBackgroundParam(value)
  }

  if (!mainMap) return null
  if (!backgroundParam) return null

  return (
    <Listbox as="section" className="" value={backgroundParam} onChange={onChange}>
      <ListboxButton className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-md hover:bg-yellow-50 focus:ring-2 focus:ring-yellow-500 focus:outline-none">
        Hintergrundkarten
        <ChevronUpDownIcon className="-mr-1 ml-2 h-5 w-5" aria-hidden="true" />
      </ListboxButton>
      <ListboxOptions
        transition
        anchor="top end"
        className="ring-opacity-5 absolute right-0 z-10 mt-2 max-h-[calc(100%_-_2.5rem)] w-60 overflow-auto rounded-md bg-white text-sm shadow-lg ring-1 ring-black transition focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[enter]:ease-out data-[leave]:duration-75 data-[leave]:ease-in"
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
