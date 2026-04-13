import { createFileRoute } from '@tanstack/react-router'
import { RootErrorFallback } from '@/components/shared/error/ErrorBoundary'

export const Route = createFileRoute('/preview/root-fallback')({
  ssr: true,
  component: PreviewRootFallback,
})

function PreviewRootFallback() {
  return (
    <RootErrorFallback
      error={new Error('Root error fallback preview (non-production)')}
      reset={() => {}}
    />
  )
}
