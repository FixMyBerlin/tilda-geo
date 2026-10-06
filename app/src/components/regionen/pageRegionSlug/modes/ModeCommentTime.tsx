import { formatDateTime } from '@/components/shared/date/formatDate'
import { TimeWithRelativeTooltip } from '@/components/shared/date/TimeWithRelativeTooltip'
import { wasUpdated } from './notes/detail/utils/wasUpdated'

type Props = {
  createdAt: Date | string | number
  updatedAt: Date | string | number
}

export const ModeCommentTime = ({ createdAt, updatedAt }: Props) => {
  const created = new Date(createdAt)
  const updated = new Date(updatedAt)
  const edited = wasUpdated({ createdAt: created, updatedAt: updated })
  return (
    <TimeWithRelativeTooltip
      date={edited ? updated : created}
      timeClassName="text-inherit"
      tooltip={
        edited
          ? `Erstellt ${formatDateTime(created)}\nAktualisiert ${formatDateTime(updated)}`
          : undefined
      }
    />
  )
}
