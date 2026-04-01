import { useQuery } from '@tanstack/react-query'
import { getFullname } from '@/components/admin/memberships/pageMemberships/utils/getFullname'
import { useQaFilterParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useQaFilterParam'
import { SmallSpinner } from '@/components/shared/Spinner/SmallSpinner'
import { getQaUsersForConfigFn } from '@/server/qa-configs/qa-configs.functions'

type Props = {
  configId: number
  regionSlug: string
}

export const QaUserDropdown = ({ configId, regionSlug }: Props) => {
  const { qaFilterParam, toggleUser, clearUsers } = useQaFilterParam()
  const { data: qaUsers, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['qa-configs', 'getQaUsersForConfig', { configId, regionSlug }],
    queryFn: () => getQaUsersForConfigFn({ data: { configId, regionSlug } }),
  })

  const selectedUserIds = qaFilterParam?.users || []
  const noFilterActive = !selectedUserIds || selectedUserIds.length === 0

  return (
    <div className="mx-2 mt-2 space-y-1 border-t border-gray-200 pt-2">
      <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-gray-600 uppercase">
        Nutzer:innen-Bewertungen {isLoadingUsers && <SmallSpinner />}
      </div>
      {qaUsers?.map((user) => {
        const isUserSelected = selectedUserIds.includes(user.id)
        return (
          <label
            key={user.id}
            className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-xs hover:bg-gray-50"
          >
            <input
              type="checkbox"
              checked={isUserSelected}
              onChange={() => toggleUser(user.id)}
              className="h-3 w-3 text-violet-600 focus:ring-violet-500"
            />
            <span>
              {user.currentUser ? 'Meine Bewertungen' : `…von ${getFullname(user) || user.osmName}`}{' '}
              {noFilterActive && <span className="text-gray-500">({user.count})</span>}
            </span>
          </label>
        )
      })}
      <label className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-xs hover:bg-gray-50">
        <input
          type="checkbox"
          checked={noFilterActive}
          onChange={clearUsers}
          className="h-3 w-3 text-violet-600 focus:ring-violet-500"
        />
        <span>Alle Nutzer:innen</span>
      </label>
    </div>
  )
}
