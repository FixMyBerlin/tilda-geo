import { HomeIcon } from '@heroicons/react/20/solid'
import { useRouter } from '@tanstack/react-router'
import { twJoin } from 'tailwind-merge'

export type TBreadcrumb = { href: string; name: string }
type Props = { pages: TBreadcrumb[] }

const separator = (
  <svg
    fill="currentColor"
    viewBox="0 0 24 44"
    preserveAspectRatio="none"
    aria-hidden="true"
    className="h-full w-6 shrink-0 text-gray-200"
  >
    <path d="M.293 0l22 22-22 22h1.414l22-22-22-22H.293z" />
  </svg>
)

export const Breadcrumb = ({ pages }: Props) => {
  const pathname = useRouter().state.location.pathname
  const adminHomeOnly = pathname === '/admin' && pages.length === 0

  return (
    <nav className="flex min-w-0 flex-1 items-center" aria-label="Breadcrumb">
      <ol className="my-0 flex h-10 max-h-10 min-h-10 w-full min-w-0 flex-nowrap items-stretch space-x-4 overflow-x-auto rounded-xl bg-white/90 px-6 shadow-sm ring-1 ring-gray-900/5">
        <li className="flex shrink-0">
          <div className="flex h-full items-center">
            {adminHomeOnly ? (
              <span
                className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-sm font-semibold text-gray-800"
                aria-current="page"
              >
                <HomeIcon className="size-5 shrink-0 text-gray-800" aria-hidden="true" />
                Admin
              </span>
            ) : (
              <a
                href="/admin"
                className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                <HomeIcon aria-hidden="true" className="size-5 shrink-0" />
                Admin
              </a>
            )}
          </div>
        </li>

        {pages.map((page) => {
          const current = pathname === page.href

          return (
            <li key={page.name} className="flex shrink-0">
              <div className="flex h-full items-center">
                {separator}
                <a
                  href={page.href}
                  aria-disabled={current ? 'true' : undefined}
                  className={twJoin(
                    current
                      ? 'pointer-events-none font-semibold text-gray-800'
                      : 'font-medium text-gray-500 hover:text-gray-700',
                    'ml-4 shrink-0 whitespace-nowrap text-sm',
                  )}
                  aria-current={current ? 'page' : undefined}
                >
                  {page.name}
                </a>
              </div>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
