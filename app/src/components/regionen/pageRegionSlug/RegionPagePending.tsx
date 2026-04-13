import { useRef } from 'react'
import { isDev } from '@/components/shared/utils/isEnv'
import { RegionPagePendingHeader } from './RegionPagePendingHeader'
import { RegionPagePendingMapShell } from './RegionPagePendingMapShell'

export default function RegionPagePending() {
  const logged = useRef(false)
  if (isDev && !logged.current) {
    logged.current = true
    console.debug('[region] route pending UI shown')
  }

  return (
    <div
      className="flex h-screen min-h-0 w-full flex-col bg-white"
      aria-live="polite"
      aria-busy="true"
    >
      <RegionPagePendingHeader />
      <main className="z-0 min-h-0 grow">
        <RegionPagePendingMapShell />
      </main>
    </div>
  )
}
