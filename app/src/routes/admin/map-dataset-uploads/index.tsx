import { createFileRoute } from '@tanstack/react-router'
import { PageMapDatasetUploads } from '@/components/admin/map-dataset-uploads/PageMapDatasetUploads'
import { mapDatasetUploadsSearchSchema } from '@/lib/mapDatasetUploadsSearchSchema'
import { getAdminUploadsLoaderFn } from '@/server/admin/admin.functions'

export const Route = createFileRoute('/admin/map-dataset-uploads/')({
  ssr: true,
  validateSearch: (search) => mapDatasetUploadsSearchSchema.parse(search),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => getAdminUploadsLoaderFn({ data: deps }),
  head: () => ({
    meta: [{ title: 'Uploads – ADMIN TILDA' }],
  }),
  component: PageMapDatasetUploads,
})
