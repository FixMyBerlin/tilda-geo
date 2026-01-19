import { ListboxOption } from '@headlessui/react'
import { ArrowSmallRightIcon } from '@heroicons/react/20/solid'
import React from 'react'
import { twJoin } from 'tailwind-merge'
import { SourcesRasterIds } from '../../_mapData/mapDataSources/sourcesBackgroundsRaster.const'

type Props = { value: SourcesRasterIds; name: string }

// https://headlessui.com/react/listbox#styling-the-active-and-selected-option
export const ListOption: React.FC<Props> = ({ value, name }) => {
  return (
    <ListboxOption
      value={value}
      className={({ focus, selected }) =>
        twJoin(
          'relative py-2 pr-4 pl-10 text-gray-900 select-none',
          focus && !selected ? 'cursor-pointer bg-yellow-50 text-yellow-900' : '',
          selected ? 'bg-yellow-400' : '',
        )
      }
    >
      {({ focus, selected }) => (
        <>
          <span
            className={twJoin('block truncate', focus || selected ? 'font-medium' : 'font-normal')}
          >
            {name}
          </span>
          {!!selected && (
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-white">
              <ArrowSmallRightIcon className="h-5 w-5" aria-hidden="true" />
            </span>
          )}
        </>
      )}
    </ListboxOption>
  )
}
