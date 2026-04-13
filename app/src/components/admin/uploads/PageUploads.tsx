import { getRouteApi } from '@tanstack/react-router'
import { Breadcrumb } from '@/components/admin/Breadcrumb'
import { HeaderWrapper } from '@/components/admin/HeaderWrapper'
import { UploadsTable } from './pageUploads/UploadsTable'

const routeApi = getRouteApi('/admin/uploads/')

export function PageUploads() {
  const { uploads } = routeApi.useLoaderData()

  return (
    <>
      <HeaderWrapper>
        <Breadcrumb pages={[{ href: '/admin/uploads', name: 'Uploads' }]} />
      </HeaderWrapper>

      <UploadsTable uploads={uploads} />
    </>
  )
}
