import { createFileRoute } from '@tanstack/react-router'
import { PageMapDatasetUploads } from '@/components/admin/map-dataset-uploads/PageMapDatasetUploads'
import { getAdminUploadsLoaderFn } from '@/server/admin/admin.functions'
import { createOffsetSearchSchema } from '@/shared/pagination/offsetSearchSchema'

const uploadsSearchSchema = createOffsetSearchSchema({ maxTake: 200 })

export const Route = createFileRoute('/admin/map-dataset-uploads/')({
  ssr: true,
  validateSearch: (search) => uploadsSearchSchema.parse(search),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => getAdminUploadsLoaderFn({ data: deps }),
  head: () => ({
    meta: [{ title: 'Uploads – ADMIN TILDA' }],
  }),
  component: PageMapDatasetUploads,
})
