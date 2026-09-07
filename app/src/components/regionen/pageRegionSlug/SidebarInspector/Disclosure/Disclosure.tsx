import {
  DisclosureButton,
  DisclosurePanel,
  Disclosure as HeadlessUiDisclosure,
} from '@headlessui/react'
import { ChevronRightIcon, LockClosedIcon } from '@heroicons/react/20/solid'
import type React from 'react'
import { twJoin } from 'tailwind-merge'
import {
  type ModeAccentMode,
  modeAccentInvertedClassName,
  modeAccentStyle,
  modeAccentTintClassName,
  modeIdentity,
} from '@/components/regionen/pageRegionSlug/modes/modeIdentity'
import { MotionCollapse } from '@/components/shared/motion/MotionCollapse'
import { Tooltip } from '@/components/shared/Tooltip/Tooltip'

type Props = {
  title: string | React.ReactNode
  objectId?: string
  showLockIcon?: boolean
  children: React.ReactNode
  defaultOpen?: boolean
  /** Feature-kind Zugehörigkeit (notes / qa / review). Not the current route mode. */
  mode?: ModeAccentMode
}

export const Disclosure = ({
  title,
  objectId,
  showLockIcon = false,
  children,
  defaultOpen = true,
  mode,
}: Props) => {
  const accentStyle = mode ? modeAccentStyle(modeIdentity[mode].accent) : undefined

  return (
    <HeadlessUiDisclosure
      defaultOpen={defaultOpen}
      as="section"
      className="overflow-clip rounded-lg border border-gray-300"
      style={accentStyle}
    >
      {({ open }) => (
        <>
          <DisclosureButton
            className={twJoin(
              'group focus-visible:ring-opacity-75 flex w-full items-center justify-between py-2 pr-2 pl-2.5 text-left text-sm leading-tight font-semibold focus:outline-none focus-visible:ring focus-visible:ring-gray-500',
              mode
                ? twJoin(
                    modeAccentInvertedClassName,
                    'text-white hover:bg-yellow-100 hover:text-gray-900',
                  )
                : twJoin('bg-gray-50 text-gray-900 hover:bg-yellow-100', open ? 'bg-gray-100' : ''),
              open ? 'rounded-b-none border-b border-b-gray-200' : '',
            )}
          >
            <ChevronRightIcon
              className={twJoin(
                'mr-1 -ml-0.5 size-5 shrink-0 transition-transform',
                mode ? 'text-white group-hover:text-gray-900' : 'text-gray-900',
                open ? 'rotate-90 transform' : '',
              )}
            />
            <h3 className="not-prose w-full leading-tight">
              <div className="flex w-full items-start justify-between gap-2">
                <span className="min-w-0 leading-tight">{title}</span>
                <div
                  className={twJoin(
                    'flex shrink-0 items-center gap-1.5',
                    mode ? 'text-white/70 group-hover:text-gray-500' : 'text-gray-400',
                  )}
                >
                  {!!objectId && <span className="font-mono">#{objectId}</span>}
                  {showLockIcon && (
                    <Tooltip text="Diese Daten sehen nur für Nutzer:innen mit Rechten.">
                      <LockClosedIcon
                        className={twJoin(
                          'size-4 flex-none',
                          mode ? 'text-white/70 group-hover:text-gray-400' : 'text-gray-400',
                        )}
                        aria-hidden="true"
                      />
                    </Tooltip>
                  )}
                </div>
              </div>
            </h3>
          </DisclosureButton>
          <MotionCollapse open={open}>
            <DisclosurePanel
              static
              className={twJoin(
                'text-sm text-gray-500',
                mode ? modeAccentTintClassName : 'bg-gray-50',
              )}
            >
              {children}
            </DisclosurePanel>
          </MotionCollapse>
        </>
      )}
    </HeadlessUiDisclosure>
  )
}
