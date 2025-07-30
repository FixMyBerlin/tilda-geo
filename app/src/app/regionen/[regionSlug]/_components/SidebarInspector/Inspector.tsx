import { StoreFeaturesInspector } from '../../_hooks/mapState/useMapState'
import { useRegionDatasets } from '../../_hooks/useRegionDatasets/useRegionDatasets'
import { internalNotesSourceId } from '../Map/SourcesAndLayers/SourcesLayersInternalNotes'
import { osmNotesSourceId } from '../Map/SourcesAndLayers/SourcesLayersOsmNotes'
import { qaSourceId } from '../Map/SourcesAndLayers/SourcesLayersQa'
import { createInspectorFeatureKey } from '../utils/sourceKeyUtils/createInspectorFeatureKey'
import { parseSourceKeyStaticDatasets } from '../utils/sourceKeyUtils/sourceKeyUtilsStaticDataset'
import { InspectorFeatureAtlasGeo } from './InspectorFeatureAtlasGeo'
import { InspectorFeatureInternalNote } from './InspectorFeatureInternalNote'
import { InspectorFeatureOsmNote } from './InspectorFeatureOsmNote'
import { InspectorFeatureQa } from './InspectorFeatureQa'
import { InspectorFeatureStaticDataset } from './InspectorFeatureStaticDataset'

export type InspectorFeatureProperty = NonNullable<GeoJSON.GeoJsonProperties>

export type InspectorFeature = {
  sourceKey: string
  feature: StoreFeaturesInspector['inspectorFeatures'][number]
}

export type InspectorOsmNoteFeature = Omit<InspectorFeature, 'sourceKey'>

type Props = { features: StoreFeaturesInspector['inspectorFeatures'] }

export const Inspector = ({ features }: Props) => {
  const regionDatasets = useRegionDatasets()

  return (
    <>
      {features.map((inspectObject) => {
        const sourceKey = String(inspectObject.source) // Format: `category:lit--source:atlas_lit--subcategory:lit`
        if (!sourceKey) return null

        // Inspector-Block for Notes
        if (inspectObject.source === osmNotesSourceId) {
          return (
            <InspectorFeatureOsmNote
              key={`${osmNotesSourceId}-${inspectObject?.properties?.id}`}
              feature={inspectObject}
            />
          )
        }
        if (inspectObject.source === internalNotesSourceId) {
          return (
            <InspectorFeatureInternalNote
              key={`${internalNotesSourceId}-${inspectObject?.properties?.id}`}
              noteId={inspectObject.properties.id}
            />
          )
        }
        if (inspectObject.source === qaSourceId) {
          return (
            <InspectorFeatureQa
              key={`${qaSourceId}-${inspectObject?.properties?.id}`}
              feature={inspectObject}
            />
          )
        }

        // Inspector-Block for Datasets
        const isDataset = regionDatasets.some(
          (d) => d.id === parseSourceKeyStaticDatasets(sourceKey).sourceId,
        )
        if (isDataset) {
          return (
            <InspectorFeatureStaticDataset
              key={createInspectorFeatureKey(inspectObject)}
              sourceKey={sourceKey}
              feature={inspectObject}
            />
          )
        }

        // Inspector-Block for Features
        return (
          <InspectorFeatureAtlasGeo
            key={createInspectorFeatureKey(inspectObject)}
            sourceKey={sourceKey}
            feature={inspectObject}
          />
        )
      })}
    </>
  )
}
