import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid'
import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { twJoin, twMerge } from 'tailwind-merge'
import { buttonStylesSecondary } from '@/components/shared/links/styles'
import { compactPageNumbers } from '@/shared/pagination/compactPageNumbers'
import { toPaginationResult } from '@/shared/pagination/toPaginationResult'
import type { PaginatedList } from '@/shared/pagination/types'

type Props = {
  /** Server result of the current page (`paginate()`); `skip`/`take` are the effective values. */
  pagination: PaginatedList<unknown>
  /**
   * Scroll target after a page change, e.g. the id of the section around a table further down the
   * page. Without it the page scrolls to the top.
   */
  hash?: string
  className?: string
}

const focusClassName =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-500'

const stepClassName = twJoin(
  'relative inline-flex items-center gap-x-1 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-gray-300 ring-inset hover:bg-gray-50',
  focusClassName,
)

const disabledStepClassName =
  'relative inline-flex cursor-not-allowed items-center gap-x-1 rounded-md bg-white/50 px-3 py-2 text-sm font-semibold text-gray-400 ring-1 ring-gray-200 ring-inset'

const pageClassName = twJoin(
  'inline-flex min-w-9 items-center justify-center rounded-md px-2 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50',
  focusClassName,
)

const currentPageClassName = 'bg-white ring-1 ring-gray-300 ring-inset'

type PageLinkProps = {
  page: number
  hash?: string
  className: string
  children: ReactNode
  'aria-label'?: string
  'aria-current'?: 'page'
}

const PageLink = ({ page, hash, ...props }: PageLinkProps) => (
  <Link
    to="."
    // Normal history entry per page, so browser Back returns to the previous page.
    search={(prev: Record<string, unknown>) => ({ ...prev, page })}
    hash={hash}
    {...props}
  />
)

/**
 * Footer for paginated admin tables (`<AdminTable footer={…}>`): links to `?page=n` of the current
 * route, keeping the other search params. Renders nothing when everything fits on one page.
 */
export const AdminPagination = ({ pagination, hash, className }: Props) => {
  const { from, to, count, page, pageCount, hasMore } = toPaginationResult({
    skip: pagination.skip,
    take: pagination.take,
    total: pagination.total,
    rowCount: pagination.rows.length,
  })

  if (pageCount <= 1) return null

  return (
    <nav
      aria-label="Seitennummerierung"
      className={twMerge(
        'flex items-center justify-between gap-x-4 border-t border-gray-200 bg-white px-4 py-3 sm:px-6',
        className,
      )}
    >
      <p className="hidden text-sm text-gray-700 xl:block">
        Zeige <span className="font-medium">{from}</span> bis{' '}
        <span className="font-medium">{to}</span> von{' '}
        <span className="font-medium">{count.toLocaleString('de-DE')}</span> Einträgen
      </p>
      <div className="flex flex-1 items-center justify-between gap-x-3 xl:flex-none xl:justify-end">
        {page > 1 ? (
          <PageLink page={page - 1} hash={hash} className={stepClassName}>
            <ChevronLeftIcon aria-hidden="true" className="-ml-1 size-4" />
            Zurück
          </PageLink>
        ) : (
          <span className={disabledStepClassName}>
            <ChevronLeftIcon aria-hidden="true" className="-ml-1 size-4" />
            Zurück
          </span>
        )}
        <span className="text-sm text-gray-700 sm:hidden">
          Seite {page} von {pageCount}
        </span>
        <span className="hidden items-center gap-x-1 sm:flex">
          {compactPageNumbers(page, pageCount).map((item, index) =>
            item === 'gap' ? (
              <span
                // Gaps have no identity of their own; at most two per bar.
                key={`gap-${index}`}
                aria-hidden="true"
                className="w-9 text-center text-sm font-semibold text-gray-500 select-none"
              >
                …
              </span>
            ) : (
              <PageLink
                key={item}
                page={item}
                hash={hash}
                aria-label={`Seite ${item}`}
                aria-current={item === page ? 'page' : undefined}
                className={twJoin(pageClassName, item === page && currentPageClassName)}
              >
                {item}
              </PageLink>
            ),
          )}
        </span>
        {hasMore ? (
          <PageLink page={page + 1} hash={hash} className={stepClassName}>
            Weiter
            <ChevronRightIcon aria-hidden="true" className="-mr-1 size-4" />
          </PageLink>
        ) : (
          <span className={disabledStepClassName}>
            Weiter
            <ChevronRightIcon aria-hidden="true" className="-mr-1 size-4" />
          </span>
        )}
      </div>
    </nav>
  )
}

/** Empty-state action for a list opened past its last page (`?page=n` with no rows at all left). */
export const AdminFirstPageLink = () => (
  <PageLink page={1} className={buttonStylesSecondary}>
    Zur ersten Seite
  </PageLink>
)
