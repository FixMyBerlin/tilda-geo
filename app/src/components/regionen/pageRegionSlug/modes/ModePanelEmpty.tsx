import { ListBulletIcon } from '@heroicons/react/24/outline'
import { modePanelMutedClassName } from './modePanel.const'

type Props = {
  /** Screen-reader label for the empty list (e.g. "Keine Einträge."). */
  label: string
  /** Visible explanation when filters hide an otherwise non-empty collection. */
  description?: string
}

/** List icon in the top third of the mode list body when there are no rows. */
export const ModePanelEmpty = ({ label, description }: Props) => (
  <div className="flex min-h-full flex-col items-center px-4 py-4 text-center" role="status">
    <div className="grow" aria-hidden />
    <ListBulletIcon className="size-10 shrink-0 text-gray-300" aria-hidden />
    {description ? (
      <p className={`mt-3 max-w-prose ${modePanelMutedClassName}`}>{description}</p>
    ) : (
      <span className="sr-only">{label}</span>
    )}
    <div className="grow-[2]" aria-hidden />
  </div>
)
