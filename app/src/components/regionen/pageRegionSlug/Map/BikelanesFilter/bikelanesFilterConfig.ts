import { mapboxStyleGroupLayers_atlas_bikelanes_default } from '@/components/regionen/pageRegionSlug/mapData/mapDataSubcategories/mapboxStyles/groups/atlas_bikelanes_default'

// Prototype filter: grey out bikelanes that don't match the selected Führungsform / Breite.
export const BIKELANES_FILTER_GREY_COLOR = '#9ca3af' // tailwind gray-400

// Human-readable labels for the Führungsform pills. Keyed by the layer `id` used in
// `atlas_bikelanes_default` (the generated "simple" grouping, which covers every `category`
// tile value) — reused here instead of duplicated so the pill groups can't drift from the
// groups actually painted by the default style.
const FUEHRUNGSFORM_LABELS: Record<string, string> = {
  'fuehrung baul. abgesetzt von Kfz': 'Baul. abgesetzt',
  'Fuehrung eigenstaendig auf Fahrbahn': 'Auf Fahrbahn',
  'Fuehrung mit Fussverkehr': 'Mit Fußverkehr',
  'Gehweg Rad frei': 'Fußweg, Rad frei',
  'Fuehrung mit Kfz-explizit': 'Mit Kfz (explizit)',
  needsClarification: 'Unklar',
}

const getMatchFilterValues = (filter: unknown): string[] => {
  if (Array.isArray(filter) && filter[0] === 'match' && Array.isArray(filter[2])) {
    return filter[2] as string[]
  }
  return []
}

export type BikelanesFuehrungsformGroup = {
  id: string
  label: string
  categoryValues: string[]
}

export const bikelanesFuehrungsformGroups: BikelanesFuehrungsformGroup[] =
  mapboxStyleGroupLayers_atlas_bikelanes_default
    .filter((layer) => typeof layer.id === 'string' && layer.id !== 'hitarea-bikelanes')
    .map((layer) => {
      const id = layer.id as string
      return {
        id,
        label: FUEHRUNGSFORM_LABELS[id] ?? id,
        categoryValues: getMatchFilterValues(layer.filter),
      }
    })

export type BikelanesOberflaecheGroup = {
  id: string
  label: string
  surfaceValues: string[]
}

// `surface` grouping mirrors the established paved/unpaved/Pflaster split already used for
// parking surfaces (`mapboxStyles/groups/park_street_surface.ts`) — same OSM `surface` tag,
// same three buckets, reused here for consistency rather than inventing a new grouping.
export const bikelanesOberflaecheGroups: BikelanesOberflaecheGroup[] = [
  {
    id: 'paved',
    label: 'Befestigt',
    surfaceValues: [
      'concrete',
      'concrete:plates',
      'concrete:lanes',
      'asphalt',
      'bricks',
      'metal',
      'metal_grid',
      'paved',
      'plastic',
      'rubber',
      'wood',
    ],
  },
  {
    id: 'pavingStones',
    label: 'Pflaster',
    surfaceValues: [
      'cobblestone',
      'sett',
      'paving_stones',
      'large_sett',
      'mosaic_sett',
      'pebblestone',
      'small_sett',
      'stone',
    ],
  },
  {
    id: 'unpaved',
    label: 'Unbefestigt',
    surfaceValues: [
      'ground',
      'grass_paver',
      'compacted',
      'grass',
      'fine_gravel',
      'gravel',
      'sand',
      'unpaved',
      'woodchips',
      'earth',
      'dirt',
    ],
  },
]
