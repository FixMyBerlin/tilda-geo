import { getRouteApi } from '@tanstack/react-router'
import { compactMeasureModeParam } from '@/components/regionen/pageRegionSlug/modes/measure/measureModeParam'
import { useMeasureAutomaticBackground } from '@/components/regionen/pageRegionSlug/modes/measure/useMeasureAutomaticBackground'
import { useCurrentMode } from '@/components/regionen/pageRegionSlug/modes/useCurrentMode'
import { isPrivateBackgroundParam } from '@/server/private-backgrounds/privateBackgroundParam'
import { searchParamsRegistry } from '@/shared/regionen/searchParamsRegistry'
import { defaultBackgroundParam, type BackgroundParam } from './backgroundParam.const'
import { useRegionSearchNavigation } from './useRegionSearchNavigation'

const routeApi = getRouteApi('/regionen/$regionSlug')

/**
 * The background the map shows, and how to change it.
 *
 * Everywhere but in the Messen mode that is the `bg` param. Measuring needs an aerial image,
 * so the Messen mode has its own background: the best aerial for the place
 * (`useMeasureAutomaticBackground`), or the one picked by hand while measuring (`measure.bg`).
 * `bg` is left alone, so leaving the mode brings the previous background back.
 */
export const useBackgroundParam = () => {
  const { isMeasure } = useCurrentMode()
  const automaticBackground = useMeasureAutomaticBackground()
  const { search, updateSearch } = useRegionSearchNavigation()
  const privateBackgrounds = routeApi.useLoaderData({ select: (data) => data.privateBackgrounds })
  const measure = search[searchParamsRegistry.measure]
  const searchBackground = isMeasure
    ? (measure?.bg ?? automaticBackground ?? search[searchParamsRegistry.bg])
    : search[searchParamsRegistry.bg]

  // A link with a private background can reach someone who may not see it (shared by a member,
  // or opened after sign-out). Everything that depends on the background then uses the default.
  const backgroundParam: BackgroundParam =
    isPrivateBackgroundParam(searchBackground) &&
    !privateBackgrounds.some((source) => source.id === searchBackground)
      ? defaultBackgroundParam
      : searchBackground

  const setBackgroundParam = (value: BackgroundParam) => {
    if (isMeasure) {
      updateSearch(
        {
          [searchParamsRegistry.measure]: compactMeasureModeParam({
            ...measure,
            // Picking the automatic aerial means "automatic" again.
            bg: value === automaticBackground ? undefined : value,
          }),
        },
        { replace: true },
      )
      return
    }
    // replace (switching background should not push history) + drop the default from the URL
    // (clearOnDefault parity with the old nuqs parser).
    updateSearch(
      { [searchParamsRegistry.bg]: value === defaultBackgroundParam ? undefined : value },
      { replace: true },
    )
  }

  return {
    backgroundParam,
    setBackgroundParam,
    /** Set in the Messen mode: the aerial the mode shows unless another one was picked. */
    automaticBackground,
  }
}
