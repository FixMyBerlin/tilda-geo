import {
  DisclosureButton,
  DisclosurePanel,
  Disclosure as HeadlessUiDisclosure,
} from '@headlessui/react'
import { ChevronRightIcon, LockClosedIcon } from '@heroicons/react/20/solid'
import type React from 'react'
import { twJoin } from 'tailwind-merge'
import { MotionCollapse } from '@/components/shared/motion/MotionCollapse'
import { Tooltip } from '@/components/shared/Tooltip/Tooltip'

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
              'focus-visible:ring-opacity-75 flex w-full items-center justify-between bg-gray-50 py-2 pr-2 pl-2.5 text-left text-sm leading-tight font-semibold text-gray-900 hover:bg-yellow-100 focus:outline-none focus-visible:ring focus-visible:ring-gray-500',
              open ? 'rounded-b-none border-b border-b-gray-200 bg-gray-100' : '',
            )}
          >
            <ChevronRightIcon
              className={twJoin(
                'mr-1 -ml-0.5 size-5 shrink-0 text-gray-900 transition-transform',
                open ? 'rotate-90 transform' : '',
              )}
            />
            <h3 className="not-prose w-full leading-tight">
              <div className="flex w-full items-start justify-between gap-2">
                <span className="min-w-0 leading-tight">{title}</span>
                <div className="flex shrink-0 items-center gap-1.5 text-gray-400">
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
          <MotionCollapse open={open}>
            <DisclosurePanel static className="bg-gray-50 text-sm text-gray-500">
              {children}
            </DisclosurePanel>
          </MotionCollapse>
        </>
      )}
    </HeadlessUiDisclosure>
  )
}
