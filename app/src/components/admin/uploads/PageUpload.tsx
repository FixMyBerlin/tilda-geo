import { getRouteApi } from '@tanstack/react-router'
import { AdminUploadClient } from './pageUploads/AdminUploadClient'

const routeApi = getRouteApi('/admin/uploads/$slug')

export function PageUpload() {
  const { upload } = routeApi.useLoaderData()
  return <AdminUploadClient upload={upload} />
}
