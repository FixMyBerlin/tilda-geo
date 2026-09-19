import { twJoin } from 'tailwind-merge'

type Props = {
  /** Farbe/Größe überschreiben; Default ist ein kleiner blauer Ring. */
  className?: string
  label?: string
}

/** Kleiner, schnell drehender Ring – zeigt an, dass ein Job gerade läuft. */
export const Spinner = ({ className, label = 'Berechnung läuft' }: Props) => (
  <span
    className={twJoin(
      'inline-block shrink-0 animate-spin rounded-full border-2 border-t-transparent [animation-duration:0.6s]',
      className ?? 'h-3 w-3 border-blue-500',
    )}
    aria-label={label}
  />
)
