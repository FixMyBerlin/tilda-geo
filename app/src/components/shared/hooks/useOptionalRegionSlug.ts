import { useParams } from '@tanstack/react-router'

export const useOptionalRegionSlug = () => {
  const params = useParams({ strict: false })
  return params?.regionSlug
}
