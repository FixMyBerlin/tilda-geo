import { useMapBounds } from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapState'

export const useBbox = () => {
  const mapBounds = useMapBounds()
  const bbox = mapBounds
    ?.toArray()
    ?.flat()
    ?.map((coord) => coord.toFixed(3))
    ?.join(',')

  return bbox
}
