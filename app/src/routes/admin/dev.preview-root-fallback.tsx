import { createFileRoute } from '@tanstack/react-router'
import { RootErrorFallback } from '@/components/shared/error/ErrorBoundary'
import { assertNonProdErrorPreviewRoute } from '@/dev/errorPreviews'

export const Route = createFileRoute('/admin/dev/preview-root-fallback')({
  ssr: true,
  beforeLoad: () => {
    assertNonProdErrorPreviewRoute()
  },
  component: DevPreviewRootFallback,
})

function DevPreviewRootFallback() {
  return (
    <RootErrorFallback
      error={new Error('Root error fallback preview (non-production)')}
      reset={() => {}}
    />
  )
}
