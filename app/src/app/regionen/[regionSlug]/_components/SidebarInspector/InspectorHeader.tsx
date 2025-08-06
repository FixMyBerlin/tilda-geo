import { CloseButton } from '@/src/app/_components/CloseButton/CloseButton'
import { twJoin } from 'tailwind-merge'

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
      <CloseButton onClick={handleClose} positionClasses="right-3 top-3" />
    </>
  )
}
