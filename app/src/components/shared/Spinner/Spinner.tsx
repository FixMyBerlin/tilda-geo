import { twJoin } from 'tailwind-merge'

type Props = {
  className?: string
  size?: keyof typeof sizeClasses
  color?: keyof typeof colorClasses
  screenReaderLabel?: boolean
}

const sizeClasses = {
  '5': 'size-5',
  '8': 'size-8',
  '12': 'size-12',
}

const colorClasses = {
  blue: 'border-gray-500',
  teal: 'border-teal-100',
  yellow: 'border-yellow-400',
}

const ringBase =
  'box-border inline-block rounded-full border-2 border-b-transparent animate-[spin_0.5s_linear_infinite]'

export const Spinner = ({
  className,
  size = '12',
  color = 'blue',
  screenReaderLabel = true,
}: Props) => {
  return (
    <div
      className={twJoin(
        'relative inline-flex shrink-0 items-center justify-center leading-none',
        sizeClasses[size],
        className,
      )}
    >
      {screenReaderLabel ? <span className="sr-only">Loading</span> : null}
      <span
        aria-hidden="true"
        className={twJoin(ringBase, sizeClasses[size], colorClasses[color])}
      />
    </div>
  )
}
