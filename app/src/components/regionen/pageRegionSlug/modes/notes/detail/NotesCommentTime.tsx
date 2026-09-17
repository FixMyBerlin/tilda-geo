import { formatDateTime } from '@/components/shared/date/formatDate'
import { TimeWithRelativeTooltip } from '@/components/shared/date/TimeWithRelativeTooltip'
import { wasUpdated } from './utils/wasUpdated'

type Props = {
  createdAt: Date
  updatedAt: Date
}

export const NotesCommentTime = ({ createdAt, updatedAt }: Props) => {
  const edited = wasUpdated({ createdAt, updatedAt })
  return (
    <TimeWithRelativeTooltip
      date={edited ? updatedAt : createdAt}
      timeClassName="text-inherit"
      tooltip={
        edited
          ? `Erstellt ${formatDateTime(createdAt)}\nAktualisiert ${formatDateTime(updatedAt)}`
          : undefined
      }
    />
  )
}
