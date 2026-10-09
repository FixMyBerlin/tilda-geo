import { DisclosureChevron } from '@/components/shared/DisclosureChevron/DisclosureChevron'

type Props = {
  expanded: boolean
  onToggle: () => void
  /** Names the action the click performs, e.g. »Detaillierte Legende« while collapsed. */
  label: string
  /** Set to `above` when the toggle sits below the content it expands. */
  content?: 'below' | 'above'
}

/** Disclosure-styled toggle (chevron + label); still a plain button, not native details. */
export const DetailToggle = ({ expanded, onToggle, label, content }: Props) => (
  <button
    type="button"
    onClick={onToggle}
    className="group flex cursor-pointer items-center gap-0.5 text-left text-xs leading-tight text-gray-500 hover:text-gray-800"
    aria-expanded={expanded}
  >
    <DisclosureChevron
      open={expanded}
      side="leading"
      content={content}
      className="size-3.5 text-gray-400 group-hover:text-gray-700"
    />
    <span>{label}</span>
  </button>
)
