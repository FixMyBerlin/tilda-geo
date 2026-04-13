import { createFileRoute } from '@tanstack/react-router'
import { LayoutRegionen } from '@/components/regionen/LayoutRegionen'

export const Route = createFileRoute('/regionen')({
  ssr: true,
  component: LayoutRegionen,
})
