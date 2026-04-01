import { BuildingLibraryIcon } from '@heroicons/react/24/outline'
import { Link } from '@tanstack/react-router'
import { Img } from '@/components/shared/Img'
import type { TRegion } from '@/server/regions/queries/getRegion.server'

type Props = { region: TRegion }

export const RegionTeaser = ({ region }: Props) => {
  const customLogo = region.logoPath || region.externalLogoPath

  return (
    <Link to="/regionen/$regionSlug" params={{ regionSlug: region.slug }}>
      <div
        key={region.slug}
        className="group relative border-r border-b border-gray-200 px-4 pt-4 hover:bg-yellow-50 sm:px-6 sm:pt-6"
      >
        <div className="aspect-auto h-20 overflow-hidden rounded-lg border border-gray-200 bg-white group-hover:opacity-75">
          <span className="flex h-full w-full items-center justify-center object-cover object-center py-2">
            {customLogo && region.externalLogoPath && (
              <Img src={region.externalLogoPath} className="max-h-full w-auto" alt="" />
            )}
            {customLogo && region.logoPath && (
              <Img src={region.logoPath} className="max-h-full w-auto" alt="" />
            )}
            {!customLogo && <BuildingLibraryIcon className="block h-20 w-auto" />}
          </span>
        </div>
        <h3 className="flex min-h-32 items-center justify-center text-center text-xl leading-tight font-medium text-gray-900">
          TILDA <br />
          {region.fullName}
        </h3>
      </div>
    </Link>
  )
}
