import { createFileRoute } from '@tanstack/react-router'
import { LayoutHome } from '@/components/pages/LayoutHome'

export const Route = createFileRoute('/_home')({
  ssr: true,
  component: LayoutHome,
})
