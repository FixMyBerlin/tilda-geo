import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
import { PageMapDatasetUploads } from '@/components/admin/map-dataset-uploads/PageMapDatasetUploads'
import { mapDatasetUploadsSearchSchema } from '@/lib/mapDatasetUploadsSearchSchema'
import { getAdminUploadsLoaderFn } from '@/server/admin/admin.functions'
import { pageSearchDefaults } from '@/shared/pagination/pageSearchSchema'

export const Route = createFileRoute('/admin/map-dataset-uploads/')({
  ssr: true,
  validateSearch: mapDatasetUploadsSearchSchema,
  search: { middlewares: [stripSearchParams(pageSearchDefaults)] },
  loaderDeps: ({ search }) => search,
  // Region filter options (`AdminRegionFilter`) load once in the parent `/admin` route.
  loader: ({ deps }) => getAdminUploadsLoaderFn({ data: deps }),
  head: () => ({
    meta: [{ title: 'Uploads – ADMIN TILDA' }],
  }),
  component: PageMapDatasetUploads,
})
