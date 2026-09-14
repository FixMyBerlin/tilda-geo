import { twJoin, twMerge } from 'tailwind-merge'
import {
  buttonStyles,
  buttonStylesOnYellow,
  buttonStylesSecondary,
} from '@/components/shared/links/styles'
import { SmallSpinner } from '@/components/shared/Spinner/SmallSpinner'

type Props = {
  label: string
  pending?: boolean
  disabled?: boolean
  /** `default`: compact white QA button. `yellow`: notes / composer. */
  variant?: 'default' | 'yellow'
  spinner?: 'beside' | 'inside'
  buttonClassName?: string
  form?: string
  cancel?: {
    label?: string
    onClick: () => void
  }
}

const defaultEnabledClasses = 'border-gray-400 bg-white px-3 py-1 shadow-md'
const defaultDisabledClasses =
  'cursor-not-allowed border-gray-300 bg-white px-3 py-1 text-gray-400 shadow-sm hover:bg-white'

export const ModeFormSubmit = ({
  label,
  pending = false,
  disabled = false,
  variant = 'default',
  spinner = 'beside',
  buttonClassName,
  form,
  cancel,
}: Props) => {
  const isDisabled = disabled || pending
  const isYellow = variant === 'yellow'

  return (
    <div className={twJoin('flex items-center', cancel ? 'gap-2' : 'gap-3')}>
      <button
        type="submit"
        form={form}
        disabled={isDisabled}
        className={twMerge(
          isYellow ? buttonStylesOnYellow : buttonStyles,
          !isYellow && (isDisabled ? defaultDisabledClasses : defaultEnabledClasses),
          spinner === 'inside' && 'gap-2',
          cancel && 'min-w-0 flex-1',
          buttonClassName,
        )}
      >
        {label}
        {pending && spinner === 'inside' ? <SmallSpinner /> : null}
      </button>
      {pending && spinner === 'beside' ? <SmallSpinner /> : null}
      {cancel ? (
        <button
          type="button"
          className={twJoin(buttonStylesSecondary, 'shrink-0')}
          onClick={cancel.onClick}
        >
          {cancel.label ?? 'Abbrechen'}
        </button>
      ) : null}
    </div>
  )
}
