import invariant from 'tiny-invariant'
import { staticRegion } from '@/data/regions.const'
import { useRegionSlug } from './useRegionSlug'

export const useStaticRegion = () => {
  const regionSlug = useRegionSlug()
  const resultRegion = staticRegion.find((data) => data.slug === regionSlug)
  invariant(resultRegion)
  return resultRegion
}
