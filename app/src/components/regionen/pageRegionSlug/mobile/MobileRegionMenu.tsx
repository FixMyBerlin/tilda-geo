import { BuildingLibraryIcon, LockClosedIcon } from '@heroicons/react/24/outline'
import { getRouteApi } from '@tanstack/react-router'
import { useState } from 'react'
import { twJoin } from 'tailwind-merge'
import { useStaticRegion } from '@/components/regionen/pageRegionSlug/regionUtils/useStaticRegion'
import { RegionStatusPill } from '@/components/regionen/regionMeta/RegionStatusPill'
import { Img } from '@/components/shared/Img'
import {
  defaultPrimaryNavigation,
  defaultSecondaryNavigationGrouped,
} from '@/components/shared/layouts/Header/HeaderRegionen/navigation.const'
import type {
  PrimaryNavigation,
  SecondaryNavigation,
} from '@/components/shared/layouts/Header/types'
import { productName } from '@/data/tildaProductNames.const'
import { MobileBottomSheet } from './MobileBottomSheet'
import { mobileControlButtonClassName } from './mobileControlButton.const'

const routeApi = getRouteApi('/regionen/$regionSlug')

/** 1–2 letter fallback shown when a region has no logo (e.g. "Berlin" → "B", "Bad Belzig" → "BB"). */
const regionAbbreviation = (name: string) => {
  const words = name
    .trim()
    .split(/[\s-]+/)
    .filter(Boolean)
  if (words.length >= 2) return `${words[0]!.charAt(0)}${words[1]!.charAt(0)}`.toUpperCase()
  return name.trim().slice(0, 2).toUpperCase()
}

const NavLink = ({ item }: { item: PrimaryNavigation | SecondaryNavigation }) => {
  const className =
    'block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-yellow-50'
  if ('to' in item) {
    const href = item.hash ? `${item.to}#${item.hash}` : item.to
    return (
      <a href={href} className={className}>
        {item.name}
      </a>
    )
  }
  return (
    <a href={item.href} target="_blank" rel="noopener noreferrer" className={className}>
      {item.name}
    </a>
  )
}

/**
 * Mobile region menu: a floating logo/abbreviation button (placed top-left in
 * the MobileMapHeader) that opens a bottom sheet repeating the region logo and
 * info plus all navigation links — the mobile replacement for the dark header.
 */
export const MobileRegionMenu = () => {
  const [open, setOpen] = useState(false)
  const staticRegion = useStaticRegion()
  const { region } = routeApi.useLoaderData()

  if (!staticRegion) return null

  const customLogo = staticRegion.logoPath || staticRegion.externalLogoPath
  const isPrivate = region.status === 'PRIVATE'
  const isDeactivated = region.status === 'DEACTIVATED'
  const primaryNavigation = [...defaultPrimaryNavigation, ...(staticRegion.navigationLinks ?? [])]

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Menü – ${staticRegion.fullName}`}
        className={twJoin(
          mobileControlButtonClassName,
          'h-10 min-w-10 gap-1 px-1.5',
          customLogo && staticRegion.logoWhiteBackgroundRequired ? 'bg-white' : '',
        )}
      >
        {customLogo ? (
          <Img src={customLogo} className="h-6 w-auto max-w-16 object-contain" alt="" />
        ) : (
          <span className="text-sm font-bold text-yellow-500">
            {regionAbbreviation(staticRegion.name)}
          </span>
        )}
      </button>

      <MobileBottomSheet open={open} onClose={() => setOpen(false)} title={staticRegion.name}>
        <div className="flex items-center gap-3 px-4 pt-1 pb-4">
          {customLogo ? (
            <div
              className={twJoin(
                'shrink-0',
                staticRegion.logoWhiteBackgroundRequired ? 'rounded-sm bg-white px-1 py-1' : '',
              )}
            >
              <Img src={customLogo} className="h-10 w-auto" alt="" />
            </div>
          ) : (
            <BuildingLibraryIcon className="h-10 w-auto shrink-0 text-yellow-400" />
          )}
          <div className="min-w-0 leading-tight">
            <div className="flex items-center gap-1">
              {isPrivate && (
                <LockClosedIcon className="size-4 shrink-0 text-gray-400" aria-hidden="true" />
              )}
              <span className="font-semibold text-gray-900">{staticRegion.fullName}</span>
              {isDeactivated && (
                <RegionStatusPill status="DEACTIVATED" className="shrink-0 px-1.5 py-0.5" />
              )}
            </div>
            <div className="text-xs text-gray-500">{productName.get(staticRegion.product)}</div>
          </div>
        </div>

        <nav className="border-t border-gray-200 px-2 py-2">
          {primaryNavigation.map((item) => (
            <NavLink key={item.name} item={item} />
          ))}
          {defaultSecondaryNavigationGrouped.map((group) => (
            <div
              key={group.map((item) => item.name).join(',')}
              className="mt-2 border-t border-gray-100 pt-2"
            >
              {group.map((item) => (
                <NavLink key={item.name} item={item} />
              ))}
            </div>
          ))}
        </nav>
      </MobileBottomSheet>
    </>
  )
}
