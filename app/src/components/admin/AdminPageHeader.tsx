import { ChevronLeftIcon } from '@heroicons/react/20/solid'
import type { ReactNode } from 'react'
import { adminPageTitleClassName } from '@/components/admin/adminClasses'
import { Link } from '@/components/shared/links/Link'
import type { InternalPath } from '@/router'

type AdminPageHeaderParent = {
  label: string
  to: InternalPath
  params?: Record<string, string>
  search?: Record<string, string>
}

type Props = {
  title: ReactNode
  /** Back crumb to the parent list (new / edit / detail pages). */
  parent?: AdminPageHeaderParent
  /** Right slot. List pages: the create action (e.g. “Neue Region”). Edit pages: none — their form actions live in the aside. */
  action?: ReactNode
  intro?: ReactNode
}

export const AdminPageHeader = ({ title, parent, action, intro }: Props) => {
  return (
    <header className="mb-8">
      {parent ? (
        <Link
          to={parent.to}
          params={parent.params}
          search={parent.search}
          classNameOverwrite="mb-2 inline-flex items-center gap-x-1 text-sm font-medium text-gray-500 no-underline hover:text-gray-700"
        >
          <ChevronLeftIcon aria-hidden="true" className="-ml-1 size-5 shrink-0" />
          {parent.label}
        </Link>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className={adminPageTitleClassName}>{title}</h1>
        {action ? <div className="flex shrink-0 items-center gap-x-3">{action}</div> : null}
      </div>
      {intro ? <div className="mt-2 max-w-3xl text-sm/6 text-gray-600">{intro}</div> : null}
    </header>
  )
}
