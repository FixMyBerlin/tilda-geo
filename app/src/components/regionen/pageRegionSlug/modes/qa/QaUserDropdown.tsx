import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
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
  modeFilterCheckboxClassName,
  modeFilterCheckboxRowClassName,
  modeFilterMenuHeadingClassName,
  modePanelFilterControlClassName,
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
    <Popover className="max-w-28 min-w-0">
      <PopoverButton
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
      </PopoverButton>
      <PopoverPanel
        anchor="bottom start"
        focus
        className={twJoin(
          'z-40 min-w-56 space-y-0.5 px-2 pb-2 [--anchor-gap:4px]',
          mapOverlayMenuClassName,
        )}
      >
        <div className={twJoin(modeFilterMenuHeadingClassName, '-mx-2')} aria-hidden="true">
          <UsersIcon className="size-3.5 shrink-0" />
          Nutzer:innen
        </div>
        <fieldset className="space-y-0.5">
          <legend className="sr-only">Nutzer:innen</legend>
          {qaUsers?.map((user) => {
            const isUserSelected = selectedUserIds.includes(user.id)
            return (
              <label key={user.id} className={modeFilterCheckboxRowClassName}>
                <input
                  type="checkbox"
                  checked={isUserSelected}
                  onChange={() => toggleUser(user.id)}
                  className={modeFilterCheckboxClassName}
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
          <label className={modeFilterCheckboxRowClassName}>
            <input
              type="checkbox"
              checked={noFilterActive}
              onChange={clearUsers}
              className={modeFilterCheckboxClassName}
            />
            <span>Alle Nutzer:innen</span>
          </label>
        </fieldset>
      </PopoverPanel>
    </Popover>
  )
}
