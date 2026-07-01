import { createFileRoute } from '@tanstack/react-router'
import { LayoutPages } from '@/components/layouts/LayoutPages'

export const Route = createFileRoute('/_pages')({
  ssr: true,
  component: LayoutPages,
})
