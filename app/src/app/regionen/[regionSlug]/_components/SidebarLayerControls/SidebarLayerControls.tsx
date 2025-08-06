import { SmallSpinner } from '@/src/app/_components/Spinner/SmallSpinner'
import { Disclosure, DisclosureButton, DisclosurePanel, Transition } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import { Fragment, Suspense } from 'react'
import { twJoin } from 'tailwind-merge'
import useResizeObserver from 'use-resize-observer'
import { useMapActions } from '../../_hooks/mapState/useMapState'
import { useBreakpoint } from '../utils/useBreakpoint'
import { Categories } from './Categories/Categories'
import { QaConfigCategories } from './QaConfigs/QaConfigCategories'
import { StaticDatasetCategories } from './StaticDatasets/StaticDatasetCategories'

const SidebarLayerControlsChildren = () => {
  return (
    <>
      <Suspense fallback={<SmallSpinner />}>
        <Categories />
      </Suspense>
      <Suspense fallback={<SmallSpinner />}>
        <StaticDatasetCategories />
      </Suspense>
      <Suspense fallback={<SmallSpinner />}>
        <QaConfigCategories />
      </Suspense>
    </>
  )
}

export const SidebarLayerControls = () => {
  const isSmBreakpointOrAbove = useBreakpoint('sm')
  const { setSidebarSize } = useMapActions()

  const { ref } = useResizeObserver<HTMLDivElement>({
    box: 'border-box',
    onResize: setSidebarSize,
  })

  return (
    <section
      ref={ref}
      className="absolute left-0 top-0 z-20 max-h-full max-w-72 overflow-y-auto overflow-x-visible bg-white py-px shadow-md"
    >
      {isSmBreakpointOrAbove ? (
        <SidebarLayerControlsChildren />
      ) : (
        <Disclosure as={Fragment} defaultOpen={false}>
          {({ open }) => (
            <>
              <DisclosureButton className="flex w-full items-center gap-0.5 pr-3 text-sm font-semibold leading-none hover:bg-yellow-50">
                <ChevronDownIcon
                  className={twJoin(
                    open ? '' : '-rotate-90 transform',
                    'h-5 w-5 text-gray-700 hover:text-gray-900',
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
                  <SidebarLayerControlsChildren />
                </DisclosurePanel>
              </Transition>
            </>
          )}
        </Disclosure>
      )}
    </section>
  )
}
