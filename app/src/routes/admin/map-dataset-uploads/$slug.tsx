import { createFileRoute } from '@tanstack/react-router'
import { PageMapDatasetUpload } from '@/components/admin/map-dataset-uploads/PageMapDatasetUpload'
import { getAdminUploadLoaderFn } from '@/server/admin/admin.functions'

export const Route = createFileRoute('/admin/map-dataset-uploads/$slug')({
  ssr: true,
  loader: async ({ params }) => {
    return await getAdminUploadLoaderFn({ data: { slug: params.slug } })
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [] }
    return {
      meta: [{ title: `Upload ${loaderData.upload.slug} – ADMIN TILDA` }],
    }
  },
  component: PageMapDatasetUpload,
})
