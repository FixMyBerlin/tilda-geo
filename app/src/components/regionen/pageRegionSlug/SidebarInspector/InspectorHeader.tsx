import { CloseButton } from '@/components/shared/CloseButton/CloseButton'

type Props = {
  count: number
  handleClose: () => void
}

export const InspectorHeader = ({ count, handleClose }: Props) => {
  return (
    <div className="mb-2 flex items-center gap-2">
      <h2 className="min-w-0 flex-1 text-base font-medium text-gray-900">
        {count > 1 ? `${count} Elemente:` : <span className="sr-only">{count} Element</span>}
      </h2>
      <CloseButton onClick={handleClose} positionClasses="static shrink-0" />
    </div>
  )
}
