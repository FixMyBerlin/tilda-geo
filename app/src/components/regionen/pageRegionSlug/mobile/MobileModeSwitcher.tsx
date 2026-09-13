import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import { getRouteApi, Link } from '@tanstack/react-router'
import { twJoin, twMerge } from 'tailwind-merge'
import { mapOverlayMenuClassName } from '../mapOverlayChrome.const'
import { modeIdentity, modeShortLabel } from '../modes/modeIdentity'
import { modeSwitcherSearch } from '../modes/modeSwitcherSearch'
import { regionModeOrder, modeRoutePaths, useOptimisticMode } from '../modes/useCurrentMode'
import {
  mobileControlButtonActiveClassName,
  mobileControlButtonClassName,
} from './mobileControlButton.const'

const routeApi = getRouteApi('/regionen/$regionSlug')

/**
 * Compact current-mode control in the mobile map header. Opens a small menu of available
 * modes (same routes/search as the desktop header switcher). Hidden when only Karte exists.
 */
export const MobileModeSwitcher = () => {
  const { regionSlug } = routeApi.useParams()
  const { availableModes } = routeApi.useLoaderData()
  const optimisticMode = useOptimisticMode()
  const modes = regionModeOrder.filter((mode) => mode === 'map' || availableModes[mode])
  if (modes.length <= 1) return null

  const current = modeIdentity[optimisticMode]
  const CurrentIcon = current.icon

  return (
    <Menu as="div" className="relative">
      {({ open }) => (
        <>
          <MenuButton
            aria-label={`Modus: ${current.label}`}
            className={twMerge(
              mobileControlButtonClassName,
              'h-8.5 max-w-32 cursor-pointer gap-1 px-2 select-none',
              open && mobileControlButtonActiveClassName,
            )}
          >
            <CurrentIcon className="size-5 shrink-0" aria-hidden />
            <span className="truncate text-sm font-medium">{modeShortLabel[optimisticMode]}</span>
            <ChevronDownIcon className="size-4 shrink-0 text-gray-500" aria-hidden />
          </MenuButton>
          <MenuItems
            anchor="bottom start"
            className={twJoin('z-40 min-w-52 py-1 [--anchor-gap:8px]', mapOverlayMenuClassName)}
          >
            {modes.map((mode) => {
              const identity = modeIdentity[mode]
              const Icon = identity.icon
              const active = optimisticMode === mode
              return (
                <MenuItem key={mode}>
                  {({ focus }) => (
                    <Link
                      from="/regionen/$regionSlug"
                      to={modeRoutePaths[mode]}
                      params={{ regionSlug }}
                      search={(prev) => modeSwitcherSearch(mode, prev)}
                      aria-current={active ? 'page' : undefined}
                      className={twJoin(
                        'flex w-full cursor-pointer items-center gap-2 px-3 py-2.5 text-left text-sm select-none',
                        active ? 'bg-yellow-50 font-medium text-yellow-900' : 'text-gray-700',
                        focus && !active ? 'bg-yellow-50' : '',
                      )}
                    >
                      <Icon className="size-5 shrink-0" aria-hidden />
                      {identity.label}
                    </Link>
                  )}
                </MenuItem>
              )
            })}
          </MenuItems>
        </>
      )}
    </Menu>
  )
}
