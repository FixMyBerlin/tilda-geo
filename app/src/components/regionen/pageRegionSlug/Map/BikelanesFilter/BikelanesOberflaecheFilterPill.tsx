import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import { twJoin } from 'tailwind-merge'
import { bikelanesOberflaecheGroups } from './bikelanesFilterConfig'
import {
  useBikelanesFilterActions,
  useBikelanesOberflaecheDeselected,
} from './useBikelanesFilterState'

/** "Oberfläche" pill: same checklist pattern as the Führungsform pill, filtering by the RVA's
 * `surface` tile property instead of `category`. */
export const BikelanesOberflaecheFilterPill = () => {
  const oberflaecheDeselected = useBikelanesOberflaecheDeselected()
  const { toggleOberflaeche } = useBikelanesFilterActions()
  const filterActive = oberflaecheDeselected.size > 0

  return (
    <Popover className="relative">
      <PopoverButton
        className={twJoin(
          'flex h-8 items-center gap-0.5 rounded-full border px-2.5 text-xs font-medium shadow-sm transition-colors',
          filterActive
            ? 'border-yellow-500 bg-yellow-500 text-white'
            : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50',
        )}
      >
        Oberfläche
        <ChevronDownIcon className="size-3" aria-hidden="true" />
      </PopoverButton>

      <PopoverPanel
        anchor="bottom start"
        className="z-30 mt-1 w-56 rounded-md border border-gray-200 bg-white p-2 text-sm shadow-lg"
      >
        {bikelanesOberflaecheGroups.map((group) => (
          <label
            key={group.id}
            className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-gray-50"
          >
            <input
              type="checkbox"
              className="size-4 rounded border-gray-300 text-yellow-500 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-0 focus:outline-none"
              checked={!oberflaecheDeselected.has(group.id)}
              onChange={() => toggleOberflaeche(group.id)}
            />
            <span className="text-gray-700">{group.label}</span>
          </label>
        ))}
      </PopoverPanel>
    </Popover>
  )
}
