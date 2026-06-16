import { Combobox, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react'
import {
  BuildingOffice2Icon,
  GlobeAltIcon,
  HashtagIcon,
  MagnifyingGlassIcon,
  MapIcon,
  MapPinIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { useEffect, useRef, useState } from 'react'
import { twMerge } from 'tailwind-merge'
import { mobileControlButtonClassName } from '../../mobile/mobileControlButton.const'
import { useStaticRegion } from '../../regionUtils/useStaticRegion'
import { type GeoFeature, type PlaceType, useGeocodingSearch } from './useGeocodingSearch'

type Props = {
  /** Extra classes for the wrapper (e.g. the desktop overlay positioning). */
  className?: string
}

// Icon per MapTiler place type — covers the geocoder's full PlaceType set:
// globe for global/country, map for administrative areas, building for settlements,
// hashtag for postal codes, pin for addresses/roads/POIs. Unknown → pin.
const PLACE_TYPE_ICONS: Partial<Record<PlaceType, typeof MapIcon>> = {
  continental_marine: GlobeAltIcon,
  country: GlobeAltIcon,
  region: MapIcon,
  subregion: MapIcon,
  county: MapIcon,
  major_landform: MapIcon,
  joint_municipality: BuildingOffice2Icon,
  joint_submunicipality: BuildingOffice2Icon,
  municipality: BuildingOffice2Icon,
  municipal_district: BuildingOffice2Icon,
  locality: BuildingOffice2Icon,
  neighbourhood: BuildingOffice2Icon,
  place: BuildingOffice2Icon,
  postal_code: HashtagIcon,
  address: MapPinIcon,
  road: MapPinIcon,
  poi: MapPinIcon,
}
const resultIcon = (feature: GeoFeature) => {
  const type = feature.place_type?.[0]
  // `|| MapPinIcon` also covers unknown values the API might add (data is cast, not validated).
  return (type && PLACE_TYPE_ICONS[type]) || MapPinIcon
}

// Context line = the place_name minus its leading primary-name segment,
// e.g. "Oranienburg, Brandenburg, Deutschland" → "Brandenburg, Deutschland".
const resultContext = (feature: GeoFeature) =>
  (feature.place_name ?? '')
    .split(',')
    .slice(1)
    .map((part) => part.trim())
    .filter(Boolean)
    .join(', ')

/**
 * Place search used on both desktop and mobile (replaces the maplibre geocoder).
 * Closed: a magnifier button. Open: a rounded panel anchored to the button's right
 * edge, expanding left to overlap the neighbouring controls — leading magnifier,
 * left-aligned input, trailing X — with a results dropdown. Selecting a result flies
 * the map there and draws its geometry.
 *
 * The input + results use HeadlessUI `Combobox`, which gives keyboard navigation
 * (↑/↓ to move, Enter to pick, Escape to close) and the active-item highlight for free.
 * Closes via X, Escape, or tapping outside.
 */
export const PlaceSearch = ({ className }: Props) => {
  const region = useStaticRegion()
  const [open, setOpen] = useState(false)
  const { query, setQuery, results, selectFeature, clearResult, activeFeature } =
    useGeocodingSearch()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Collapse on outside tap — but only while nothing is selected. With an active result the
  // bar stays open showing its name (clear it via the input or the X), per the requirement.
  useEffect(
    function collapseSearchOnOutsidePointerDown() {
      if (!open || activeFeature) return
      const onPointerDown = (event: PointerEvent) => {
        if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
          setOpen(false)
        }
      }
      document.addEventListener('pointerdown', onPointerDown)
      return function removeOutsidePointerDownListener() {
        document.removeEventListener('pointerdown', onPointerDown)
      }
    },
    [open, activeFeature],
  )

  if (region?.showSearch !== true) return null

  // X = full reset: drop the geometry and collapse back to the button.
  const clearAndClose = () => {
    clearResult()
    setQuery('')
    setOpen(false)
  }

  const openSearch = () => {
    setOpen(true)
    // Seed the input with the active result's label (if any) so it shows what's on the map.
    setQuery(activeFeature?.place_name ?? '')
    // Focus after render so the on-screen keyboard opens on the now-visible input.
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  // Don't show the results list for the already-selected label (it's acting as the value, not a search).
  const showResults = !activeFeature || query !== activeFeature.place_name

  return (
    <div ref={wrapperRef} className={twMerge('relative', className)}>
      {/* Trigger stays in flow so the surrounding layout doesn't shift; the open panel overlays it. */}
      <button
        type="button"
        onClick={openSearch}
        aria-label="Suche"
        aria-expanded={open}
        aria-hidden={open}
        tabIndex={open ? -1 : undefined}
        className={twMerge(mobileControlButtonClassName, 'size-10')}
      >
        <MagnifyingGlassIcon className="size-6" aria-hidden="true" />
      </button>

      {/* Dim the map below the open search (mobile) so the panel + results stand out.
          `pointer-events-none` keeps the map pannable and outside-tap-to-close working. */}
      {open && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-x-0 top-0 z-40 h-[55vh] bg-gradient-to-b from-black/45 to-transparent sm:hidden"
        />
      )}

      {open && (
        <Combobox
          as="div"
          immediate
          by="id"
          value={activeFeature}
          onChange={(feature: GeoFeature | null) => {
            if (feature) {
              selectFeature(feature)
              // Keep the panel open and show the picked name as the bar's value.
              setQuery(feature.place_name ?? '')
            }
          }}
          className="pointer-events-auto absolute top-0 right-0 z-50 w-[min(22rem,calc(100vw-4.5rem))]"
        >
          <div className="flex h-10 items-stretch overflow-hidden rounded-md border border-gray-300 bg-white shadow-md">
            <MagnifyingGlassIcon
              className="ml-2 size-5 shrink-0 self-center text-violet-600"
              aria-hidden="true"
            />
            <ComboboxInput
              ref={inputRef}
              displayValue={(feature: GeoFeature | null) => feature?.place_name ?? ''}
              onChange={(event) => {
                const text = event.target.value
                setQuery(text)
                // Emptying the field clears the active geometry (map reset to nothing).
                if (text === '') clearResult()
              }}
              onKeyDown={(event) => {
                if (event.key === 'Escape' && !activeFeature) setOpen(false)
              }}
              placeholder="Suche"
              aria-label="Suche"
              // @tailwindcss/forms adds a border + a focus box-shadow ring to inputs; clear both
              // (border-0 + focus:ring-0) so the field blends into the surrounding panel.
              className="min-w-0 flex-1 border-0 bg-transparent px-2 text-sm text-gray-900 outline-none placeholder:text-gray-500 focus:border-0 focus:ring-0 focus:outline-none"
            />
            {/* Full-height clickable zone. Close on pointerdown (with preventDefault) so the very
                first press works: clicking it would otherwise just blur the input, and the
                blur-driven re-render would eat the click. onClick keeps it keyboard-operable. */}
            <button
              type="button"
              onPointerDown={(event) => {
                event.preventDefault()
                clearAndClose()
              }}
              onClick={clearAndClose}
              aria-label="Suche schließen"
              className="flex w-10 shrink-0 cursor-pointer items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            >
              <XMarkIcon className="size-5" aria-hidden="true" />
            </button>
          </div>

          <ComboboxOptions className="mt-1 max-h-80 overflow-y-auto rounded-md border border-gray-200 bg-white py-1 text-sm shadow-lg empty:invisible">
            {showResults &&
              results.map((feature) => {
                const Icon = resultIcon(feature)
                const context = resultContext(feature)
                return (
                  <ComboboxOption
                    key={feature.id}
                    value={feature}
                    className="group flex cursor-pointer items-start gap-2 px-3 py-2 select-none data-focus:bg-violet-50"
                  >
                    <Icon className="mt-0.5 size-5 shrink-0 text-gray-400" aria-hidden="true" />
                    <div className="min-w-0 flex-1 leading-snug">
                      <div className="truncate">
                        <span className="font-semibold text-gray-900 group-data-focus:text-violet-700">
                          {feature.text ?? feature.place_name}
                        </span>
                        {feature.place_type_name?.[0] && (
                          <span className="ml-1.5 text-gray-500">{feature.place_type_name[0]}</span>
                        )}
                      </div>
                      {context && <div className="truncate text-gray-500">{context}</div>}
                    </div>
                  </ComboboxOption>
                )
              })}
          </ComboboxOptions>
        </Combobox>
      )}
    </div>
  )
}
