import type { FileMapDataSubcategoryStyleLegend } from '../types'

/**
 * Legend colors align with `park_street_default`, `park_off_default_area`, etc.
 * (see scripts/MapboxStyles — generated mapbox style groups).
 */

const parkingTildaLegendSeparateAreasShadow = {
  id: 'shadow',
  name: 'Separat erfasste Parkflächen',
  style: {
    type: 'fill' as const,
    color: 'rgba(97, 143, 168, 0.15)',
  },
} satisfies FileMapDataSubcategoryStyleLegend

/** Straßenraum — Parkbeschränkungen (`condition_category`), Linien + Schatten-Flächen. */
export const parkingTildaStreetDefaultLegends: FileMapDataSubcategoryStyleLegend[] = [
  {
    id: 'no_stopping',
    name: 'Absolutes Haltverbot',
    style: { type: 'line', color: '#EB0000' },
  },
  {
    id: 'bus_lane',
    name: 'Bussonderfahrstreifen',
    style: { type: 'line', color: '#EB0000' },
  },
  {
    id: 'no_parking',
    name: 'Eingeschränktes Haltverbot',
    style: { type: 'line', color: '#F97316' },
  },
  {
    id: 'disabled_private',
    name: 'Personenbezogener Behindertenparkplatz',
    style: { type: 'line', color: '#5B21B6' },
  },
  {
    id: 'disabled',
    name: 'Behindertenparkplatz',
    style: { type: 'line', color: '#8B5CF6' },
  },
  {
    id: 'loading',
    name: 'Ladezone',
    style: { type: 'line', color: '#93D6FF' },
  },
  {
    id: 'charging',
    name: 'Laden von Elektrofahrzeugen',
    style: { type: 'line', color: '#5EF20C' },
  },
  {
    id: 'taxi',
    name: 'Taxenstand',
    style: { type: 'line', color: '#FEE13A' },
  },
  {
    id: 'car_sharing',
    name: 'Nur für Carsharing-Fahrzeuge',
    style: { type: 'line', color: '#6B7280' },
  },
  {
    id: 'private',
    name: 'Privat',
    desc: [
      '`private` — in OSM als privat erfasst.',
      '`assumed_private` — ohne explizite Angabe als privat geschätzt.',
    ],
    style: { type: 'line', color: '#FF7162' },
  },
  {
    id: 'vehicle_restriction',
    name: 'Fahrzeugbeschränkung',
    desc: [
      '`vehicle_restriction` — Beschränkung auf Fahrzeugklassen.',
      '`maxweight` — Gewichtsbegrenzung.',
    ],
    style: { type: 'line', color: '#6B7280' },
  },
  {
    id: 'access_restriction',
    name: 'Zugangsbeschränkung',
    style: { type: 'line', color: '#4B5563' },
  },
  {
    id: 'mixed',
    name: 'Nur mit Parkschein oder Bewohnerparkausweis',
    style: { type: 'line', color: '#2EB499' },
  },
  {
    id: 'residents',
    name: 'Nur mit Bewohnerparkausweis',
    style: { type: 'line', color: '#BE3C3C' },
  },
  {
    id: 'paid',
    name: 'Nur mit Parkschein',
    style: { type: 'line', color: '#0E7490' },
  },
  {
    id: 'time_limited',
    name: 'Höchstparkdauer',
    style: { type: 'line', color: '#60A5FA' },
  },
  {
    id: 'free',
    name: 'Keine Parkbeschränkungen',
    desc: [
      '`free` — in OSM explizit keine Gebühren und keine Beschränkungen erfasst.',
      '`assumed_free` — keine Angaben in OSM, daher als frei von Beschränkungen angenommen.',
    ],
    style: { type: 'line', color: '#16A34A' },
  },
  {
    id: 'unspecified',
    name: 'Unbestimmt / Sonstiges',
    desc: [
      '`unspecified` — Bedingung nicht eindeutig klassifizierbar.',
      '`default` — Fallback, wenn keine andere Kategorie passt.',
    ],
    style: { type: 'line', color: '#4B5563' },
  },
  parkingTildaLegendSeparateAreasShadow,
]

/** Abseits — Parkbeschränkungen (`condition_category`), Füllflächen. */
export const parkingTildaOffStreetDefaultLegends: FileMapDataSubcategoryStyleLegend[] = [
  {
    id: 'no_stopping',
    name: 'Absolutes Haltverbot',
    style: { type: 'fill', color: '#EB0000' },
  },
  {
    id: 'bus_lane',
    name: 'Bussonderfahrstreifen',
    style: { type: 'fill', color: '#EB0000' },
  },
  {
    id: 'no_parking',
    name: 'Eingeschränktes Haltverbot',
    style: { type: 'fill', color: '#F97316' },
  },
  {
    id: 'disabled_private',
    name: 'Personenbezogener Behindertenparkplatz',
    style: { type: 'fill', color: '#5B21B6' },
  },
  {
    id: 'disabled',
    name: 'Behindertenparkplatz',
    style: { type: 'fill', color: '#8B5CF6' },
  },
  {
    id: 'loading',
    name: 'Ladezone',
    style: { type: 'fill', color: '#93D6FF' },
  },
  {
    id: 'charging',
    name: 'Laden von Elektrofahrzeugen',
    style: { type: 'fill', color: '#5EF20C' },
  },
  {
    id: 'taxi',
    name: 'Taxenstand',
    style: { type: 'fill', color: '#FEE13A' },
  },
  {
    id: 'car_sharing',
    name: 'Nur für Carsharing-Fahrzeuge',
    style: { type: 'fill', color: '#6B7280' },
  },
  {
    id: 'private',
    name: 'Privat',
    desc: [
      '`private` — in OSM als privat erfasst.',
      '`assumed_private` — ohne explizite Angabe als privat geschätzt.',
    ],
    style: { type: 'fill', color: '#FF7162' },
  },
  {
    id: 'vehicle_restriction',
    name: 'Fahrzeugbeschränkung',
    desc: [
      '`vehicle_restriction` — Beschränkung auf Fahrzeugklassen.',
      '`maxweight` — Gewichtsbegrenzung.',
    ],
    style: { type: 'fill', color: '#6B7280' },
  },
  {
    id: 'access_restriction',
    name: 'Zugangsbeschränkung',
    style: { type: 'fill', color: '#4B5563' },
  },
  {
    id: 'mixed',
    name: 'Nur mit Parkschein oder Bewohnerparkausweis',
    style: { type: 'fill', color: '#2EB499' },
  },
  {
    id: 'residents',
    name: 'Nur mit Bewohnerparkausweis',
    style: { type: 'fill', color: '#BE3C3C' },
  },
  {
    id: 'paid',
    name: 'Nur mit Parkschein',
    style: { type: 'fill', color: '#0E7490' },
  },
  {
    id: 'time_limited',
    name: 'Höchstparkdauer',
    style: { type: 'fill', color: '#60A5FA' },
  },
  {
    id: 'free',
    name: 'Keine Parkbeschränkungen',
    desc: [
      '`free` — in OSM explizit keine Gebühren und keine Beschränkungen erfasst.',
      '`assumed_free` — keine Angaben in OSM, daher als frei von Beschränkungen angenommen.',
    ],
    style: { type: 'fill', color: '#16A34A' },
  },
  {
    id: 'unspecified',
    name: 'Unbestimmt / Sonstiges',
    desc: [
      '`unspecified` — Bedingung nicht eindeutig klassifizierbar.',
      '`default` — Fallback, wenn keine andere Kategorie passt.',
    ],
    style: { type: 'fill', color: '#4B5563' },
  },
]

/** Straßenraum — Oberfläche (`park_street_surface`). */
export const parkingTildaStreetSurfaceLegends: FileMapDataSubcategoryStyleLegend[] = [
  {
    id: 'surface-soft',
    name: 'Durchlässig',
    style: { type: 'line', color: 'hsl(142, 94%, 40%)' },
  },
  {
    id: 'surface-semi',
    name: 'Etwas durchlässig',
    style: { type: 'line', color: 'hsl(164, 92%, 42%)' },
  },
  {
    id: 'surface-hard',
    name: 'Undurchlässig',
    style: { type: 'line', color: 'hsl(344, 93%, 35%)' },
  },
  {
    id: 'surface-unknown',
    name: 'Unkategorisiert',
    style: { type: 'line', color: 'hsl(280, 94%, 63%)' },
  },
  {
    id: 'surface-missing',
    name: 'Keine Angabe',
    style: { type: 'line', color: 'rgb(199, 199, 199)' },
  },
  parkingTildaLegendSeparateAreasShadow,
]

/** Abseits — Oberfläche (`park_off_surface_area`). */
export const parkingTildaOffStreetSurfaceLegends: FileMapDataSubcategoryStyleLegend[] = [
  {
    id: 'surface-soft',
    name: 'Durchlässig',
    style: { type: 'fill', color: 'hsl(142, 94%, 40%)' },
  },
  {
    id: 'surface-semi',
    name: 'Etwas durchlässig',
    style: { type: 'fill', color: 'hsl(164, 92%, 42%)' },
  },
  {
    id: 'surface-hard',
    name: 'Undurchlässig',
    style: { type: 'fill', color: 'hsl(344, 93%, 35%)' },
  },
  {
    id: 'surface-unknown',
    name: 'Unkategorisiert',
    style: { type: 'fill', color: 'hsl(280, 94%, 63%)' },
  },
  {
    id: 'surface-missing',
    name: 'Keine Angabe',
    style: { type: 'fill', color: 'rgb(199, 199, 199)' },
  },
]

/** Abseits — Typ (`park_off_kind_area` / `category`). */
export const parkingTildaOffStreetKindLegends: FileMapDataSubcategoryStyleLegend[] = [
  {
    id: 'multi-storey-rooftop',
    name: 'Parkhaus, Dachparkplatz',
    style: { type: 'fill', color: 'rgb(233, 91, 84)' },
  },
  {
    id: 'underground',
    name: 'Tiefgarage',
    style: { type: 'fill', color: 'rgb(142, 192, 169)' },
  },
  {
    id: 'garage-carport',
    name: 'Garage, Carport, Schuppen',
    style: { type: 'fill', color: 'rgb(251, 206, 74)' },
  },
  {
    id: 'surface',
    name: 'Flächenparkplätze',
    style: { type: 'fill', color: 'rgb(48, 159, 219)' },
  },
]

/** Straßenraum — Lage (`park_street_kind` / `parking`). */
export const parkingTildaStreetKindLegends: FileMapDataSubcategoryStyleLegend[] = [
  {
    id: 'street_side',
    name: 'Straßenrand (Parkbucht)',
    style: { type: 'line', color: 'rgb(179, 179, 179)' },
  },
  {
    id: 'shoulder',
    name: 'Seitenstreifen',
    style: { type: 'line', color: 'rgb(204, 204, 204)' },
  },
  {
    id: 'half_on_kerb',
    name: 'Halb auf Bordstein',
    style: { type: 'line', color: 'rgb(77, 77, 77)' },
  },
  {
    id: 'on_kerb',
    name: 'Auf Bordstein',
    style: { type: 'line', color: 'rgb(26, 26, 26)' },
  },
  {
    id: 'default',
    name: 'Sonstiges',
    style: { type: 'line', color: 'rgb(128, 128, 128)' },
  },
]
