import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { ArrowTopRightOnSquareIcon, EllipsisVerticalIcon } from '@heroicons/react/20/solid'
import type { ComponentType, ReactNode } from 'react'
import { twJoin } from 'tailwind-merge'
import { adminAsideIconButtonClassName } from '@/components/admin/adminClasses'
import { Link } from '@/components/shared/links/Link'
import type { InternalPath } from '@/router'
import { AdminAsideVariantContext, useAdminAsideVariant } from './adminAsideSection'

/** Internal link target for aside / table actions. */
export type AdminLinkTarget = {
  to: InternalPath
  params?: Record<string, string>
  search?: Record<string, unknown>
}

type Props = {
  /** Main action(s), e.g. submit + cancel (`AdminFormAsideActions`) or “Zur Liste”. */
  primary?: ReactNode
  /** Status below the primary action (unsaved changes, validation hints). */
  status?: ReactNode
  /** `AdminAsideLink`s; on mobile collected in an overflow menu. */
  secondary?: ReactNode
  /** `AdminDeleteButton` — a row below the secondary list (after a divider); icon next to the bar on mobile. Never on “new” pages. */
  destructive?: ReactNode
}

/** Aside action card for pages without a form (detail pages); forms use `AdminFormAsideActions`. */
export const AdminAsideActions = ({ primary, status, secondary, destructive }: Props) => {
  const variant = useAdminAsideVariant()

  if (variant !== 'desktop') {
    return (
      <>
        {status}
        {primary}
        {secondary ? (
          <Menu as="div" className="relative">
            <MenuButton className={adminAsideIconButtonClassName}>
              <EllipsisVerticalIcon aria-hidden="true" className="size-5" />
              <span className="sr-only">Weitere Aktionen</span>
            </MenuButton>
            <MenuItems
              anchor="bottom end"
              className="z-40 w-56 rounded-md bg-white py-1 shadow-lg ring-1 ring-gray-900/5 [--anchor-gap:4px] focus:outline-none"
            >
              <AdminAsideVariantContext value="mobileMenu">{secondary}</AdminAsideVariantContext>
            </MenuItems>
          </Menu>
        ) : null}
        {destructive}
      </>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {primary ? <div className="flex flex-col gap-2">{primary}</div> : null}
      {status}
      {secondary ? <div className="-mx-2 flex flex-col">{secondary}</div> : null}
      {destructive ? (
        <>
          <hr className="border-gray-200" />
          {destructive}
        </>
      ) : null}
    </div>
  )
}

/** An external/API route (plain `<a>`, e.g. a CSV download) instead of an internal `AdminLinkTarget`. */
type AdminAsideLinkHref = { href: string; download?: boolean | string }

type AdminAsideLinkProps = (AdminLinkTarget | AdminAsideLinkHref) & {
  icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' }>
  children: string
  /** Opens in a new tab (e.g. the public map). Ignored for `href` targets. */
  blank?: boolean
  /** Rows behind the link (e.g. region-filtered list); shown as a pill, `0` muted, capped at `99+`. */
  count?: number
}

const isHrefTarget = (target: AdminLinkTarget | AdminAsideLinkHref): target is AdminAsideLinkHref =>
  'href' in target

const AdminAsideCountPill = ({ count }: { count: number }) => (
  <span
    aria-hidden="true"
    className={twJoin(
      'ml-auto shrink-0 rounded-full bg-gray-100 px-2 text-xs/5 font-medium tabular-nums',
      count === 0 ? 'text-gray-400' : 'text-gray-600',
    )}
  >
    {count > 99 ? '99+' : count}
  </span>
)

const desktopLinkClassName =
  'group flex items-center gap-x-2 rounded-md px-2 py-1.5 text-sm font-medium text-gray-700 no-underline hover:bg-gray-50 hover:text-gray-900'
const menuLinkClassName =
  'flex items-center gap-x-2 px-3 py-2 text-sm text-gray-700 no-underline data-focus:bg-gray-50 data-focus:text-gray-900'

/** Secondary aside action: text row (desktop), overflow menu entry (mobile). */
export const AdminAsideLink = ({
  icon: Icon,
  children,
  blank,
  count,
  ...target
}: AdminAsideLinkProps) => {
  const variant = useAdminAsideVariant()
  const isHref = isHrefTarget(target)
  const isMobile = variant === 'mobile'
  const isMenu = variant === 'mobileMenu'
  const label = (
    <>
      {children}
      {count !== undefined ? <span className="sr-only"> ({count})</span> : null}
      {blank && !isHref ? <span className="sr-only"> (öffnet in neuem Fenster)</span> : null}
    </>
  )

  const content = isMobile ? (
    <>
      <Icon aria-hidden="true" className="size-5" />
      <span className="sr-only">{label}</span>
    </>
  ) : (
    <>
      <Icon
        aria-hidden="true"
        className={twJoin('size-5 shrink-0 text-gray-400', !isMenu && 'group-hover:text-gray-500')}
      />
      <span className="min-w-0 flex-1">{label}</span>
      {count !== undefined ? <AdminAsideCountPill count={count} /> : null}
      {blank && !isHref && !isMenu ? (
        <ArrowTopRightOnSquareIcon aria-hidden="true" className="size-4 shrink-0 text-gray-400" />
      ) : null}
    </>
  )

  const className = isMobile
    ? adminAsideIconButtonClassName
    : isMenu
      ? menuLinkClassName
      : desktopLinkClassName
  const link = isHref ? (
    <a {...target} className={className}>
      {content}
    </a>
  ) : (
    <Link {...target} blank={blank} classNameOverwrite={className}>
      {content}
    </Link>
  )

  return isMenu ? <MenuItem>{link}</MenuItem> : link
}
