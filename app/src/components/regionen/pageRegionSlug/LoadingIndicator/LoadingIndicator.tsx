import { useShowMapLoadingIndicator } from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapState'
import { Spinner } from '@/components/shared/Spinner/Spinner'
import { Tooltip } from '@/components/shared/Tooltip/Tooltip'

export const LoadingIndicator = () => {
  const showIndicator = useShowMapLoadingIndicator()

  if (showIndicator === false) return null

  return (
    <output
      className="relative block rounded-md bg-teal-700"
      aria-busy="true"
      aria-label="Kartendaten werden geladen"
    >
      <Tooltip
        text="Kartendaten werden geladen…"
        className="flex size-9 cursor-help items-center justify-center"
      >
        <Spinner color="teal" screenReaderLabel={false} size="5" />
      </Tooltip>
    </output>
  )
}
