import { mapboxStyleGroupLayers_park_off_default_area } from '../../../src/components/regionen/pageRegionSlug/mapData/mapDataSubcategories/mapboxStyles/groups/park_off_default_area'
import { mapboxStyleGroupLayers_park_street_default } from '../../../src/components/regionen/pageRegionSlug/mapData/mapDataSubcategories/mapboxStyles/groups/park_street_default'
import { mapboxStyleGroupLayers_park_street_no } from '../../../src/components/regionen/pageRegionSlug/mapData/mapDataSubcategories/mapboxStyles/groups/park_street_no'
import { mapboxStyleGroupLayers_park_street_pattern } from '../../../src/components/regionen/pageRegionSlug/mapData/mapDataSubcategories/mapboxStyles/groups/park_street_pattern'
import {
  loadConditionCategoryLabels,
  validateLegendLabels,
} from '../lib/loadConditionCategoryLabels'
import {
  convertOffStreetArea,
  convertParallelPattern,
  convertParkingNo,
  convertStreetDefaultLine,
} from '../lib/mapboxLayerToMasterportal'
import { parseConditionCategoryCase } from '../lib/parseConditionCategoryCase'
import type { GpkgManifestEntry, MasterportalStyleDefinition } from '../lib/types'
import { withoutOperatorTypeFilter } from '../lib/withoutOperatorTypeFilter'

const GPKG_FILE = 'parking_public.gpkg'

export type ParkingPublicGpkgProfileOptions = {
  zoom: number
}

/**
 * Styles aligned with `scripts/tilda-parkraum-euvm-export` → `output/parking_public.gpkg`.
 *
 * Masterportal: import the bundled JSON once into global `style.json`, then reference
 * each `styleId` from one WFS/GeoJSON layer per GPKG layer in `config.json`.
 */
export const buildParkingPublicGpkgStyles = (options: ParkingPublicGpkgProfileOptions) => {
  const streetLine = mapboxStyleGroupLayers_park_street_default[0] as Record<string, unknown>
  const parallelPattern = mapboxStyleGroupLayers_park_street_pattern[0] as Record<string, unknown>
  const offFill = mapboxStyleGroupLayers_park_off_default_area[0] as Record<string, unknown>
  const offOutline = mapboxStyleGroupLayers_park_off_default_area[1] as Record<string, unknown>
  const parkingNo = mapboxStyleGroupLayers_park_street_no[0] as Record<string, unknown>

  const labels = loadConditionCategoryLabels()
  const streetPaint = (streetLine.paint ?? {}) as Record<string, unknown>
  const { rules: cascadeRules } = parseConditionCategoryCase(streetPaint['line-color'])
  const { warnings: legendWarnings, errors: legendErrors } = validateLegendLabels(
    cascadeRules.map((rule) => rule.token),
  )

  if (legendErrors.length > 0) {
    throw new Error(`Legend validation failed:\n${legendErrors.join('\n')}`)
  }

  const legendOptions = { ...options, labels }

  const onStreetLineRules = withoutOperatorTypeFilter(
    convertStreetDefaultLine('_tmp_on_street_line', streetLine, legendOptions).rules,
  )
  const onStreetPatternRules = withoutOperatorTypeFilter(
    convertParallelPattern('_tmp_on_street_pattern', parallelPattern, options).rules,
  )

  const onStreet: MasterportalStyleDefinition = {
    styleId: 'parking_public_on_street',
    rules: [...onStreetLineRules, ...onStreetPatternRules],
  }

  const offStreet: MasterportalStyleDefinition = {
    styleId: 'parking_public_off_street',
    rules: withoutOperatorTypeFilter(
      convertOffStreetArea('_tmp_off_street', offFill, offOutline, legendOptions).rules,
    ),
  }

  const noParking = convertParkingNo('parking_public_no_parking', parkingNo, options)

  const styles: MasterportalStyleDefinition[] = [onStreet, offStreet, noParking]

  const gpkgManifest: GpkgManifestEntry[] = [
    {
      gpkgLayer: 'parking_public_on_street',
      styleId: 'parking_public_on_street',
      geometryType: 'LineString',
      gpkgFile: GPKG_FILE,
      mapboxSourceFiles: ['park_street_default.ts', 'park_street_pattern.ts'],
      notes: [
        'Entspricht gefiltertem parkings-Export (nicht-privat); parallel-Muster nur für orientation=parallel',
        'Keine Kapazitäts-Labels, keine separaten Schatten-Flächen (nicht im GPKG)',
      ],
    },
    {
      gpkgLayer: 'parking_public_off_street',
      styleId: 'parking_public_off_street',
      geometryType: 'Polygon',
      gpkgFile: GPKG_FILE,
      mapboxSourceFiles: ['park_off_default_area.ts'],
      notes: ['Nur öffentliche Flächen; keine Garagen-Punkte oder Kapazitäts-Labels im GPKG'],
    },
    {
      gpkgLayer: 'parking_public_no_parking',
      styleId: 'parking_public_no_parking',
      geometryType: 'MultiLineString',
      gpkgFile: GPKG_FILE,
      mapboxSourceFiles: ['park_street_no.ts'],
      notes: ['parkings_no mit parking in (no_parking, no_stopping), nicht-privat'],
    },
  ]

  const masterportalLayerSnippet = gpkgManifest.map((entry) => ({
    id: entry.gpkgLayer,
    styleId: entry.styleId,
    comment: `GPKG layer ${entry.gpkgLayer} in ${GPKG_FILE}`,
  }))

  return { styles, gpkgManifest, masterportalLayerSnippet, legendWarnings }
}
