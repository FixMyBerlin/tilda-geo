import { createFileRoute } from '@tanstack/react-router'
import DefaultPending from '@/components/shared/error/DefaultPending'

export const Route = createFileRoute('/preview/default-pending')({
  ssr: true,
  component: DefaultPending,
})
