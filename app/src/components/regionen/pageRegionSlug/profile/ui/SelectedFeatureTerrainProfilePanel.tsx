import { useQuery } from '@tanstack/react-query'
import type { Feature } from 'geojson'
import { useEffect } from 'react'
import { useBg3dParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useBg3dParam'
import { Disclosure } from '@/components/regionen/pageRegionSlug/SidebarInspector/Disclosure/Disclosure'
import { buildTerrainProfileData } from '../compose/buildTerrainProfileData'
import {
  terrainProfileGeometryFingerprint,
  terrainProfileGeometryFromFeature,
} from '../geometry/terrainProfileGeometryFromFeature'
import { useTerrainProfileHoverActions } from '../state/terrain-profile-hover-store'
import { TerrainProfileChart } from './TerrainProfileChart'
import { TerrainProfileStatsView } from './TerrainProfileStats'

type Props = {
  feature: Feature
}

const getFeatureLengthMeters = (feature: Feature) => {
  const lengthValue = feature.properties?.length
  if (typeof lengthValue === 'number' && lengthValue > 0) return lengthValue
  if (typeof lengthValue === 'string') {
    const parsed = Number.parseFloat(lengthValue)
    if (Number.isFinite(parsed) && parsed > 0) return parsed
  }
  return null
}

export const terrainProfileQueryKey = (feature: Feature, geometryFingerprint: string) => [
  'terrain-profile',
  feature.id ?? feature.properties?.id ?? geometryFingerprint,
  geometryFingerprint,
]

export const SelectedFeatureTerrainProfilePanel = ({ feature }: Props) => {
  const { is3dTerrainActive } = useBg3dParam()
  const { clearHoverSampleIndex } = useTerrainProfileHoverActions()
  const geometry = terrainProfileGeometryFromFeature(feature)
  const geometryFingerprint = geometry ? terrainProfileGeometryFingerprint(geometry) : ''

  useEffect(
    function clearTerrainProfileHoverOnFeatureChange() {
      clearHoverSampleIndex()
    },
    [clearHoverSampleIndex, feature],
  )

  const query = useQuery({
    queryKey: terrainProfileQueryKey(feature, geometryFingerprint),
    queryFn: () =>
      buildTerrainProfileData(geometry!, {
        featureLengthMeters: getFeatureLengthMeters(feature),
      }),
    enabled: is3dTerrainActive && geometry !== null,
    staleTime: 5 * 60 * 1000,
  })

  if (!is3dTerrainActive || !geometry) return null

  return (
    <Disclosure title="Höhenprofil" defaultOpen>
      <div className="space-y-3 p-3">
        {query.isLoading && <p className="text-sm text-gray-600">Höhenprofil wird geladen …</p>}
        {query.isError && (
          <p className="text-sm text-red-700">
            Höhenprofil konnte nicht geladen werden. Bitte später erneut versuchen.
          </p>
        )}
        {query.data && (
          <>
            <TerrainProfileChart profile={query.data} />
            <TerrainProfileStatsView stats={query.data.stats} />
          </>
        )}
      </div>
    </Disclosure>
  )
}
