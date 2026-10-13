import { twJoin } from 'tailwind-merge'
import { formatNumber } from '@/components/shared/utils/formatNumber'

const formatShare = new Intl.NumberFormat('de-DE', {
  style: 'percent',
  maximumFractionDigits: 1,
})

type Props = {
  /** The changed amount, without sign. */
  amount: number
  /** `amount` as a share (0…1) of the larger of reference and current. */
  share: number
  unit: string
  /** More or less than the reference. Omit for a difference that has no direction. */
  direction?: 'more' | 'less'
}

/**
 * A change against the reference: the amount over its share, in small type, together as high as
 * one line of the values next to it.
 */
export const QaChange = ({ amount, share, unit, direction }: Props) => {
  const sign = direction === 'more' ? '+ ' : direction === 'less' ? '− ' : ''

  return (
    <span
      className={twJoin(
        'flex flex-col items-end text-[10px] leading-[1.15] tracking-tight whitespace-nowrap tabular-nums',
        direction === 'more' && 'text-emerald-700',
        direction === 'less' && 'text-red-700',
      )}
    >
      <span className="font-semibold">
        {sign}
        {formatNumber(amount)} {unit}
      </span>
      <span className="font-normal">{formatShare.format(share)}</span>
    </span>
  )
}
