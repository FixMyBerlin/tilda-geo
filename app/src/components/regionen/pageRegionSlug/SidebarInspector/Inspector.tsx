import type { StoreFeaturesInspector } from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapState'
import { useRegionDatasetsQuery } from '@/components/regionen/pageRegionSlug/hooks/useRegionDataQueries'
import { SelectedFeatureTerrainProfilePanel } from '../terrainProfile/ui/SelectedFeatureTerrainProfilePanel'
import { createInspectorFeatureKey } from '../utils/sourceKeyUtils/createInspectorFeatureKey'
import { parseSourceKeyStaticDatasets } from '../utils/sourceKeyUtils/sourceKeyUtilsStaticDataset'
import { InspectorFeatureStaticDataset } from './InspectorFeatureStaticDataset'
import { InspectorFeatureTilda } from './InspectorFeatureTilda'
import { InspectorHints } from './InspectorHints'
import { ToolsMissingTranslations } from './Tools/ToolsMissingTranslations'

export type InspectorFeatureProperty = NonNullable<GeoJSON.GeoJsonProperties>

export type InspectorFeature = {
  sourceKey: string
  feature: StoreFeaturesInspector['inspectorFeatures'][number]
}

type Props = {
  features: StoreFeaturesInspector['inspectorFeatures']
}

export const Inspector = ({ features }: Props) => {
  const { data: regionDatasets } = useRegionDatasetsQuery()

  return (
    <div className="space-y-2">
      {features.map((inspectObject) => {
        const sourceKey = String(inspectObject.source) // Format: `category:lit--source:atlas_lit--subcategory:lit`
        if (!sourceKey) return null

        const key = createInspectorFeatureKey(inspectObject)
        const content = regionDatasets.some(
          (d) => d.id === parseSourceKeyStaticDatasets(sourceKey).sourceId,
        ) ? (
          <InspectorFeatureStaticDataset sourceKey={sourceKey} feature={inspectObject} />
        ) : (
          <InspectorFeatureTilda sourceKey={sourceKey} feature={inspectObject} />
        )

        return <div key={key}>{content}</div>
      })}

      <SelectedFeatureTerrainProfilePanel features={features} />

      <InspectorHints />

      <ToolsMissingTranslations />
    </div>
  )
}
