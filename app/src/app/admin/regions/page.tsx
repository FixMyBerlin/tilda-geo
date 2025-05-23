import { Link } from '@/src/app/_components/links/Link'
import { invoke } from '@/src/blitz-server'
import getRegionsWithAdditionalData from '@/src/server/regions/queries/getRegionsWithAdditionalData'
import { Metadata } from 'next'
import { Breadcrumb } from '../_components/Breadcrumb'
import { HeaderWrapper } from '../_components/HeaderWrapper'
import { MissingRegions } from './_components/MissingRegions'
import { RegionsTable } from './_components/RegionsTable'

export const metadata: Metadata = {
  title: 'Regionen',
}

export default async function AdminRegionsPage() {
  const regions = await invoke(getRegionsWithAdditionalData, {})

  return (
    <>
      <HeaderWrapper>
        <Breadcrumb pages={[{ href: '/admin/regions', name: 'Regionen' }]} />
        <Link href="/admin/regions/new" button>
          Neue Region
        </Link>
      </HeaderWrapper>

      <RegionsTable regions={regions} />
      <MissingRegions regions={regions} />
    </>
  )
}
