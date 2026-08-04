import type { PlanningCandidate } from '../../hooks/mapState/usePlanningCandidatesState'

/**
 * Die ausgewählten Hexagone als GeoJSON-FeatureCollection: potentielle Standorte
 * für den Bau von Abstellanlagen. Die Tile-Properties (Scores, Eignungsklasse,
 * Ausschluss-Flags) werden unverändert übernommen und um die Position in der
 * Auswahlliste ergänzt, damit die Reihenfolge aus der Sidebar erhalten bleibt.
 */
const candidatesToGeojson = (candidates: PlanningCandidate[]) => ({
  type: 'FeatureCollection' as const,
  features: candidates.map((candidate, index) => ({
    type: 'Feature' as const,
    id: candidate.h3Id,
    geometry: candidate.geometry,
    properties: {
      ...candidate.properties,
      h3_id: candidate.h3Id,
      auswahl_nr: index + 1,
    },
  })),
})

export const candidateExportFileName = (scenarioId: number | null | undefined) => {
  const date = new Date().toISOString().slice(0, 10)
  return scenarioId != null
    ? `${date}--abstellanlagen-kandidaten-szenario-${scenarioId}.geojson`
    : `${date}--abstellanlagen-kandidaten.geojson`
}

/** Triggert den Browser-Download der Auswahl (Blob statt data-URL wegen der Größe). */
export const downloadCandidatesGeojson = (
  candidates: PlanningCandidate[],
  fileName: string,
): void => {
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
