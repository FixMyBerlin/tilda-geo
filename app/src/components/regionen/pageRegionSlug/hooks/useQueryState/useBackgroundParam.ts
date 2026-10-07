import { getRouteApi } from '@tanstack/react-router'
import { isPrivateBackgroundParam } from '@/server/private-backgrounds/privateBackgroundParam'
import { searchParamsRegistry } from '@/shared/regionen/searchParamsRegistry'
import { defaultBackgroundParam } from './backgroundParam.const'
import { useRegionSearchNavigation } from './useRegionSearchNavigation'

const routeApi = getRouteApi('/regionen/$regionSlug')

export const useBackgroundParam = () => {
  const { search, updateSearch } = useRegionSearchNavigation()
  const privateBackgrounds = routeApi.useLoaderData({ select: (data) => data.privateBackgrounds })
  const searchBackground = search[searchParamsRegistry.bg]

  // A link with a private background can reach someone who may not see it (shared by a member,
  // or opened after sign-out). Everything that depends on the background then uses the default.
  const backgroundParam =
    isPrivateBackgroundParam(searchBackground) &&
    !privateBackgrounds.some((source) => source.id === searchBackground)
      ? defaultBackgroundParam
      : searchBackground

  const setBackgroundParam = (value: typeof backgroundParam) => {
    // replace (switching background should not push history) + drop the default from the URL
    // (clearOnDefault parity with the old nuqs parser).
    updateSearch(
      { [searchParamsRegistry.bg]: value === defaultBackgroundParam ? undefined : value },
      { replace: true },
    )
  }

  return { backgroundParam, setBackgroundParam }
}
