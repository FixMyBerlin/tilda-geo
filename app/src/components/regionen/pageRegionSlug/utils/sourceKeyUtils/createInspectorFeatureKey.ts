import type { StoreFeaturesInspector } from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapState'

export const createInspectorFeatureKey = (
  feature: StoreFeaturesInspector['inspectorFeatures'][number],
) => `${feature.source}-${feature.id}`
