import { useQueries } from '@tanstack/react-query'
import type { Feature } from 'geojson'
import { useBg3dParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useBg3dParam'
import { Disclosure } from '@/components/regionen/pageRegionSlug/SidebarInspector/Disclosure/Disclosure'
import {
  collectEligibleTerrainProfileLines,
  combineTerrainProfileData,
  terrainProfileQueryOptions,
} from '../compose/buildTerrainProfileData'
import { TerrainProfileChart } from './TerrainProfileChart'

type Props = {
  features: Feature[]
}

/**
 * Höhenprofil block; returns null when 3D is off or no line geometry is selected.
 *
 * Map hover markers: chart clears on pointer leave. Anything that hides this panel
 * (toggle 3D, clear selection, close inspector) requires leaving the chart first, so
 * leave already ran. We intentionally skip unmount cleanup for the theoretical case
 * where the panel disappears mid-hover without a leave event.
 */
export const SelectedFeatureTerrainProfilePanel = ({ features }: Props) => {
  const { is3dActive } = useBg3dParam()
  const eligible = collectEligibleTerrainProfileLines(features)
  const showProfile = is3dActive && eligible.length > 0

  const profileQuery = useQueries({
    queries: eligible.map((entry) => terrainProfileQueryOptions(entry, showProfile)),
    combine: (results) => {
      const isLoading = results.some((result) => result.isLoading)
      const isError = results.some((result) => result.isError)
      if (!showProfile || results.length === 0 || results.some((result) => !result.data)) {
        return { isLoading, isError, data: null }
      }
      return {
        isLoading,
        isError,
        data: combineTerrainProfileData(
          eligible.map((entry, index) => ({
            ...entry,
            profile: results[index]!.data!,
          })),
        ),
      }
    },
  })

  if (!showProfile) return null

  return (
    <Disclosure title="Höhenprofil" defaultOpen>
      <div className="space-y-3 p-3">
        {profileQuery.isLoading && (
          <p className="text-sm text-gray-600">Höhenprofil wird geladen …</p>
        )}
        {profileQuery.isError && (
          <p className="text-sm text-red-700">
            Höhenprofil konnte nicht geladen werden. Bitte später erneut versuchen.
          </p>
        )}
        {profileQuery.data && <TerrainProfileChart profile={profileQuery.data} />}
      </div>
    </Disclosure>
  )
}
