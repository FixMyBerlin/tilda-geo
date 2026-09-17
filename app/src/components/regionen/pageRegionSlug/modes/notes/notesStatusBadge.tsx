import { ChatBubbleLeftIcon } from '@heroicons/react/20/solid'
import { SvgNotesCheckmark } from '@/components/regionen/pageRegionSlug/SidebarInspector/icons/SvgNotesCheckmark'
import { SvgNotesQuestionmark } from '@/components/regionen/pageRegionSlug/SidebarInspector/icons/SvgNotesQuestionmark'

export const NotesOpenClosedIcon = ({
  status,
  className = 'size-5 shrink-0 text-teal-700',
  labelHidden = false,
}: {
  status: 'open' | 'closed'
  className?: string
  labelHidden?: boolean
}) => {
  const isClosed = status === 'closed'
  const Icon = isClosed ? SvgNotesCheckmark : SvgNotesQuestionmark
  const label = isClosed ? 'geschlossen' : 'offen'
  const icon = <Icon className={className} />
  if (labelHidden) return icon
  return (
    <span title={label} aria-label={label} className="inline-flex shrink-0">
      {icon}
    </span>
  )
}

/** Same pill as the OSM note detail header (map open/closed icons + label). */
export const NotesOpenClosedBadge = ({ status }: { status: 'open' | 'closed' }) => {
  const isClosed = status === 'closed'
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white py-0.5 pr-2 pl-0.5 text-xs font-medium text-gray-900"
      title={isClosed ? 'geschlossen' : 'offen'}
    >
      <NotesOpenClosedIcon status={status} className="size-4 shrink-0 text-teal-700" labelHidden />
      {isClosed ? 'geschlossen' : 'offen'}
    </span>
  )
}

export const NotesCommentsPill = ({ count }: { count: number }) => {
  const label = `${count} Kommentar${count === 1 ? '' : 'e'}`
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700"
      aria-label={label}
      title={label}
    >
      <ChatBubbleLeftIcon className="size-3.5" aria-hidden="true" />
      {count}
    </span>
  )
}
