import { parseAsString, useQueryState } from 'nuqs'
import { searchParamsRegistry } from './searchParamsRegistry'
import { createMemoizer } from './utils/createMemoizer'

const memoizer = createMemoizer()

export const useQaParam = () => {
  const [qaParam, setQaParam] = useQueryState(
    searchParamsRegistry.qa,
    parseAsString.withDefault(''),
  )

  return memoizer({ qaParam, setQaParam })
}
