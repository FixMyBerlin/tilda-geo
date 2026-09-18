import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react'
import { ArrowTopRightOnSquareIcon, ChevronRightIcon } from '@heroicons/react/20/solid'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Link, useLocation } from '@tanstack/react-router'
import { twJoin } from 'tailwind-merge'
import { adminNavCountsQueryOptions } from '@/server/admin/adminNavQueryOptions'
import type { AdminNavCounts } from '@/server/admin/queries/getAdminNavCounts.server'
import { AdminBrand } from './AdminBrand'
import {
  type AdminNavGroup,
  type AdminNavLink,
  type AdminNavSubgroup,
  activeAdminNavToPath,
  adminNavigation,
  formatAdminNavCount,
  isAdminNavGroupActive,
} from './adminNavigation'
import { AdminRegionCombobox } from './AdminRegionCombobox'
import { adminSidebarItemClassName as navItemClassName } from './adminSidebarClasses'
import { AdminSidebarUser } from './AdminSidebarUser'

const navIconClassName =
  'size-6 shrink-0 text-gray-400 group-hover:text-white group-data-[status=active]:text-white'

const chevronClassName =
  'ml-auto size-5 shrink-0 text-gray-400 transition-transform group-hover:text-white group-data-open:rotate-90'

type Props = {
  /** Closes the mobile drawer after picking a link. */
  onNavigate?: () => void
}

const NavCountPill = ({ label }: { label: string | null }) => {
  if (!label) return null
  return (
    <span
      aria-hidden="true"
      className="ml-auto w-9 min-w-max rounded-full bg-gray-700 px-2.5 py-0.5 text-center text-xs/5 font-medium whitespace-nowrap text-white ring-1 ring-gray-600 ring-inset"
    >
      {label}
    </span>
  )
}

const NavLeafLink = ({
  link,
  counts,
  isActive,
  indent,
  onNavigate,
  children,
}: {
  link: AdminNavLink
  counts: AdminNavCounts
  /**
   * Overrides the router's own (fuzzy, prefix-based) active detection: `/admin/processing` and
   * `/admin/processing/hooks` are siblings, so the router's default fuzzy match would highlight
   * both on the hooks page. `exact: true` below keeps the router from asserting its own status
   * for this shared prefix; `activeAdminNavToPath` decides the single winner instead.
   */
  isActive: boolean
  indent?: boolean
  onNavigate?: () => void
  children?: React.ReactNode
}) => (
  <Link
    to={link.to}
    activeOptions={{ exact: true }}
    data-status={isActive ? 'active' : undefined}
    aria-current={isActive ? 'page' : undefined}
    onClick={onNavigate}
    className={twJoin(navItemClassName, indent && 'py-1.5 pl-11')}
  >
    {children}
    <span className="truncate">{link.name}</span>
    <NavCountPill label={formatAdminNavCount(counts, link.countKey)} />
  </Link>
)

const NavSubgroup = ({ subgroup }: { subgroup: AdminNavSubgroup }) => (
  <Disclosure as="div">
    <DisclosureButton className={twJoin(navItemClassName, 'py-1.5 pl-11')}>
      <span className="truncate">{subgroup.name}</span>
      <ChevronRightIcon aria-hidden="true" className={chevronClassName} />
    </DisclosureButton>
    <DisclosurePanel as="ul" className="mt-1 space-y-1">
      {subgroup.links.map((link) => (
        <li key={link.href}>
          <a
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className={twJoin(navItemClassName, 'py-1 pl-14 text-xs/5 font-medium')}
          >
            <span className="truncate">{link.name}</span>
            <ArrowTopRightOnSquareIcon aria-hidden="true" className="ml-auto size-4 shrink-0" />
            <span className="sr-only"> (neues Fenster)</span>
          </a>
        </li>
      ))}
    </DisclosurePanel>
  </Disclosure>
)

const NavGroup = ({
  group,
  counts,
  pathname,
  activeToPath,
  onNavigate,
}: {
  group: AdminNavGroup
  counts: AdminNavCounts
  pathname: string
  activeToPath: string | null
  onNavigate?: () => void
}) => {
  const active = isAdminNavGroupActive(pathname, group)
  const Icon = group.icon

  return (
    // `defaultOpen` only applies on mount; re-key so navigating into a group (e.g. via a dashboard card) opens it.
    <Disclosure key={String(active)} as="div" defaultOpen={active}>
      <DisclosureButton className={navItemClassName}>
        <Icon aria-hidden="true" className={navIconClassName} />
        <span className="truncate">{group.name}</span>
        <ChevronRightIcon aria-hidden="true" className={chevronClassName} />
      </DisclosureButton>
      <DisclosurePanel as="ul" className="mt-1 space-y-1">
        {group.children.map((child) => (
          <li key={child.name}>
            {'to' in child ? (
              <NavLeafLink
                link={child}
                counts={counts}
                isActive={child.to === activeToPath}
                indent
                onNavigate={onNavigate}
              />
            ) : (
              <NavSubgroup subgroup={child} />
            )}
          </li>
        ))}
      </DisclosurePanel>
    </Disclosure>
  )
}

export const AdminSidebar = ({ onNavigate }: Props) => {
  const { data: counts } = useSuspenseQuery(adminNavCountsQueryOptions())
  const pathname = useLocation({ select: (location) => location.pathname })
  const activeToPath = activeAdminNavToPath(pathname)

  return (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-800 px-6">
      <div className="flex h-16 shrink-0 items-center">
        <AdminBrand />
      </div>
      <nav aria-label="Admin" className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <div className="-mx-2">
              <AdminRegionCombobox onNavigate={onNavigate} />
            </div>
            <div className="mt-5 border-t border-white/10" />
            <ul role="list" className="-mx-2 mt-5 space-y-1">
              {adminNavigation.map((item) => (
                <li key={item.name}>
                  {'children' in item ? (
                    <NavGroup
                      group={item}
                      counts={counts}
                      pathname={pathname}
                      activeToPath={activeToPath}
                      onNavigate={onNavigate}
                    />
                  ) : (
                    <NavLeafLink
                      link={item}
                      counts={counts}
                      isActive={item.to === activeToPath}
                      onNavigate={onNavigate}
                    >
                      <item.icon aria-hidden="true" className={navIconClassName} />
                    </NavLeafLink>
                  )}
                </li>
              ))}
            </ul>
          </li>
          <li className="-mx-6 mt-auto">
            <AdminSidebarUser />
          </li>
        </ul>
      </nav>
    </div>
  )
}
