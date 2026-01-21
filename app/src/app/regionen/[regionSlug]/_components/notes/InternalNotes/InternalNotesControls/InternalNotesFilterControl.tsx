import { SmallSpinner } from '@/src/app/_components/Spinner/SmallSpinner'
import { getFullname } from '@/src/app/admin/memberships/_components/utils/getFullname'
import { useInternalNotesFilterParam } from '@/src/app/regionen/[regionSlug]/_hooks/useQueryState/useNotesAtlasParams'
import getNotesAndCommentsForRegion from '@/src/server/notes/queries/getNotesAndCommentsForRegion'
import { useQuery } from '@blitzjs/rpc'
import { Menu, MenuButton, MenuHeading, MenuItem, MenuItems, MenuSection } from '@headlessui/react'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/20/solid'
import { FunnelIcon } from '@heroicons/react/24/outline'
import { Fragment } from 'react'
import { twJoin } from 'tailwind-merge'
import { useStaticRegion } from '../../../regionUtils/useStaticRegion'
import { useQueryKey } from '../utils/useQueryKey'

export const menuItemClasses = (active: boolean) => {
  return twJoin(
    active ? 'bg-yellow-100' : 'data-[focus]:bg-gray-100',
    'w-full px-4 py-2 text-left text-gray-700 data-[focus]:text-gray-900',
  )
}

export const InternalNotesFilterControl = () => {
  const { slug: regionSlug } = useStaticRegion()!
  const { internalNotesFilterParam, setInternalNotesFilterParam } = useInternalNotesFilterParam()
  const queryKey = useQueryKey()
  const [{ authors, stats }, { isLoading }] = useQuery(
    getNotesAndCommentsForRegion,
    { regionSlug, filter: internalNotesFilterParam },
    { queryKey },
  )
  const noFilterActive = !Object.values(internalNotesFilterParam || {}).some(
    (value) => value !== undefined,
  )

  const handleMenuClick = (
    e:
      | React.MouseEvent<HTMLButtonElement>
      | React.FormEvent<HTMLFormElement>
      | React.KeyboardEvent<HTMLInputElement>,
    state: Record<string, any>,
  ) => {
    e.preventDefault()
    setInternalNotesFilterParam({ ...internalNotesFilterParam, ...state })
  }

  return (
    <Menu as="div" className="relative inline-block text-left">
      <MenuButton as={Fragment}>
        {({ active }) => (
          <button
            className={twJoin(
              'z-0 -ml-px inline-flex justify-center border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 shadow-md hover:text-gray-800 focus:relative focus:z-10 focus:ring-2 focus:ring-yellow-500 focus:outline-none',
              active ? 'bg-yellow-100' : 'bg-white hover:bg-yellow-50',
              noFilterActive ? '' : 'bg-yellow-400',
            )}
          >
            <span className="sr-only">Hinweise filtern</span>
            <FunnelIcon className="-mr-1 size-5" aria-hidden="true" />
          </button>
        )}
      </MenuButton>

      <MenuItems
        transition
        anchor="top start"
        className="ring-opacity-5 absolute right-0 z-10 mt-2 w-72 rounded-md bg-white text-sm shadow-lg ring-1 ring-black transition focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[enter]:ease-out data-[leave]:duration-75 data-[leave]:ease-in"
      >
        <MenuSection className="m-1 overflow-clip rounded-md border">
          <MenuHeading className="bg-gray-100 px-4 py-1 text-xs font-semibold text-gray-600 uppercase">
            Status
          </MenuHeading>
          <MenuItem
            as="button"
            className={menuItemClasses(internalNotesFilterParam?.completed === true)}
            onClick={(e) => handleMenuClick(e, { completed: true })}
          >
            Nur erledigte Hinweise{' '}
            {noFilterActive && <span className="text-gray-500">({stats?.completed})</span>}
          </MenuItem>
          <MenuItem
            as="button"
            className={menuItemClasses(internalNotesFilterParam?.completed === false)}
            onClick={(e) => handleMenuClick(e, { completed: false })}
          >
            Nur offene Hinweise{' '}
            {noFilterActive && <span className="text-gray-500">({stats?.uncommented})</span>}
          </MenuItem>
          <MenuItem
            as="button"
            className={menuItemClasses(internalNotesFilterParam?.completed === undefined)}
            onClick={(e) => handleMenuClick(e, { completed: undefined })}
          >
            Offen & erledigt
          </MenuItem>
        </MenuSection>

        <MenuSection className="m-1 overflow-clip rounded-md border">
          <MenuHeading className="flex items-center gap-2 bg-gray-100 px-4 py-1 text-xs font-semibold text-gray-600 uppercase">
            Nutzer:innen {isLoading && <SmallSpinner />}
          </MenuHeading>
          {authors?.map((author) => {
            return (
              <MenuItem
                key={author.id}
                as="button"
                className={menuItemClasses(internalNotesFilterParam?.user === author.id)}
                onClick={(e) => handleMenuClick(e, { user: author.id })}
              >
                {author.currentUser
                  ? 'Meine Hinweise'
                  : `Hinweise von ${getFullname(author) || author.osmName}`}{' '}
                {noFilterActive && <span className="text-gray-500">({author.count})</span>}
              </MenuItem>
            )
          })}
          <MenuItem
            as="button"
            className={menuItemClasses(internalNotesFilterParam?.user === undefined)}
            onClick={(e) => handleMenuClick(e, { user: undefined })}
          >
            Alle Nutzer:innen
          </MenuItem>
        </MenuSection>

        <MenuSection className="m-1 overflow-clip rounded-md border">
          <MenuHeading className="flex items-center gap-2 bg-gray-100 px-4 py-1 text-xs font-semibold text-gray-600 uppercase">
            Kommentiert
          </MenuHeading>
          <MenuItem
            as="button"
            className={menuItemClasses(internalNotesFilterParam?.commented === true)}
            onClick={(e) => handleMenuClick(e, { commented: true })}
          >
            Nur kommentierte Hinweise{' '}
            {noFilterActive && <span className="text-gray-500">({stats?.commented})</span>}
          </MenuItem>
          <MenuItem
            as="button"
            className={menuItemClasses(internalNotesFilterParam?.commented === false)}
            onClick={(e) => handleMenuClick(e, { commented: false })}
          >
            Nur unkommentierte Hinweise{' '}
            {noFilterActive && <span className="text-gray-500">({stats?.uncommented})</span>}
          </MenuItem>
          <MenuItem
            as="button"
            className={menuItemClasses(internalNotesFilterParam?.commented === undefined)}
            onClick={(e) => handleMenuClick(e, { commented: undefined })}
          >
            Kommentiert & unkommentiert
          </MenuItem>
        </MenuSection>

        <MenuSection className="m-1 overflow-clip rounded-md border">
          <MenuHeading className="flex items-center gap-2 bg-gray-100 px-4 py-1 text-xs font-semibold text-gray-600 uppercase">
            Reaktion
          </MenuHeading>
          <MenuItem
            as="button"
            className={menuItemClasses(internalNotesFilterParam?.notReacted === true)}
            onClick={(e) => handleMenuClick(e, { notReacted: true })}
          >
            Nicht von mir reagiert{' '}
            {noFilterActive && <span className="text-gray-500">({stats?.notReacted})</span>}
          </MenuItem>
          <MenuItem
            as="button"
            className={menuItemClasses(internalNotesFilterParam?.notReacted === false)}
            onClick={(e) => handleMenuClick(e, { notReacted: false })}
          >
            Von mir reagiert{' '}
            {noFilterActive && <span className="text-gray-500">({stats?.reacted})</span>}
          </MenuItem>
          <MenuItem
            as="button"
            className={menuItemClasses(internalNotesFilterParam?.notReacted === undefined)}
            onClick={(e) => handleMenuClick(e, { notReacted: undefined })}
          >
            Alle Hinweise
          </MenuItem>
        </MenuSection>

        <MenuSection className="m-1 overflow-clip rounded-md border">
          <MenuHeading className="bg-gray-100 px-4 py-1 text-xs font-semibold text-gray-600 uppercase">
            Suchwort
          </MenuHeading>
          <MenuItem
            as="form"
            className={twJoin(
              internalNotesFilterParam?.query !== undefined ? 'bg-yellow-100' : '',
              'relative p-2',
            )}
            onSubmit={(e) => {
              // @ts-expect-error TS cannot assert the `query` input field but it is defined right below…
              handleMenuClick(e, { query: e.currentTarget.elements.query.value })
            }}
          >
            <input
              id="query"
              type="text" // type "search" shows an `x` but that does not do anything in chrome, maybe due to the preventDefault…
              placeholder="Suchwort"
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-gray-300 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-yellow-600 focus:ring-inset sm:leading-6"
              onClick={(e) => {
                // Required so the flyout does not close when I click in the input field
                e.preventDefault()
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleMenuClick(e, { query: e.currentTarget.value })
                }
              }}
              defaultValue={internalNotesFilterParam?.query || ''}
            />
            <div className="absolute inset-y-3 right-3 flex items-center gap-1">
              <button
                type="submit"
                className="flex h-7 w-11 items-center justify-center rounded-md border border-gray-300 bg-yellow-50 text-gray-900 shadow-sm hover:border-gray-500 hover:bg-yellow-100"
              >
                <MagnifyingGlassIcon className="size-5 text-gray-700" aria-hidden="true" />
              </button>
              <button
                className="flex size-7 items-center justify-center rounded-md border border-white hover:border-gray-300 hover:bg-yellow-100 hover:shadow-sm"
                onClick={(e) => handleMenuClick(e, { query: undefined })}
              >
                <XMarkIcon className="size-5 text-gray-400" aria-hidden="true" />
              </button>
            </div>
          </MenuItem>
        </MenuSection>
      </MenuItems>
    </Menu>
  )
}
