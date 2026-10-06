import { SvgNotesCheckmark } from '@/components/regionen/pageRegionSlug/SidebarInspector/icons/SvgNotesCheckmark'
import { SvgNotesQuestionmark } from '@/components/regionen/pageRegionSlug/SidebarInspector/icons/SvgNotesQuestionmark'
import { ModePanelPill } from '../ModePanelPill'

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
    <ModePanelPill
      className="bg-white pr-2 pl-0.5 text-gray-900"
      title={isClosed ? 'geschlossen' : 'offen'}
    >
      <NotesOpenClosedIcon status={status} className="size-4 shrink-0 text-teal-700" labelHidden />
      {isClosed ? 'geschlossen' : 'offen'}
    </ModePanelPill>
  )
}
