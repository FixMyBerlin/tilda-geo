import type { BackgroundStyleId } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/backgroundStyles.const'

export const mapStyleUrl = (styleId: BackgroundStyleId) =>
  `${import.meta.env.VITE_APP_ORIGIN}/api/map-style/${styleId}`
