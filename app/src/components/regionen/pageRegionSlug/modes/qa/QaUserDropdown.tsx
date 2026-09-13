import { Menu, MenuButton, MenuItems } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import { useQuery } from '@tanstack/react-query'
import { twJoin } from 'tailwind-merge'
import { getFullname } from '@/components/admin/memberships/pageMemberships/utils/getFullname'
import { useQaParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useQaParam'
import { SmallSpinner } from '@/components/shared/Spinner/SmallSpinner'
import { getQaUsersForConfigFn } from '@/server/qa-configs/qa-configs.functions'
import { mapOverlayMenuClassName } from '../../mapOverlayChrome.const'
import { modeFilterIcons } from '../ModeFilterSelect'
import {
  modePanelFilterControlClassName,
  modePanelListItemHoverClassName,
} from '../modePanel.const'

const UsersIcon = modeFilterIcons.users

type Props = {
  configId: number
  regionSlug: string
}

/**
 * Compact Nutzer:innen filter. Closed: current choice (Alle, or a count). Open: checkboxes
 * including “Meine Bewertungen”; Alle is the default (no user ids in the URL).
 */
export const QaUserDropdown = ({ configId, regionSlug }: Props) => {
  const { qaParamData, toggleUser, clearUsers } = useQaParam()
  const {
    data: qaUsers,
    isLoading: isLoadingUsers,
    isError: isUsersError,
  } = useQuery({
    queryKey: ['qa-configs', 'getQaUsersForConfig', { configId, regionSlug }],
    queryFn: () => getQaUsersForConfigFn({ data: { configId, regionSlug } }),
  })

  if (isUsersError) {
    return (
      <div className="max-w-28 min-w-0">
        <button
          type="button"
          disabled
          aria-label="Nutzer:innen: Fehler"
          title="Nutzer:innen"
          className={twJoin(
            modePanelFilterControlClassName,
            'w-full justify-between gap-1 px-1.5 disabled:cursor-not-allowed disabled:opacity-40',
          )}
        >
          <span className="flex min-w-0 items-center gap-1">
            <UsersIcon className="size-3.5 shrink-0 text-gray-500" aria-hidden="true" />
            <span className="truncate">Fehler</span>
          </span>
        </button>
      </div>
    )
  }

  const selectedUserIds = qaParamData.users || []
  const noFilterActive = selectedUserIds.length === 0
  const triggerLabel = noFilterActive
    ? 'Alle'
    : selectedUserIds.length === 1
      ? '1 ausgewählt'
      : `${selectedUserIds.length} ausgewählt`

  return (
    <Menu as="div" className="max-w-28 min-w-0">
      <MenuButton
        aria-label={`Nutzer:innen: ${triggerLabel}`}
        title="Nutzer:innen"
        className={twJoin(modePanelFilterControlClassName, 'w-full justify-between gap-1 px-1.5')}
      >
        <span className="flex min-w-0 items-center gap-1">
          <UsersIcon className="size-3.5 shrink-0 text-gray-500" aria-hidden="true" />
          <span className="truncate">{triggerLabel}</span>
        </span>
        {isLoadingUsers ? (
          <SmallSpinner />
        ) : (
          <ChevronDownIcon className="size-3.5 shrink-0" aria-hidden="true" />
        )}
      </MenuButton>
      <MenuItems
        anchor="bottom start"
        modal={false}
        className={twJoin(
          'z-40 min-w-56 space-y-0.5 px-2 py-2 [--anchor-gap:4px]',
          mapOverlayMenuClassName,
        )}
      >
        <div className="flex items-center gap-1.5 px-1 pb-1 text-[11px] font-medium text-gray-500">
          <UsersIcon className="size-3.5 shrink-0" aria-hidden="true" />
          Nutzer:innen
        </div>
        {qaUsers?.map((user) => {
          const isUserSelected = selectedUserIds.includes(user.id)
          return (
            <label
              key={user.id}
              className={`flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-xs ${modePanelListItemHoverClassName}`}
            >
              <input
                type="checkbox"
                checked={isUserSelected}
                onChange={() => toggleUser(user.id)}
                className="size-4 rounded border-gray-300 text-brand focus:ring-brand"
              />
              <span>
                {user.currentUser
                  ? 'Meine Bewertungen'
                  : `…von ${getFullname(user) || user.osmName}`}{' '}
                {noFilterActive && <span className="text-gray-500">({user.count})</span>}
              </span>
            </label>
          )
        })}
        <label
          className={`flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-xs ${modePanelListItemHoverClassName}`}
        >
          <input
            type="checkbox"
            checked={noFilterActive}
            onChange={clearUsers}
            className="size-4 rounded border-gray-300 text-brand focus:ring-brand"
          />
          <span>Alle Nutzer:innen</span>
        </label>
      </MenuItems>
    </Menu>
  )
}
