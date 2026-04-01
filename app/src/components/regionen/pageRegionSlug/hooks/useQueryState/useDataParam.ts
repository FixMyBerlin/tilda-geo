import { parseAsArrayOf, parseAsString, useQueryState } from 'nuqs'
import { searchParamsRegistry } from './searchParamsRegistry'

export const useDataParam = () => {
  const [dataParam, setDataParam] = useQueryState(
    searchParamsRegistry.data,
    parseAsArrayOf(parseAsString).withDefault([]),
  )

  return { dataParam, setDataParam }
}
