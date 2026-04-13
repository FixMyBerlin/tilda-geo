import { Disclosure, DisclosureButton, DisclosurePanel, Transition } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import { twJoin } from 'tailwind-merge'
import { useInitialSizeMeasurement } from '@/components/regionen/pageRegionSlug/hooks/mapState/useInitialSizeMeasurement'
import { useMapActions } from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapState'
import { useBreakpoint } from '../utils/useBreakpoint'
import { Categories } from './Categories/Categories'
import { QaConfigCategories } from './QaConfigs/QaConfigCategories'
import { StaticDatasetCategories } from './StaticDatasets/StaticDatasetCategories'

export const SidebarLayerControls = () => {
  const isSmBreakpointOrAbove = useBreakpoint('sm')
  const { updateSidebarSize } = useMapActions()
  // One-time measurement for initial map-fit visible area (see useInitialSizeMeasurement).
  const ref = useInitialSizeMeasurement<HTMLDivElement>(updateSidebarSize)

  return (
    <section
      ref={ref}
      className="absolute top-0 left-0 z-20 max-h-full w-65 overflow-x-visible overflow-y-auto bg-white py-px text-pretty shadow-md"
    >
      {isSmBreakpointOrAbove ? (
        <>
          <Categories />
          <StaticDatasetCategories />
          <QaConfigCategories />
        </>
      ) : (
        <Disclosure as="div" defaultOpen={false}>
          {({ open }) => (
            <>
              <DisclosureButton className="flex w-full items-center gap-0.5 pr-3 text-sm leading-none font-semibold hover:bg-yellow-50">
                <ChevronDownIcon
                  className={twJoin(
                    open ? '' : '-rotate-90 transform',
                    'size-5 text-gray-700 hover:text-gray-900',
                  )}
                />
                <span>Kategorien</span>
              </DisclosureButton>
              <Transition
                enter="transition duration-100 ease-out"
                enterFrom="transform scale-95 opacity-0"
                enterTo="transform scale-100 opacity-100"
                leave="transition duration-75 ease-out"
                leaveFrom="transform scale-100 opacity-100"
                leaveTo="transform scale-95 opacity-0"
              >
                <DisclosurePanel static>
                  <Categories />
                  <StaticDatasetCategories />
                  <QaConfigCategories />
                </DisclosurePanel>
              </Transition>
            </>
          )}
        </Disclosure>
      )}
    </section>
  )
}
