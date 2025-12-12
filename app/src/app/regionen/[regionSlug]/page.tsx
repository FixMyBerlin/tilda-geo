import { getBlitzContext, invoke } from '@/src/blitz-server'
import { productName } from '@/src/data/tildaProductNames.const'
import { checkRegionAuthorization } from '@/src/server/authorization/checkRegionAuthorization'
import getRegion from '@/src/server/regions/queries/getRegion'
import { trackRegionAccess } from '@/src/server/users/trackRegionAccess'
import { DevMiddlewareHostnameWorkaround } from './_components/DevMiddlewareHostnameWorkaround'
import { MapInterface } from './_components/MapInterface'
import { RegionAccessDenied } from './_components/RegionDeactivated'

export async function generateMetadata({ params }) {
  const region = await invoke(getRegion, { slug: params.regionSlug })

  return {
    robots: 'noindex',
    title: { absolute: `${region?.fullName} — ${productName.get(region.product)}` },
  }
}

// This page will always initialize with a `map` an `config` param, courtesy of ./middleware.ts
export default async function RegionPage({ params }: { params: { regionSlug: string } }) {
  const region = await invoke(getRegion, { slug: params.regionSlug })
  const { session } = await getBlitzContext()
  const { isAuthorized } = await checkRegionAuthorization(session, params.regionSlug)

  await trackRegionAccess(params.regionSlug)

  if (!isAuthorized) {
    return <RegionAccessDenied status={region.status} />
  }

  return (
    <>
      <DevMiddlewareHostnameWorkaround />
      <MapInterface />
    </>
  )
}
