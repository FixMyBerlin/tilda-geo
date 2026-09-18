import { useSuspenseQuery } from '@tanstack/react-query'
import { twJoin } from 'tailwind-merge'
import { adminCardClassName } from '@/components/admin/adminClasses'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { adminNavLeaves } from '@/components/admin/navigation/adminNavigation'
import { Link } from '@/components/shared/links/Link'
import { adminNavCountsQueryOptions } from '@/server/admin/adminNavQueryOptions'

const cardLinkClassName = twJoin(
  adminCardClassName,
  'group flex h-full items-start gap-x-4 p-5 no-underline transition-shadow',
  'hover:shadow-md hover:ring-gray-900/10 focus-visible:ring-2 focus-visible:ring-yellow-500 focus-visible:outline-none',
)

export function PageIndex() {
  const { data: counts } = useSuspenseQuery(adminNavCountsQueryOptions())

  return (
    <>
      <AdminPageHeader title="Übersicht" />

      <ul role="list" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {adminNavLeaves().map((leaf) => {
          const Icon = leaf.icon
          const count = leaf.countKey ? counts[leaf.countKey] : undefined

          return (
            <li key={leaf.to}>
              <Link to={leaf.to} classNameOverwrite={cardLinkClassName}>
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-gray-800">
                  <Icon aria-hidden="true" className="size-6 text-white" />
                </span>
                <span className="min-w-0 flex-1">
                  {leaf.groupName ? (
                    <span className="block text-xs/5 font-medium text-gray-500">
                      {leaf.groupName}
                    </span>
                  ) : null}
                  <span className="block text-base/6 font-semibold text-gray-900 group-hover:text-yellow-700">
                    {leaf.name}
                  </span>
                  {leaf.description ? (
                    <span className="mt-1 block text-sm/5 text-gray-600">{leaf.description}</span>
                  ) : null}
                </span>
                {count === undefined ? null : (
                  <span className="shrink-0 text-2xl font-semibold text-gray-900 tabular-nums">
                    {count.toLocaleString('de-DE')}
                  </span>
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </>
  )
}
