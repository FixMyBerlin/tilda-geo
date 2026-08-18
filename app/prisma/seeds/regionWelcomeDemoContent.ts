import type { RegionWelcomeWriteInput } from '@/server/regions/regionWriteSchema'

export type RegionWelcomeDemoAssetId = 'radverkehr' | 'fussverkehr'

/**
 * Welcome copy (+ optional imageAsset metadata) for seed fixtures.
 * Wired into `regionSeedCatalog` as `welcome` on create (imageUploadId = null).
 * Hero files are attached afterwards by `attachRegionWelcomeDemoImages`.
 */
export type RegionWelcomeDemoSpec = {
  title: string
  subtitle: string
  bodyMarkdown: string
  sections: RegionWelcomeWriteInput['sections']
  imageAsset?: RegionWelcomeDemoAssetId
  imageAltText?: string
}

/** Deterministic UUID per region slug for idempotent demo uploads. */
export const regionWelcomeDemoUploadUuidBySlug = {
  radinfra: '00000000-0000-4000-8000-000000000001',
  'bb-kampagne': '00000000-0000-4000-8000-000000000002',
} as const satisfies Record<string, string>

export const regionWelcomeDemoAssetFiles = {
  radverkehr: { filename: 'radverkehr.jpg', mimeType: 'image/jpeg' },
  fussverkehr: { filename: 'fussverkehr.jpg', mimeType: 'image/jpeg' },
} as const satisfies Record<RegionWelcomeDemoAssetId, { filename: string; mimeType: string }>

export const regionWelcomeDemoSpecs = {
  radinfra: {
    title: 'Das Radnetz für ganz Deutschland',
    subtitle: 'Open Data · Mitmachen · Qualität',
    bodyMarkdown:
      'Auf **radinfra.de** siehst du Radwege, Schutzstreifen und Fahrradstraßen aus OpenStreetMap — flächendeckend und ständig aktualisiert. Nutze die Karte für Planung, Forschung und Kampagnenarbeit. Trage fehlende Strecken direkt in OSM ein und verbessere die Datenqualität für alle.',
    sections: [
      {
        title: 'Woher kommen die Daten?',
        bodyMarkdown:
          'Die Karte basiert auf OpenStreetMap. FixMyCity und Partner pflegen zusätzliche Attribute wie Breite, Oberfläche und Einbahnregelung.',
        sortOrder: 0,
      },
      {
        title: 'Kann ich mithelfen?',
        bodyMarkdown:
          'Ja — ergänze fehlende Radwege in OSM oder melde Unstimmigkeiten über die Karte. Jede Korrektur verbessert das nationale Radnetz.',
        sortOrder: 1,
      },
      {
        title: 'Wie aktuell ist die Karte?',
        bodyMarkdown:
          'Die Verarbeitung läuft regelmäßig. In der Kategorie „Aktualität“ siehst du, wann Strecken zuletzt in OSM bearbeitet wurden.',
        sortOrder: 2,
      },
      {
        title: 'Gibt es Exporte?',
        bodyMarkdown:
          'Öffentliche Regionen bieten GeoJSON-Exporte für ausgewählte Layer — ideal für GIS und Analysen.',
        sortOrder: 3,
      },
    ],
    imageAsset: 'radverkehr',
    imageAltText: 'Screenshot der radinfra.de-Karte mit Radwegen in Deutschland',
  },
  'bb-kampagne': {
    title: 'Radinfrastruktur in Brandenburg',
    subtitle: 'Kampagne · Land Brandenburg',
    bodyMarkdown:
      'Diese Karte zeigt den Stand der Radverkehrsinfrastruktur im Land Brandenburg — von Radwegen bis zu Tempo-30-Zonen. Sie unterstützt die landesweite Kampagne für sichere und durchgängige Radverbindungen zwischen Städten und im ländlichen Raum.',
    sections: [],
    imageAsset: 'fussverkehr',
    imageAltText: 'Kartenansicht mit Rad- und Fußverkehrsinfrastruktur in Brandenburg',
  },
  parkraum: {
    title: 'Parkraum verstehen, Flächen fair teilen',
    subtitle: 'Parkraumanalyse',
    bodyMarkdown:
      'Hier analysierst du Straßenparken, Ladeinfrastruktur und Bewohnerparken auf einen Blick. Die Karte hilft Kommunen, Verkehrsplanung und Bürgerinitiativen dabei, Parkdruck sichtbar zu machen und Maßnahmen datenbasiert zu diskutieren — ohne proprietäre Datenquellen.',
    sections: [
      {
        title: 'Welche Parkdaten werden angezeigt?',
        bodyMarkdown:
          'Straßenparkplätze, Bewohnerparkbereiche und relevante Zusatzlayer aus OpenStreetMap und kommunalen Quellen, soweit verfügbar.',
        sortOrder: 0,
      },
      {
        title: 'Wie lese ich die Parkraumkarte?',
        bodyMarkdown:
          'Farben und Symbole zeigen Auslastung, Regelungen und Besonderheiten. Zoome in dein Quartier und schalte Hintergrundkarten für Kontext ein.',
        sortOrder: 1,
      },
      {
        title: 'Kann ich Daten exportieren?',
        bodyMarkdown:
          'In Regionen mit Download-Bereich stehen GeoJSON-Exporte bereit — prüfe die Regionen-Einstellungen oder frage die Verantwortlichen.',
        sortOrder: 2,
      },
    ],
  },
} satisfies Record<string, RegionWelcomeDemoSpec>

/** Regions whose catalog welcome includes an `imageAsset` — need the post-create attach step. */
export const regionWelcomeDemoImageSlugs = ['radinfra', 'bb-kampagne'] as const

export function regionWelcomeDemoSpecToWriteInput(
  spec: RegionWelcomeDemoSpec,
  imageUploadId: number | null,
) {
  const image =
    imageUploadId != null && spec.imageAltText
      ? { uploadId: imageUploadId, altText: spec.imageAltText }
      : null

  return {
    enabled: true,
    title: spec.title,
    subtitle: spec.subtitle,
    bodyMarkdown: spec.bodyMarkdown,
    image,
    sections: spec.sections,
  } satisfies RegionWelcomeWriteInput
}
