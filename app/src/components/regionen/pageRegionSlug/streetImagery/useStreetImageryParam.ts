import type { DateRange } from '@osm-editor-kit/street-imagery'
import { useRegionSearchNavigation } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useRegionSearchNavigation'
import { searchParamsRegistry } from '@/shared/regionen/searchParamsRegistry'
import {
  compactStreetImageryParam,
  defaultStreetImageryDate,
  defaultStreetImageryParam,
  defaultStreetImageryStyle,
  type StreetImageryParam,
  type StreetImageryProviderId,
  type StreetImageryStyleId,
} from './streetImageryParam'

export const useStreetImageryParam = () => {
  const { search, updateSearch } = useRegionSearchNavigation()
  const param = search[searchParamsRegistry.photos] ?? defaultStreetImageryParam

  const update = (change: (current: StreetImageryParam) => StreetImageryParam) => {
    updateSearch(
      (prev) => ({
        [searchParamsRegistry.photos]: compactStreetImageryParam(
          change(prev[searchParamsRegistry.photos] ?? defaultStreetImageryParam),
        ),
      }),
      { replace: true },
    )
  }

  const toggleProvider = (providerId: StreetImageryProviderId) => {
    update((current) => {
      const providers = current.providers.includes(providerId)
        ? current.providers.filter((id) => id !== providerId)
        : [...current.providers, providerId]
      return { ...current, providers }
    })
  }

  const setStyle = (style: StreetImageryStyleId) => update((current) => ({ ...current, style }))

  const setDate = (date: DateRange) => update((current) => ({ ...current, date }))

  const setPhoto = (photo: StreetImageryParam['photo']) =>
    update((current) => ({ ...current, photo }))

  return {
    providers: param.providers,
    style: param.style ?? defaultStreetImageryStyle,
    date: param.date ?? defaultStreetImageryDate(),
    photo: param.photo,
    toggleProvider,
    setStyle,
    setDate,
    setPhoto,
  }
}
