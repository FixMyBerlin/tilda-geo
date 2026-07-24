import { Listbox, ListboxButton, ListboxOptions } from '@headlessui/react'
import { CheckIcon } from '@heroicons/react/20/solid'
import { ChevronUpDownIcon, GlobeAltIcon } from '@heroicons/react/24/outline'
import type React from 'react'
import { useState } from 'react'
import { useMap } from 'react-map-gl/maplibre'
import { twJoin, twMerge } from 'tailwind-merge'
import {
  defaultBackgroundParam,
  type BackgroundParam,
} from '@/components/regionen/pageRegionSlug/hooks/useQueryState/backgroundParam.const'
import { useBackgroundParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useBackgroundParam'
import { useRegionLoaderData } from '@/components/regionen/pageRegionSlug/hooks/useRegionLoaderData'
import { sourcesBackgroundsRaster } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/sourcesBackgroundsRaster.const'
import { useBreakpoint } from '@/components/shared/hooks/viewport/useBreakpoint'
import { MobileBottomSheet } from '../mobile/MobileBottomSheet'
import {
  mobileControlButtonActiveClassName,
  mobileControlButtonClassName,
} from '../mobile/mobileControlButton.const'
import { ListOption } from './ListOption'

export const SelectBackground: React.FC = () => {
  const { mainMap } = useMap()
  const { backgroundParam, setBackgroundParam } = useBackgroundParam()
  const { region } = useRegionLoaderData()
  const isSmBreakpointOrAbove = useBreakpoint('sm')
  const [sheetOpen, setSheetOpen] = useState(false)

  if (!region?.backgroundSources) return null

  const backgrounds = sourcesBackgroundsRaster.filter((s) =>
    region?.backgroundSources?.includes(s.id),
  )

  const onChange = (value: BackgroundParam) => {
    void setBackgroundParam(value)
  }

  if (!mainMap) return null
  if (!backgroundParam) return null

  // Mobile: an icon button that opens the same options as a bottom sheet (consistent
  // with the other mobile controls), instead of the desktop dropdown.
  if (!isSmBreakpointOrAbove) {
    const options: { value: BackgroundParam; name: string }[] = [
      ...backgrounds.map(({ id, name }) => ({ value: id, name })),
      { value: defaultBackgroundParam, name: 'Standard' },
    ]

    return (
      <section>
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          aria-label="Hintergrundkarten"
          aria-expanded={sheetOpen}
          className={twMerge(
            mobileControlButtonClassName,
            'size-10',
            sheetOpen && mobileControlButtonActiveClassName,
          )}
        >
          <GlobeAltIcon className="size-6" aria-hidden="true" />
        </button>

        <MobileBottomSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          title="Hintergrundkarten"
        >
          {/* Container query: two columns once the sheet is wide enough (most phones).
              Rows are separated by thin divider lines (not full card borders). */}
          <div className="@container">
            <div className="grid grid-cols-1 gap-x-3 @xs:grid-cols-2">
              {options.map(({ value, name }) => {
                const selected = backgroundParam === value
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      onChange(value)
                      setSheetOpen(false)
                    }}
                    className={twJoin(
                      'flex min-w-0 items-center gap-2 border-b border-gray-100 px-3 py-2 text-left text-sm',
                      selected
                        ? 'bg-yellow-100 font-medium text-yellow-900'
                        : 'text-gray-900 hover:bg-yellow-50',
                    )}
                  >
                    <span className="flex w-5 shrink-0 justify-center">
                      {selected && <CheckIcon className="size-5" aria-hidden="true" />}
                    </span>
                    {/* Wrap to two lines with hyphenation instead of truncating. */}
                    <span className="line-clamp-2 leading-tight hyphens-auto" lang="de">
                      {name}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </MobileBottomSheet>
      </section>
    )
  }

  return (
    <Listbox<'section', BackgroundParam>
      as="section"
      className=""
      value={backgroundParam}
      onChange={onChange}
    >
      <ListboxButton
        aria-label="Hintergrundkarten"
        className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-md hover:bg-yellow-50 focus:ring-2 focus:ring-yellow-500 focus:outline-none"
      >
        Hintergrundkarten
        <ChevronUpDownIcon className="-mr-1 ml-2 size-5" aria-hidden="true" />
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
