import type React from 'react'
import type { StoreFeaturesInspector } from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapState'
import { useRegionDatasetsQuery } from '@/components/regionen/pageRegionSlug/hooks/useRegionDataQueries'
import { internalNotesSourceId } from '@/components/regionen/pageRegionSlug/Map/SourcesAndLayers/SourcesLayersInternalNotes'
import { osmNotesSourceId } from '@/components/regionen/pageRegionSlug/Map/SourcesAndLayers/SourcesLayersOsmNotes'
import { qaSourceId } from '@/components/regionen/pageRegionSlug/Map/SourcesAndLayers/SourcesLayersQa'
import { createInspectorFeatureKey } from '../utils/sourceKeyUtils/createInspectorFeatureKey'
import { parseSourceKeyStaticDatasets } from '../utils/sourceKeyUtils/sourceKeyUtilsStaticDataset'
import { InspectorFeatureInternalNote } from './InspectorFeatureInternalNote'
import { InspectorFeatureOsmNote } from './InspectorFeatureOsmNote'
import { InspectorFeatureQa } from './InspectorFeatureQa'
import { InspectorFeatureStaticDataset } from './InspectorFeatureStaticDataset'
import { InspectorFeatureTilda } from './InspectorFeatureTilda'
import { ToolsMissingTranslations } from './Tools/ToolsMissingTranslations'

export type InspectorFeatureProperty = NonNullable<GeoJSON.GeoJsonProperties>

export type InspectorFeature = {
  sourceKey: string
  feature: StoreFeaturesInspector['inspectorFeatures'][number]
}

export type InspectorOsmNoteFeature = Omit<InspectorFeature, 'sourceKey'>

type Props = {
  features: StoreFeaturesInspector['inspectorFeatures']
}

export const Inspector = ({ features }: Props) => {
  const { data: regionDatasets } = useRegionDatasetsQuery()

  return (
    <div className="space-y-4">
      {features.map((inspectObject) => {
        const sourceKey = String(inspectObject.source) // Format: `category:lit--source:atlas_lit--subcategory:lit`
        if (!sourceKey) return null

        let key: string
        let content: React.ReactNode
        if (inspectObject.source === osmNotesSourceId) {
          key = `${osmNotesSourceId}-${inspectObject?.properties?.id}`
          content = <InspectorFeatureOsmNote feature={inspectObject} />
        } else if (inspectObject.source === internalNotesSourceId) {
          key = `${internalNotesSourceId}-${inspectObject?.properties?.id}`
          content = <InspectorFeatureInternalNote noteId={inspectObject.properties.id} />
        } else if (inspectObject.source === qaSourceId) {
          key = `${qaSourceId}-${inspectObject?.properties?.id}`
          content = <InspectorFeatureQa feature={inspectObject} />
        } else if (
          // Inspector-Block for Datasets
          regionDatasets.some((d) => d.id === parseSourceKeyStaticDatasets(sourceKey).sourceId)
        ) {
          key = createInspectorFeatureKey(inspectObject)
          content = <InspectorFeatureStaticDataset sourceKey={sourceKey} feature={inspectObject} />
        } else {
          // Inspector-Block for Features
          key = createInspectorFeatureKey(inspectObject)
          content = <InspectorFeatureTilda sourceKey={sourceKey} feature={inspectObject} />
        }

        return <div key={key}>{content}</div>
      })}

      <ToolsMissingTranslations />
    </div>
  )
}
