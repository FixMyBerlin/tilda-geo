import { twJoin, twMerge } from 'tailwind-merge'
import { buttonStylesOnYellow, buttonStylesSecondary } from '@/components/shared/links/styles'
import { SmallSpinner } from '@/components/shared/Spinner/SmallSpinner'

type Props = {
  label: string
  pending?: boolean
  disabled?: boolean
  buttonClassName?: string
  form?: string
  cancel?: {
    label?: string
    onClick: () => void
  }
}

export const ModeFormSubmit = ({
  label,
  pending = false,
  disabled = false,
  buttonClassName,
  form,
  cancel,
}: Props) => {
  const isDisabled = disabled || pending

  return (
    <div className={twJoin('flex items-center', cancel ? 'gap-2' : 'gap-3')}>
      <button
        type="submit"
        form={form}
        disabled={isDisabled}
        className={twMerge(
          buttonStylesOnYellow,
          'gap-2',
          cancel && 'min-w-0 flex-1',
          buttonClassName,
        )}
      >
        {label}
        {pending ? <SmallSpinner /> : null}
      </button>
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
