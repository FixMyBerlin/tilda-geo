import { twJoin } from 'tailwind-merge'

/** Dark sidebar item: gray-300 text, gray-700 hover, gray-900 active (`data-status` from router `Link`). */
export const adminSidebarItemClassName = twJoin(
  'group flex w-full items-center gap-x-3 rounded-md p-2 text-left text-sm/6 font-semibold text-gray-300 no-underline',
  'hover:bg-gray-700 hover:text-white data-[status=active]:bg-gray-900 data-[status=active]:text-white',
)
