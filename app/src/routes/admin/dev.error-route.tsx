import { createFileRoute } from '@tanstack/react-router'
import { assertNonProdErrorPreviewRoute } from '@/dev/errorPreviews'

export const Route = createFileRoute('/admin/dev/error-route')({
  ssr: true,
  beforeLoad: () => {
    assertNonProdErrorPreviewRoute()
  },
  loader: () => {
    throw new Error('Route error preview (non-production)')
  },
  component: () => null,
})
