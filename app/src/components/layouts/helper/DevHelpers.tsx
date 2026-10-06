import { TailwindResponsiveHelper } from '@/components/layouts/helper/TailwindResponsiveHelper'
import { TanStackAppDevtools } from '@/components/shared/devtools/TanStackAppDevtools'
import { isDev } from '@/components/shared/utils/isEnv'

export const DevHelpers = () => {
  if (!isDev) return null

  return (
    <div className="pointer-events-none fixed bottom-2 left-2 z-50 flex gap-3 print:hidden">
      <TanStackAppDevtools />
      <TailwindResponsiveHelper />
    </div>
  )
}
