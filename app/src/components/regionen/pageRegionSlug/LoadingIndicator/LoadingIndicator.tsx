import { useShowMapLoadingIndicator } from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapState'
import { Spinner } from '@/components/shared/Spinner/Spinner'
import { Tooltip } from '@/components/shared/Tooltip/Tooltip'

export const LoadingIndicator = () => {
  const showIndicator = useShowMapLoadingIndicator()

  if (showIndicator === false) return null

  return (
    <div className="relative rounded-md bg-teal-700">
      <Tooltip text="Kartendaten werden geladen…" className="cursor-help p-2">
        <Spinner size="5" color="teal" />
      </Tooltip>
    </div>
  )
}
