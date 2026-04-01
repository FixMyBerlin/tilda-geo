import { twJoin } from 'tailwind-merge'
import { CloseButton } from '@/components/shared/CloseButton/CloseButton'

type Props = {
  count: number
  handleClose: () => void
}

export const InspectorHeader = ({ count, handleClose }: Props) => {
  return (
    <>
      <h2
        className={twJoin(
          'mb-3 text-base font-medium text-gray-900',
          count > 1 ? '' : 'text-white',
        )}
      >
        {count} Elemente:
      </h2>
      <CloseButton onClick={handleClose} positionClasses="top-3 right-3" />
    </>
  )
}
