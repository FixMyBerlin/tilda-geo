import { createFileRoute, notFound, Outlet } from '@tanstack/react-router'
import { isProd } from '@/components/shared/utils/isEnv'

export const Route = createFileRoute('/preview')({
  ssr: true,
  beforeLoad: () => {
    if (isProd) throw notFound()
  },
  head: () => ({
    meta: [{ name: 'robots', content: 'noindex' }],
  }),
  component: PreviewLayout,
})

function PreviewLayout() {
  return <Outlet />
}
