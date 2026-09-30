import { ArrowDownTrayIcon, SquaresPlusIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { bbox, centroid } from '@turf/turf'
import { useEffect } from 'react'
import { useMap } from 'react-map-gl/maplibre'
import { twJoin } from 'tailwind-merge'
import { useMapActions } from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapState'
import {
  type PlanningCandidate,
  usePlanningCandidatesState,
} from '@/components/regionen/pageRegionSlug/hooks/mapState/usePlanningCandidatesState'
import { useFeaturesParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useFeaturesParam/useFeaturesParam'
import { CollapsibleBox } from '@/components/regionen/pageRegionSlug/modes/spaceFinder/CollapsibleBox'
import { ModeListItem } from '../ModeListItem'
import { candidateExportFileName, downloadCandidatesGeojson } from './planningCandidateExport'
import { useSpaceFinderSelection } from './useSpaceFinderSelection'

const EIGNUNGSKLASSE_COLORS: Record<string, string> = {
  ausgeschlossen: 'bg-gray-200 text-gray-700',
  schlecht: 'bg-red-100 text-red-800',
  mittel: 'bg-orange-100 text-orange-800',
  gut: 'bg-yellow-100 text-yellow-800',
  'sehr gut': 'bg-green-100 text-green-800',
}

/**
 * Resets the candidate-selection tool once no run is shown any more — the candidates belong to
 * exactly that result and are never persisted (D6). Runs on every variant/mode-leave change and on
 * unmount (leaving the Flächenfinder mode unmounts `PageModeSpaceFinder`, and with it this
 * component). Kept separate from the toggle button below: this must keep running even while the
 * »Auswahl« section itself is collapsed or not rendered (no complete run yet).
 */
export const SpaceFinderCandidateSelectionReset = () => {
  const { runId } = useSpaceFinderSelection()
  const setSelectActive = usePlanningCandidatesState((s) => s.setSelectActive)
  const clearCandidates = usePlanningCandidatesState((s) => s.clearCandidates)

  useEffect(
    function resetCandidateSelectionOutsidePlanningResult() {
      if (runId != null) return
      setSelectActive(false)
      clearCandidates()
    },
    [runId, setSelectActive, clearCandidates],
  )

  useEffect(
    () => () => {
      setSelectActive(false)
      clearCandidates()
    },
    [setSelectActive, clearCandidates],
  )

  return null
}

const candidateListItemId = (h3Id: string) => `spaceFinder-candidate-${h3Id}`

const candidateCentroid = (candidate: PlanningCandidate): [number, number] => {
  const coordinates = centroid({
    type: 'Feature',
    geometry: candidate.geometry as GeoJSON.Geometry,
    properties: {},
  }).geometry.coordinates
  return [coordinates[0] ?? 0, coordinates[1] ?? 0]
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
    <ModeListItem
      id={candidateListItemId(candidate.h3Id)}
      coordinates={candidateCentroid(candidate)}
      onClick={onFocus}
      buttonClassName="px-2.5 py-1.5"
      className="border-b border-gray-100 last:border-0"
      actions={
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Kandidat ${index + 1} entfernen`}
          className="shrink-0 text-gray-400 hover:text-gray-800"
        >
          <XMarkIcon className="size-4" />
        </button>
      }
    >
      <div className="flex items-center gap-2">
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
      </div>
    </ModeListItem>
  )
}

/**
 * »Auswahl« section (D6, phase 4): candidate selection moved out of the `SidebarInspector`
 * takeover into the panel. The toggle switches map clicks on result hexagons between
 * add/remove-candidate and the normal inspector (`RegionMap` `handleClick`, already mode-gated).
 * The only output is the GeoJSON download — no Prüflisten handover.
 */
export const SpaceFinderCandidatesSection = ({ variantId }: { variantId: number }) => {
  const candidates = usePlanningCandidatesState((s) => s.candidates)
  const selectActive = usePlanningCandidatesState((s) => s.selectActive)
  const setSelectActive = usePlanningCandidatesState((s) => s.setSelectActive)
  const removeCandidate = usePlanningCandidatesState((s) => s.removeCandidate)
  const clearCandidates = usePlanningCandidatesState((s) => s.clearCandidates)
  const { clearInspectorFeatures } = useMapActions()
  const { setFeaturesParam } = useFeaturesParam()
  const { mainMap: map } = useMap()

  const focusCandidate = (candidate: PlanningCandidate) => {
    if (!map) return
    const [minLng, minLat, maxLng, maxLat] = bbox({
      type: 'Feature',
      geometry: candidate.geometry as GeoJSON.Geometry,
      properties: {},
    })
    map.easeTo({ center: [(minLng + maxLng) / 2, (minLat + maxLat) / 2], duration: 500 })
  }

  const toggleSelect = () => {
    const next = !selectActive
    setSelectActive(next)
    if (!next) return
    // Close an open inspector — the candidate list takes its place in this same panel now.
    clearInspectorFeatures()
    setFeaturesParam(null)
  }

  return (
    <CollapsibleBox title="Auswahl" defaultOpen={selectActive || candidates.length > 0}>
      <button
        type="button"
        onClick={toggleSelect}
        aria-pressed={selectActive}
        className={twJoin(
          'flex w-full items-center justify-center gap-1.5 rounded border px-3 py-1.5 text-sm font-medium',
          selectActive
            ? 'border-emerald-700 bg-emerald-700 text-white hover:bg-emerald-800'
            : 'border-emerald-700 bg-white text-emerald-800 hover:bg-emerald-50',
        )}
      >
        <SquaresPlusIcon className="size-4" aria-hidden="true" />
        {selectActive ? 'Auswahl beenden' : 'Kandidaten auswählen'}
      </button>

      {candidates.length === 0 ? (
        <p className="text-sm text-gray-500">
          Klicke Hexagone auf der Karte an, um sie als Kandidaten für Abstellanlagen zu sammeln.
          Ausgewählte Hexagone sind gelb umrandet.
        </p>
      ) : (
        <ul className="-mx-2.5 flex flex-col">
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
          onClick={() => downloadCandidatesGeojson(candidates, candidateExportFileName(variantId))}
          className="flex items-center justify-center gap-2 rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <ArrowDownTrayIcon className="size-4" />
          Als GeoJSON herunterladen
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
    </CollapsibleBox>
  )
}
