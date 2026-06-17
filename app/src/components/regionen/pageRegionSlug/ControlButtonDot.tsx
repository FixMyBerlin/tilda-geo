import { twMerge } from 'tailwind-merge'

type Props = {
  /** Accessible description of what needs attention (rendered sr-only). */
  srLabel: string
  /**
   * Optional `bg-*` override. Defaults to the generic "something to look at"
   * amber. Pass a different colour only when the meaning genuinely differs.
   */
  className?: string
}

/**
 * Shared "something to look at" indicator dot for the floating map-control buttons
 * (download, user, …). One fixed position / size / ring so every button's dot looks
 * identical — only the colour may vary via `className`. The parent button must be
 * positioned (`relative`).
 */
export function ControlButtonDot({ srLabel, className }: Props) {
  return (
    <span
      className={twMerge(
        'absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-amber-500 ring-2 ring-white',
        className,
      )}
    >
      <span className="sr-only">{srLabel}</span>
    </span>
  )
}
