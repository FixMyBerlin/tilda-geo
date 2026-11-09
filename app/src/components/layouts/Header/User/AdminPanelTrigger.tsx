import { ShieldCheckIcon } from '@heroicons/react/24/outline'
import { useQuery } from '@tanstack/react-query'
import { lazy, Suspense, useState } from 'react'
import { twMerge } from 'tailwind-merge'
import { mobileMapIconButtonClassName } from '@/components/regionen/pageRegionSlug/mobile/mobileControlButton.const'
import { isAdmin } from '@/components/shared/utils/usersUtils'
import { currentUserQueryOptions } from '@/server/users/currentUserQueryOptions'

const AdminPanelSheet = lazy(() => import('./AdminPanelSheet'))

type Variant = 'header' | 'mapControl'

type Props = {
  variant: Variant
}

const headerButtonClassName = twMerge(
  'rounded-full border border-pink-400 bg-pink-300 px-3 py-1.5 text-xs font-semibold text-pink-950',
  'hover:bg-pink-400 focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-gray-800 focus:outline-none',
)

export const AdminPanelTrigger = ({ variant }: Props) => {
  const { data } = useQuery(currentUserQueryOptions())
  const user = data?.user ?? null
  const [open, setOpen] = useState(false)
  // Stays true after the first open, so the sheet can animate out when closed.
  const [sheetMounted, setSheetMounted] = useState(false)

  if (!user || !isAdmin(user)) return null

  const isMapControl = variant === 'mapControl'

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setSheetMounted(true)
          setOpen(true)
        }}
        aria-label="Admin"
        aria-expanded={open}
        className={
          isMapControl
            ? twMerge(
                mobileMapIconButtonClassName,
                'border-pink-400 bg-pink-300 text-pink-900 hover:bg-pink-400 focus:ring-pink-500',
                open && 'border-pink-600 bg-pink-400',
              )
            : headerButtonClassName
        }
      >
        {isMapControl ? <ShieldCheckIcon className="size-6" aria-hidden="true" /> : 'Admin'}
      </button>

      {sheetMounted && (
        <Suspense fallback={null}>
          <AdminPanelSheet open={open} onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </>
  )
}
