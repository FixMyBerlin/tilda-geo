import { ArrowUpRightIcon } from '@heroicons/react/24/outline'
import { twMerge } from 'tailwind-merge'

type Props = {
  className?: string
}

export const NavigationContactButton = ({ className }: Props) => {
  return (
    <a
      href="https://fixmycity.de/termin-vereinbaren/"
      target="_blank"
      rel="noopener noreferrer"
      className={twMerge(
        'group inline-flex items-center justify-center gap-1 rounded-md border border-transparent bg-brand px-2.5 py-2 font-medium whitespace-nowrap text-gray-900 transition-colors hover:bg-brand/80 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none focus-visible:ring-inset',
        className,
      )}
    >
      {/* Invisible left spacer mirrors the arrow so the label stays horizontally centered while the
          arrow's slot is permanently reserved (constant width, never cramped). */}
      <span aria-hidden className="size-3.5 shrink-0" />
      <span className="transition-transform duration-200 ease-out group-hover:-translate-x-1">
        Demo anfragen
      </span>
      {/* Reserved in flow; only fades + slides in from the right on hover. */}
      <ArrowUpRightIcon
        aria-hidden
        className="size-3.5 shrink-0 translate-x-2 opacity-0 transition-all duration-200 ease-out group-hover:translate-x-0 group-hover:opacity-100"
      />
    </a>
  )
}
