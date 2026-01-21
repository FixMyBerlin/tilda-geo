import { Pill } from '@/src/app/_components/text/Pill'
import { useRegion } from '@/src/app/regionen/[regionSlug]/_components/regionUtils/useRegion'
import { useStaticRegion } from '@/src/app/regionen/[regionSlug]/_components/regionUtils/useStaticRegion'
import { productName } from '@/src/data/tildaProductNames.const'
import { BuildingLibraryIcon, LockClosedIcon } from '@heroicons/react/24/outline'
import Image from 'next/image'
import { twJoin } from 'tailwind-merge'

export const HeaderRegionenLogo = () => {
  const staticRegion = useStaticRegion()
  const region = useRegion()

  if (!staticRegion) return null

  const isPrivate = region.status === 'PRIVATE'
  const isDeactivated = region.status === 'DEACTIVATED'

  const customLogo = staticRegion.logoPath || staticRegion.externalLogoPath

  return (
    <>
      {customLogo && (
        <div
          className={twJoin(
            staticRegion.logoWhiteBackgroundRequired ? 'rounded-sm bg-white px-1 py-1' : '',
          )}
        >
          {staticRegion.externalLogoPath && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={staticRegion.externalLogoPath} className="h-8 w-auto" alt="" />
          )}
          {staticRegion.logoPath && (
            // local files
            <Image src={staticRegion.logoPath} className="h-8 w-auto" alt="" />
          )}
        </div>
      )}

      {!customLogo && (
        <>
          <BuildingLibraryIcon className="block h-8 w-auto text-yellow-400 lg:hidden" />
          <BuildingLibraryIcon className="hidden h-8 w-auto text-yellow-400 lg:block" />
        </>
      )}

      <div className="ml-3 truncate leading-tight">
        <div
          className={twJoin(
            'flex items-center gap-1 truncate',
            customLogo ? 'text-gray-200' : 'text-yellow-400',
          )}
        >
          {isPrivate && (
            <LockClosedIcon className="size-4 flex-shrink-0 text-gray-300" aria-hidden="true" />
          )}
          <span className="md:hidden">{staticRegion.name}</span>
          <span className="hidden md:inline">{staticRegion.fullName}</span>
          {isDeactivated && (
            <Pill color="red" className="text-[9px] tracking-wide uppercase">
              Deaktiviert
            </Pill>
          )}
        </div>
        <div className="text-xs text-gray-400">{productName.get(staticRegion.product)}</div>
      </div>
    </>
  )
}
