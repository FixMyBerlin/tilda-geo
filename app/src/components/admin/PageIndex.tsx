import { ChevronRightIcon } from '@heroicons/react/20/solid'
import { twMerge } from 'tailwind-merge'
import { AdminPrivateHooksSection } from '@/components/admin/AdminPrivateHooksSection'
import { Breadcrumb } from '@/components/admin/Breadcrumb'
import { HeaderWrapper } from '@/components/admin/HeaderWrapper'
import { Disclosure } from '@/components/regionen/pageRegionSlug/SidebarInspector/Disclosure/Disclosure'
import { Link } from '@/components/shared/links/Link'
import { isProd } from '@/components/shared/utils/isEnv'
import {
  DEV_ERROR_PREVIEW_DEFAULT_REGION_SLUG,
  devRegionErrorPreviewHref,
} from '@/dev/errorPreviews'
import type { InternalPath } from '@/router'

const rowLinkClassName = twMerge(
  'flex w-full items-center justify-between gap-x-6 px-4 py-4 no-underline transition-colors sm:px-6',
  'hover:bg-gray-50',
)

const items = [
  { to: '/admin/regions', label: 'Regionen' },
  { to: '/admin/qa-configs', label: 'QA Konfigurationen' },
  { to: '/admin/memberships', label: 'Nutzer:innen & Mitgliedschaften' },
  { to: '/admin/uploads', label: 'Uploads' },
] satisfies { to: InternalPath; label: string }[]

const errorPreviewItems = [
  { to: '/preview/default-error', label: 'Standard Route-Fehler (DefaultError)' },
  { to: '/preview/not-found', label: 'Nicht gefunden (NotFound)' },
  { to: '/preview/root-fallback', label: 'Root ErrorBoundary-Fallback' },
  { to: '/preview/region-error', label: 'Region-Fehler (Komponente)' },
  { to: '/preview/default-pending', label: 'Standard Pending' },
  { to: '/preview/region-pending', label: 'Region-Karte Pending (Skeleton)' },
] satisfies { to: InternalPath; label: string }[]

export function PageIndex() {
  return (
    <>
      <HeaderWrapper>
        <Breadcrumb pages={[]} />
      </HeaderWrapper>

      <ul
        className={twMerge(
          'not-prose divide-y divide-gray-900/10 overflow-hidden',
          'rounded-xl bg-white/90 shadow-sm ring-1 ring-gray-900/5',
        )}
      >
        {items.map((item) => (
          <li key={item.to}>
            <Link to={item.to} classNameOverwrite={rowLinkClassName}>
              <span className="text-sm/6 font-semibold text-gray-900">{item.label}</span>
              <ChevronRightIcon aria-hidden className="size-5 shrink-0 text-gray-400" />
            </Link>
          </li>
        ))}
      </ul>

      <AdminPrivateHooksSection />

      {!isProd ? (
        <>
          <hr className={twMerge('not-prose my-10 border-0 border-t border-gray-900/10')} />
          <Disclosure title="Fehler-UI (nur Dev / Staging)" defaultOpen={false}>
            <div className="p-3">
              <ul
                className={twMerge(
                  'not-prose divide-y divide-gray-900/10 overflow-hidden',
                  'rounded-xl bg-white/90 shadow-sm ring-1 ring-gray-900/5',
                )}
              >
                {errorPreviewItems.map((item) => (
                  <li key={item.to}>
                    <Link to={item.to} classNameOverwrite={rowLinkClassName}>
                      <span className="text-sm/6 font-semibold text-gray-900">{item.label}</span>
                      <ChevronRightIcon aria-hidden className="size-5 shrink-0 text-gray-400" />
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href={devRegionErrorPreviewHref(DEV_ERROR_PREVIEW_DEFAULT_REGION_SLUG)}
                    classNameOverwrite={rowLinkClassName}
                  >
                    <span className="text-sm/6 font-semibold text-gray-900">
                      {`Region-Fehler (Route, ${DEV_ERROR_PREVIEW_DEFAULT_REGION_SLUG}?__regionError=1)`}
                    </span>
                    <ChevronRightIcon aria-hidden className="size-5 shrink-0 text-gray-400" />
                  </Link>
                </li>
              </ul>
            </div>
          </Disclosure>
        </>
      ) : null}
    </>
  )
}
