import { getRouteApi } from '@tanstack/react-router'
import { AdminMapDatasetUploadClient } from './pageMapDatasetUploads/AdminMapDatasetUploadClient'

const routeApi = getRouteApi('/admin/map-dataset-uploads/$slug')

export function PageMapDatasetUpload() {
  const { upload, auditHistory } = routeApi.useLoaderData()
  return <AdminMapDatasetUploadClient upload={upload} auditHistory={auditHistory} />
}
