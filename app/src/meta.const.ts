/**
 * Shared meta / PWA values for document head and favicon manifest.
 * Used by __root.tsx and scripts/generate-favicons.
 */
export const APP_META = {
  title: 'TILDA – Radverkehrs- und Parkraumdaten für Kommunen',
  shortName: 'TILDA',
  description:
    'TILDA liefert Kommunen und Landkreisen aktuelle Radverkehrs- und Parkraumdaten – schnell, günstig und ohne Befahrungen. OSM-basiert, Open Source, sofort startklar.',
  themeColor: '#27272a',
} as const
