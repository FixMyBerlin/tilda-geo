import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { PageNoteFolders } from '@/components/admin/note-folders/PageNoteFolders'
import { optionalSearchString } from '@/lib/searchParamsSchema'
import { getAdminNoteFoldersLoaderFn } from '@/server/admin/admin.functions'

const noteFoldersSearchSchema = z.object({
  regionSlug: optionalSearchString().catch(undefined),
})

export const Route = createFileRoute('/admin/note-folders/')({
  ssr: true,
  validateSearch: noteFoldersSearchSchema,
  loaderDeps: ({ search }) => ({ regionSlug: search.regionSlug }),
  // Region filter options (`AdminRegionFilter`) load once in the parent `/admin` route.
  loader: ({ deps }) => getAdminNoteFoldersLoaderFn({ data: deps }),
  head: () => ({
    meta: [{ title: 'Hinweis-Ordner – ADMIN TILDA' }],
  }),
  component: PageNoteFolders,
})
