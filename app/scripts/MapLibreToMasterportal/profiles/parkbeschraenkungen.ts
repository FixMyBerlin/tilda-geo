import { mapboxStyleGroupLayers_park_off_default_area } from '../../../src/components/regionen/pageRegionSlug/mapData/mapDataSubcategories/mapboxStyles/groups/park_off_default_area'
import { mapboxStyleGroupLayers_park_off_default_points } from '../../../src/components/regionen/pageRegionSlug/mapData/mapDataSubcategories/mapboxStyles/groups/park_off_default_points'
import { mapboxStyleGroupLayers_park_off_labels } from '../../../src/components/regionen/pageRegionSlug/mapData/mapDataSubcategories/mapboxStyles/groups/park_off_labels'
import { mapboxStyleGroupLayers_park_street_areas_shadow } from '../../../src/components/regionen/pageRegionSlug/mapData/mapDataSubcategories/mapboxStyles/groups/park_street_areas_shadow'
import { mapboxStyleGroupLayers_park_street_default } from '../../../src/components/regionen/pageRegionSlug/mapData/mapDataSubcategories/mapboxStyles/groups/park_street_default'
import { mapboxStyleGroupLayers_park_street_label } from '../../../src/components/regionen/pageRegionSlug/mapData/mapDataSubcategories/mapboxStyles/groups/park_street_label'
import { mapboxStyleGroupLayers_park_street_pattern } from '../../../src/components/regionen/pageRegionSlug/mapData/mapDataSubcategories/mapboxStyles/groups/park_street_pattern'
import {
  loadConditionCategoryLabels,
  validateLegendLabels,
} from '../lib/loadConditionCategoryLabels'
import {
  convertCirclePoints,
  convertLabels,
  convertOffStreetArea,
  convertParallelPattern,
  convertShadowArea,
  convertStreetDefaultLine,
} from '../lib/mapboxLayerToMasterportal'
import { parseConditionCategoryCase } from '../lib/parseConditionCategoryCase'
import type { ManifestEntry, MasterportalStyleDefinition } from '../lib/types'

const TILES_BASE = 'https://tiles.tilda-geo.de'

export type ParkbeschraenkungenProfileOptions = {
  zoom: number
}

export const buildParkbeschraenkungenStyles = (options: ParkbeschraenkungenProfileOptions) => {
  const streetLine = mapboxStyleGroupLayers_park_street_default[0] as Record<string, unknown>
  const parallelPattern = mapboxStyleGroupLayers_park_street_pattern[0] as Record<string, unknown>
  const shadowFill = mapboxStyleGroupLayers_park_street_areas_shadow[0] as Record<string, unknown>
  const shadowOutline = mapboxStyleGroupLayers_park_street_areas_shadow[1] as Record<
    string,
    unknown
  >
  const streetLabel = mapboxStyleGroupLayers_park_street_label[0] as Record<string, unknown>
  const offFill = mapboxStyleGroupLayers_park_off_default_area[0] as Record<string, unknown>
  const offOutline = mapboxStyleGroupLayers_park_off_default_area[1] as Record<string, unknown>
  const offPoint = mapboxStyleGroupLayers_park_off_default_points[0] as Record<string, unknown>
  const offLabel = mapboxStyleGroupLayers_park_off_labels[0] as Record<string, unknown>

  const labels = loadConditionCategoryLabels()
  const streetPaint = (streetLine.paint ?? {}) as Record<string, unknown>
  const { rules: cascadeRules } = parseConditionCategoryCase(streetPaint['line-color'])
  const cascadeTokens = cascadeRules.map((rule) => rule.token)
  const { warnings: legendWarnings, errors: legendErrors } = validateLegendLabels(cascadeTokens)

  if (legendErrors.length > 0) {
    throw new Error(`Legend validation failed:\n${legendErrors.join('\n')}`)
  }

  const legendOptions = { ...options, labels }

  const styles: MasterportalStyleDefinition[] = [
    convertStreetDefaultLine('tilda_parkings_parkbeschraenkungen_line', streetLine, legendOptions),
    convertParallelPattern(
      'tilda_parkings_parkbeschraenkungen_pattern_parallel',
      parallelPattern,
      options,
    ),
    convertShadowArea('tilda_parkings_separate_shadow', shadowFill, shadowOutline),
    convertLabels('tilda_parkings_labels', streetLabel, options.zoom),
    convertOffStreetArea(
      'tilda_off_street_parkbeschraenkungen_area',
      offFill,
      offOutline,
      legendOptions,
    ),
    convertCirclePoints('tilda_off_street_points', offPoint),
    convertLabels('tilda_off_street_labels', offLabel, options.zoom),
  ]

  const manifest: ManifestEntry[] = [
    {
      styleId: 'tilda_parkings_parkbeschraenkungen_line',
      tileUrl: `${TILES_BASE}/atlas_generalized_parkings,atlas_generalized_parkings_labels,atlas_generalized_parkings_separate/{z}/{x}/{y}`,
      sourceLayer: 'parkings',
      geometryType: 'LineString',
      mapboxSourceFile: 'park_street_default.ts',
      limitations: [
        'Nur Features mit capacity-Attribut (Mapbox-Filter)',
        'Linienbreite auf Zoom 17 eingefroren',
        'Diagonale/senkrechte Muster (Sprites) nicht konvertiert',
      ],
    },
    {
      styleId: 'tilda_parkings_parkbeschraenkungen_pattern_parallel',
      tileUrl: `${TILES_BASE}/atlas_generalized_parkings,atlas_generalized_parkings_labels,atlas_generalized_parkings_separate/{z}/{x}/{y}`,
      sourceLayer: 'parkings',
      geometryType: 'LineString',
      mapboxSourceFile: 'park_street_pattern.ts',
      limitations: [
        'Nur parallele Ausrichtung; diagonal/perpendicular fehlen',
        'Linienbreite auf Zoom 17 eingefroren',
      ],
    },
    {
      styleId: 'tilda_parkings_separate_shadow',
      tileUrl: `${TILES_BASE}/atlas_generalized_parkings,atlas_generalized_parkings_labels,atlas_generalized_parkings_separate/{z}/{x}/{y}`,
      sourceLayer: 'parkings_separate',
      geometryType: 'Polygon',
      mapboxSourceFile: 'park_street_areas_shadow.ts',
    },
    {
      styleId: 'tilda_parkings_labels',
      tileUrl: `${TILES_BASE}/atlas_generalized_parkings,atlas_generalized_parkings_labels,atlas_generalized_parkings_separate/{z}/{x}/{y}`,
      sourceLayer: 'parkings_labels',
      geometryType: 'Point',
      mapboxSourceFile: 'park_street_label.ts',
      limitations: ['Textrotation (angle) nicht übernommen', 'Textgröße auf Zoom 17 eingefroren'],
    },
    {
      styleId: 'tilda_off_street_parkbeschraenkungen_area',
      tileUrl: `${TILES_BASE}/atlas_generalized_off_street_parking_areas,atlas_generalized_off_street_parking_area_labels,atlas_generalized_off_street_parking_points/{z}/{x}/{y}`,
      sourceLayer: 'off_street_parking_areas',
      geometryType: 'Polygon',
      mapboxSourceFile: 'park_off_default_area.ts',
      limitations: ['Umrissbreite auf Zoom 17 eingefroren'],
    },
    {
      styleId: 'tilda_off_street_points',
      tileUrl: `${TILES_BASE}/atlas_generalized_off_street_parking_areas,atlas_generalized_off_street_parking_area_labels,atlas_generalized_off_street_parking_points/{z}/{x}/{y}`,
      sourceLayer: 'off_street_parking_points',
      geometryType: 'Point',
      mapboxSourceFile: 'park_off_default_points.ts',
      limitations: ['Kreisradius fest auf 6px gesetzt (Mapbox circle-radius fehlt im Export)'],
    },
    {
      styleId: 'tilda_off_street_labels',
      tileUrl: `${TILES_BASE}/atlas_generalized_off_street_parking_areas,atlas_generalized_off_street_parking_area_labels,atlas_generalized_off_street_parking_points/{z}/{x}/{y}`,
      sourceLayer: 'off_street_parking_area_labels',
      geometryType: 'Point',
      mapboxSourceFile: 'park_off_labels.ts',
      limitations: ['Textrotation (angle) nicht übernommen', 'Textgröße auf Zoom 17 eingefroren'],
    },
  ]

  return { styles, manifest, legendWarnings }
}
