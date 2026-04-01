import { createFileRoute, notFound } from '@tanstack/react-router'
import { assertNonProdErrorPreviewRoute } from '@/dev/errorPreviews'

export const Route = createFileRoute('/admin/dev/not-found')({
  ssr: true,
  beforeLoad: () => {
    assertNonProdErrorPreviewRoute()
  },
  loader: () => {
    throw notFound()
  },
  component: () => null,
})
