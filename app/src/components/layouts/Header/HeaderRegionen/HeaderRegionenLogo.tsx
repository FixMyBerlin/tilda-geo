import { BuildingLibraryIcon, LockClosedIcon } from '@heroicons/react/24/outline'
import { twJoin } from 'tailwind-merge'
import { useRegion } from '@/components/regionen/pageRegionSlug/regionUtils/useRegion'
import { RegionStatusPill } from '@/components/regionen/regionMeta/RegionStatusPill'
import { Img } from '@/components/shared/Img'
import { productName } from '@/data/tildaProductNames.const'

export const HeaderRegionenLogo = () => {
  const region = useRegion()

  if (!region) return null

  const isPrivate = region.status === 'PRIVATE'
  const isDeactivated = region.status === 'DEACTIVATED'
  const customLogo = region.logoPath

  return (
    <>
      {customLogo && (
        <div
          className={twJoin(
            region.logoWhiteBackgroundRequired ? 'rounded-sm bg-white px-1 py-1' : '',
          )}
        >
          <Img src={customLogo} className="h-8 w-auto" alt="" />
        </div>
      )}

      {!customLogo && (
        <>
          <BuildingLibraryIcon className="block h-8 w-auto text-yellow-400 lg:hidden" />
          <BuildingLibraryIcon className="hidden h-8 w-auto text-yellow-400 lg:block" />
        </>
      )}

      <div className="ml-3 min-w-0 leading-tight">
        <div
          className={twJoin(
            'flex items-center gap-1 truncate',
            customLogo ? 'text-gray-200' : 'text-yellow-400',
          )}
        >
          {isPrivate && (
            <LockClosedIcon className="size-4 shrink-0 text-gray-300" aria-hidden="true" />
          )}
          <span className="md:hidden">{region.name}</span>
          <span className="hidden md:inline">{region.fullName}</span>
          {isDeactivated && (
            <RegionStatusPill status="DEACTIVATED" className="shrink-0 px-1.5 py-0.5" />
          )}
        </div>
        <div className="text-xs text-gray-400">{productName[region.product]}</div>
      </div>
    </>
  )
}
