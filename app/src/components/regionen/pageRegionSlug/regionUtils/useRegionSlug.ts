import { useParams } from '@tanstack/react-router'
import invariant from 'tiny-invariant'

export const useRegionSlug = () => {
  const params = useParams({ strict: false })
  const regionSlug = params?.regionSlug
  invariant(regionSlug)

  return regionSlug as string
}
