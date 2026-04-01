import { parseAsString, useQueryState } from 'nuqs'
import { searchParamsRegistry } from './searchParamsRegistry'

export const defaultBackgroundParam = 'default'

export const useBackgroundParam = () => {
  const [backgroundParam, setBackgroundParam] = useQueryState(
    searchParamsRegistry.bg,
    parseAsString.withDefault(defaultBackgroundParam),
  )

  return { backgroundParam, setBackgroundParam }
}
