import { Tooltip } from '@/src/app/_components/Tooltip/Tooltip'
import {
  DisclosureButton,
  DisclosurePanel,
  Disclosure as HeadlessUiDisclosure,
  Transition,
} from '@headlessui/react'
import { ChevronRightIcon, LockClosedIcon } from '@heroicons/react/20/solid'
import React from 'react'
import { twJoin } from 'tailwind-merge'

type Props = {
  title: string | React.ReactNode
  objectId?: string
  showLockIcon?: boolean
  children: React.ReactNode
  defaultOpen?: boolean
}

export const Disclosure = ({
  title,
  objectId,
  showLockIcon = false,
  children,
  defaultOpen = true,
}: Props) => {
  return (
    <HeadlessUiDisclosure
      defaultOpen={defaultOpen}
      as="section"
      className="overflow-clip rounded-lg border border-gray-300"
    >
      {({ open }) => (
        <>
          <DisclosureButton
            className={twJoin(
              'focus-visible:ring-opacity-75 flex w-full justify-between bg-gray-50 py-2 pr-2 pl-2.5 text-left text-sm font-semibold text-gray-900 hover:bg-yellow-100 focus:outline-none focus-visible:ring focus-visible:ring-gray-500',
              open ? 'rounded-b-none border-b border-b-gray-200 bg-gray-100' : '',
            )}
          >
            <ChevronRightIcon
              className={twJoin('mr-1.5 h-5 w-5 text-gray-900', open ? 'rotate-90 transform' : '')}
            />
            <h3 className="w-full">
              <div className="flex w-full justify-between">
                <span>{title}</span>
                <div className="flex items-center gap-1.5 text-gray-400">
                  {!!objectId && <span className="font-mono">#{objectId}</span>}
                  {showLockIcon && (
                    <Tooltip text="Diese Daten sehen nur für Nutzer:innen mit Rechten.">
                      <LockClosedIcon
                        className="size-4 flex-none text-gray-400"
                        aria-hidden="true"
                      />
                    </Tooltip>
                  )}
                </div>
              </div>
            </h3>
          </DisclosureButton>
          <Transition
            show={open}
            enter="transition duration-100 ease-out"
            enterFrom="transform scale-95 opacity-0"
            enterTo="transform scale-100 opacity-100"
            leave="transition duration-75 ease-out"
            leaveFrom="transform scale-100 opacity-100"
            leaveTo="transform scale-95 opacity-0"
          >
            <DisclosurePanel static className="bg-gray-50 text-sm text-gray-500">
              {children}
            </DisclosurePanel>
          </Transition>
        </>
      )}
    </HeadlessUiDisclosure>
  )
}
