import { twMerge } from 'tailwind-merge'
import { modeFilterIcons } from '../../ModeFilterSelect'

// The icon of the attribute filter of the list, so an attribute looks the same everywhere.
const AttributeIcon = modeFilterIcons.category

type Props = {
  label: string
  /** Text in front of the icon, e.g. "Gilt für". */
  prefix?: string
  className?: string
}

/** The name of an attribute (indicator) with the attribute icon. */
export const QaAttributeLabel = ({ label, prefix, className }: Props) => (
  <span className={twMerge('inline-flex items-center gap-1.5', className)}>
    {prefix ? <span className="font-normal text-gray-500">{prefix}</span> : null}
    <AttributeIcon className="size-4 shrink-0 text-gray-500" aria-hidden="true" />
    {label}
  </span>
)
