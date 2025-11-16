import { useCurrentUser } from '@/src/app/_hooks/useCurrentUser'
import { Menu, MenuButton, MenuHeading, MenuItem, MenuItems, MenuSection } from '@headlessui/react'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/20/solid'
import { FunnelIcon } from '@heroicons/react/24/outline'
import { Fragment } from 'react'
import { twJoin } from 'tailwind-merge'
import { useOsmNotesFeatures } from '../../../../_hooks/mapState/userMapNotes'
import { useOsmFilterParam } from '../../../../_hooks/useQueryState/useNotesOsmParams'
import { menuItemClasses } from '../../InternalNotes/InternalNotesControls/InternalNotesFilterControl'

export const OsmNotesFilterControl = () => {
  const { osmNotesFilterParam, setOsmNotesFilterParam } = useOsmFilterParam()
  const noFilterActive = !Object.values(osmNotesFilterParam || {}).some(
    (value) => value !== undefined,
  )
  const osmNotesFeatures = useOsmNotesFeatures()
  const authors: Map<string, number> = new Map()
  osmNotesFeatures.features.forEach((f) => {
    const displayName = f.properties.comments.at(0)?.user
    if (!displayName || authors.has(displayName)) return
    const count = osmNotesFeatures.features.map((f) => f.properties.comments.at(0)?.user).length
    authors.set(displayName, count)
  })
  const stats = {
    commented: osmNotesFeatures.features.filter((n) => n.properties.comments.length > 1).length,
    uncommented: osmNotesFeatures.features.filter((n) => n.properties.comments.length === 1).length,
    completed: osmNotesFeatures.features.filter((n) => n.properties.status === 'closed').length,
    uncompleted: osmNotesFeatures.features.filter((n) => n.properties.status === 'open').length,
    filteredTotal: osmNotesFeatures.features.length,
  }
  const currentUser = useCurrentUser()

  const handleMenuClick = (
    e:
      | React.MouseEvent<HTMLButtonElement>
      | React.FormEvent<HTMLFormElement>
      | React.KeyboardEvent<HTMLInputElement>,
    state: Record<string, any>,
  ) => {
    e.preventDefault()
    setOsmNotesFilterParam({ ...osmNotesFilterParam, ...state })
  }

  return (
    <Menu as="div" className="relative inline-block text-left">
      <MenuButton as={Fragment}>
        {({ active }) => (
          <button
            className={twJoin(
              'z-0 -ml-px inline-flex justify-center border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 shadow-md hover:text-gray-800 focus:relative focus:z-10 focus:outline-none focus:ring-2 focus:ring-yellow-500',
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
        className="absolute right-0 z-10 mt-2 w-64 rounded-md bg-white text-sm shadow-lg ring-1 ring-black ring-opacity-5 transition focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in"
      >
        <MenuSection className="m-1 overflow-clip rounded-md border">
          <MenuHeading className="bg-gray-100 px-4 py-1 text-xs font-semibold uppercase text-gray-600">
            Status
          </MenuHeading>
          <MenuItem
            as="button"
            className={menuItemClasses(osmNotesFilterParam?.completed === true)}
            onClick={(e) => handleMenuClick(e, { completed: true })}
          >
            Nur erledigte Hinweise{' '}
            {noFilterActive && <span className="text-gray-500">({stats?.completed})</span>}
          </MenuItem>
          <MenuItem
            as="button"
            className={menuItemClasses(osmNotesFilterParam?.completed === false)}
            onClick={(e) => handleMenuClick(e, { completed: false })}
          >
            Nur offene Hinweise{' '}
            {noFilterActive && <span className="text-gray-500">({stats?.uncommented})</span>}
          </MenuItem>
          <MenuItem
            as="button"
            className={menuItemClasses(osmNotesFilterParam?.completed === undefined)}
            onClick={(e) => handleMenuClick(e, { completed: undefined })}
          >
            Offen & erledigt
          </MenuItem>
        </MenuSection>

        <MenuSection className="m-1 overflow-clip rounded-md border">
          <MenuHeading className="flex items-center gap-2 bg-gray-100 px-4 py-1 text-xs font-semibold uppercase text-gray-600">
            Nutzer:innen
          </MenuHeading>
          {Array.from(authors).map(([displayName, count]) => {
            return (
              <MenuItem
                key={displayName}
                as="button"
                className={menuItemClasses(osmNotesFilterParam?.user === displayName)}
                onClick={(e) => handleMenuClick(e, { user: displayName })}
              >
                {displayName === currentUser?.osmName
                  ? 'Meine Hinweise'
                  : `Hinweise von ${displayName}`}{' '}
                {noFilterActive && <span className="text-gray-500">({count})</span>}
              </MenuItem>
            )
          })}
          <MenuItem
            as="button"
            className={menuItemClasses(osmNotesFilterParam?.user === undefined)}
            onClick={(e) => handleMenuClick(e, { user: undefined })}
          >
            Alle Nutzer
          </MenuItem>
        </MenuSection>

        <MenuSection className="m-1 overflow-clip rounded-md border">
          <MenuHeading className="flex items-center gap-2 bg-gray-100 px-4 py-1 text-xs font-semibold uppercase text-gray-600">
            Kommentiert
          </MenuHeading>
          <MenuItem
            as="button"
            className={menuItemClasses(osmNotesFilterParam?.commented === true)}
            onClick={(e) => handleMenuClick(e, { commented: true })}
          >
            Nur kommentierte Hinweise{' '}
            {noFilterActive && <span className="text-gray-500">({stats?.commented})</span>}
          </MenuItem>
          <MenuItem
            as="button"
            className={menuItemClasses(osmNotesFilterParam?.commented === false)}
            onClick={(e) => handleMenuClick(e, { commented: false })}
          >
            Nur unkommentierte Hinweise{' '}
            {noFilterActive && <span className="text-gray-500">({stats?.uncommented})</span>}
          </MenuItem>
          <MenuItem
            as="button"
            className={menuItemClasses(osmNotesFilterParam?.commented === undefined)}
            onClick={(e) => handleMenuClick(e, { commented: undefined })}
          >
            Kommentiert & unkommentiert
          </MenuItem>
        </MenuSection>

        <MenuSection className="m-1 overflow-clip rounded-md border">
          <MenuHeading className="bg-gray-100 px-4 py-1 text-xs font-semibold uppercase text-gray-600">
            Suchwort
          </MenuHeading>
          <MenuItem
            as="form"
            className={twJoin(
              osmNotesFilterParam?.query !== undefined ? 'bg-yellow-100' : '',
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
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-yellow-600 sm:leading-6"
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
              defaultValue={osmNotesFilterParam?.query || ''}
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
