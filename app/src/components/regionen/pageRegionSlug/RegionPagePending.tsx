import { useEffect } from 'react'
import { isDev } from '@/components/shared/utils/isEnv'
import { RegionPagePendingHeader } from './RegionPagePendingHeader'
import { RegionPagePendingMapShell } from './RegionPagePendingMapShell'

export default function RegionPagePending() {
  useEffect(function logRegionPendingInDev() {
    if (isDev) console.debug('[region] route pending UI shown')
  }, [])

  return (
    <div
      className="flex h-dvh min-h-0 w-full flex-col bg-white"
      aria-live="polite"
      aria-busy="true"
    >
      {/* Dark header is desktop-only; mobile shows the floating-button skeleton (see RegionPagePendingMapShell). */}
      <div className="hidden sm:block">
        <RegionPagePendingHeader />
      </div>
      <main className="z-0 min-h-0 grow">
        <RegionPagePendingMapShell />
      </main>
    </div>
  )
}
