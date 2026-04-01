import { useBbox } from './useBbox'

export const useQueryKey = () => {
  const bbox = useBbox()
  return ['osmNotes', bbox]
}
