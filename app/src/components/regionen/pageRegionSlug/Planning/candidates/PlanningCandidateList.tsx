import { ArrowDownTrayIcon, XMarkIcon } from '@heroicons/react/20/solid'
import { bbox } from '@turf/turf'
import { useMap } from 'react-map-gl/maplibre'
import {
  type PlanningCandidate,
  usePlanningCandidatesState,
} from '../../hooks/mapState/usePlanningCandidatesState'
import { usePlanningScenarioParam } from '../../hooks/useQueryState/usePlanningParams'
import { candidateExportFileName, downloadCandidatesGeojson } from './planningCandidateExport'

const EIGNUNGSKLASSE_COLORS: Record<string, string> = {
  ausgeschlossen: 'bg-gray-200 text-gray-700',
  schlecht: 'bg-red-100 text-red-800',
  mittel: 'bg-orange-100 text-orange-800',
  gut: 'bg-yellow-100 text-yellow-800',
  'sehr gut': 'bg-green-100 text-green-800',
}

const CandidateRow = ({
  candidate,
  index,
  onFocus,
  onRemove,
}: {
  candidate: PlanningCandidate
  index: number
  onFocus: () => void
  onRemove: () => void
}) => {
  const score = candidate.properties.mce_gesamtscore
  const eignungsklasse: string | null = candidate.properties.eignungsklasse ?? null

  return (
    <li className="flex items-center gap-2 border-b border-gray-100 py-1.5 last:border-0">
      <button
        type="button"
        onClick={onFocus}
        title="Auf der Karte zeigen"
        className="flex min-w-0 flex-1 items-center gap-2 text-left"
      >
        <span className="w-5 shrink-0 text-right text-xs text-gray-400">{index + 1}.</span>
        <span className="min-w-0 flex-1 truncate font-mono text-xs text-gray-500">
          {candidate.h3Id}
        </span>
        {eignungsklasse && (
          <span
            className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-medium ${
              EIGNUNGSKLASSE_COLORS[eignungsklasse] ?? 'bg-gray-100 text-gray-600'
            }`}
          >
            {eignungsklasse}
          </span>
        )}
        <span className="w-8 shrink-0 text-right text-base font-bold text-gray-800">
          {typeof score === 'number' ? Math.round(score) : '–'}
        </span>
      </button>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Kandidat ${index + 1} entfernen`}
        className="shrink-0 text-gray-400 hover:text-gray-800"
      >
        <XMarkIcon className="size-4" />
      </button>
    </li>
  )
}

/**
 * Inhalt des Auswahl-Werkzeugs (PlanningCandidateToggle) für die bestehende
 * Inspector-Sidebar: statt der Einzel-Feature-Ansicht eine Übersicht ALLER
 * ausgewählten Hexagone – Anzahl (im Sidebar-Header), je Hexagon der Gesamtscore –
 * und am Ende der Liste der Export der potentiellen Kandidaten für Abstellanlagen
 * als GeoJSON.
 *
 * Bewusst ohne eigene Panel-Chrome (Rahmen, Breite, Schließen-Knopf): die liefert
 * SidebarInspector, damit die Sidebar wie bei allen anderen Inhalten aussieht und
 * sich wie gewohnt in der Breite ziehen lässt.
 */
export const PlanningCandidateList = () => {
  const [scenarioId] = usePlanningScenarioParam()
  const candidates = usePlanningCandidatesState((s) => s.candidates)
  const removeCandidate = usePlanningCandidatesState((s) => s.removeCandidate)
  const clearCandidates = usePlanningCandidatesState((s) => s.clearCandidates)
  const { mainMap: map } = useMap()

  const focusCandidate = (candidate: PlanningCandidate) => {
    if (!map) return
    const [minLng, minLat, maxLng, maxLat] = bbox({
      type: 'Feature',
      geometry: candidate.geometry as any,
      properties: {},
    })
    map.easeTo({ center: [(minLng + maxLng) / 2, (minLat + maxLat) / 2], duration: 500 })
  }

  return (
    <div className="space-y-3">
      {candidates.length === 0 ? (
        <p className="text-sm text-gray-500">
          Klicke Hexagone auf der Karte an, um sie als Kandidaten für Abstellanlagen zu sammeln.
          Ausgewählte Hexagone sind gelb umrandet.
        </p>
      ) : (
        <ul>
          {candidates.map((candidate, index) => (
            <CandidateRow
              key={candidate.h3Id}
              candidate={candidate}
              index={index}
              onFocus={() => focusCandidate(candidate)}
              onRemove={() => removeCandidate(candidate.h3Id)}
            />
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-2 border-t border-gray-200 pt-3">
        <button
          type="button"
          disabled={candidates.length === 0}
          onClick={() => downloadCandidatesGeojson(candidates, candidateExportFileName(scenarioId))}
          className="flex items-center justify-center gap-2 rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <ArrowDownTrayIcon className="size-4" />
          Als GeoJSON exportieren
        </button>
        {candidates.length > 0 && (
          <button
            type="button"
            onClick={clearCandidates}
            className="text-xs text-gray-500 hover:text-gray-800"
          >
            Auswahl leeren
          </button>
        )}
      </div>
    </div>
  )
}
