import { createFileRoute } from '@tanstack/react-router'
import DefaultPending from '@/components/shared/error/DefaultPending'
import { assertNonProdErrorPreviewRoute } from '@/dev/errorPreviews'

export const Route = createFileRoute('/admin/dev/preview-pending')({
  ssr: true,
  beforeLoad: () => {
    assertNonProdErrorPreviewRoute()
  },
  component: DefaultPending,
})
