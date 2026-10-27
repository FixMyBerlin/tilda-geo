import { feature, featureCollection } from '@turf/helpers'
import type { SpaceFinderCandidate } from '@/components/regionen/pageRegionSlug/hooks/mapState/space-finder-candidates-store'

/**
 * The selected hexagons as a GeoJSON FeatureCollection: potential sites for building
 * bicycle parking. The tile properties (scores, suitability class, exclusion flags) are
 * copied unchanged and extended with the position in the selection list so the sidebar
 * order is kept.
 */
const candidatesToGeojson = (candidates: SpaceFinderCandidate[]) =>
  featureCollection(
    candidates.map((candidate, index) =>
      feature(
        candidate.geometry,
        {
          ...candidate.properties,
          h3_id: candidate.h3Id,
          auswahl_nr: index + 1,
        },
        { id: candidate.h3Id },
      ),
    ),
  )

export const candidateExportFileName = (variantId: number | null | undefined) => {
  const date = new Date().toISOString().slice(0, 10)
  return variantId != null
    ? `${date}--abstellanlagen-kandidaten-variante-${variantId}.geojson`
    : `${date}--abstellanlagen-kandidaten.geojson`
}

/** Triggers the browser download of the selection (Blob instead of data URL due to size). */
export const downloadCandidatesGeojson = (candidates: SpaceFinderCandidate[], fileName: string) => {
  const blob = new Blob([JSON.stringify(candidatesToGeojson(candidates), null, 2)], {
    type: 'application/geo+json',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
