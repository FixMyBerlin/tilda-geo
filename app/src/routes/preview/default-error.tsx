import { createFileRoute } from '@tanstack/react-router'
import DefaultError from '@/components/shared/error/DefaultError'

export const Route = createFileRoute('/preview/default-error')({
  ssr: true,
  component: PreviewDefaultError,
})

function PreviewDefaultError() {
  return <DefaultError error={new Error('Route error preview (non-production)')} reset={() => {}} />
}
