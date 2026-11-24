import {
  ArrowDownTrayIcon,
  ClipboardDocumentCheckIcon,
  QueueListIcon,
  SquaresPlusIcon,
} from '@heroicons/react/24/outline'
import { bbox, centroid } from '@turf/turf'
import { useEffect, useState } from 'react'
import { useMap } from 'react-map-gl/maplibre'
import { twJoin, twMerge } from 'tailwind-merge'
import {
  type SpaceFinderCandidate,
  useSpaceFinderCandidateSelectActive,
  useSpaceFinderCandidates,
  useSpaceFinderCandidatesActions,
  useSpaceFinderFocusedCandidateH3Id,
} from '@/components/regionen/pageRegionSlug/hooks/mapState/space-finder-candidates-store'
import { useMapActions } from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapState'
import { useFeaturesParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useFeaturesParam/useFeaturesParam'
import { useMapParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useMapParam'
import { spaceFinderCandidateListItemId } from '@/components/regionen/pageRegionSlug/Map/SourcesAndLayers/SourcesLayersSpaceFinder'
import { useRegion } from '@/components/regionen/pageRegionSlug/regionUtils/useRegion'
import { Callout } from '@/components/shared/Callout/Callout'
import { CollapsibleBox } from '@/components/shared/CollapsibleBox/CollapsibleBox'
import { buttonStylesSecondary } from '@/components/shared/links/styles'
import { captureModalOpenOrigin } from '@/components/shared/motion/modalOpenOrigin'
import { radioButtonClass } from '@/components/shared/SegmentedChoice/radioButtonClass'
import { ModeListItem } from '../../ModeListItem'
import {
  modePanelListMetaClassName,
  modePanelListTitleClassName,
  modePanelSmallButtonClassName,
  modePanelTintHairlineTopClassName,
} from '../../modePanel.const'
import { TOP_FILTER_LABEL } from '../factors/spaceFinderDefaults'
import { RemoveIconButton } from '../RemoveIconButton'
import { useSpaceFinderTopHexagons } from '../search/useSpaceFinderTopHexagons'
import { FINE_HEXAGON_ZOOM } from '../spaceFinderHexagonResolution'
import {
  spaceFinderDiscardLinkClass,
  spaceFinderDiscardRowClass,
  spaceFinderTagClass,
} from '../spaceFinderPanelStyles'
import { useSpaceFinderSelection } from '../useSpaceFinderSelection'
import { candidateExportFileName, downloadCandidatesGeojson } from './spaceFinderCandidateExport'
import { SpaceFinderReviewListModal } from './SpaceFinderReviewListModal'

/**
 * Turns the candidate-selection tool off whenever the shown run changes and on unmount (leaving
 * the Flächenfinder mode unmounts `PageModeSpaceFinder`, and with it this component). The
 * candidates themselves are kept per run (`space-finder-candidates-store`) and come back with
 * their run. Kept separate from the toggle button below: this must keep running even while the
 * »Auswahl« section itself is collapsed or not rendered (no complete run yet).
 */
export const SpaceFinderCandidateSelectionReset = () => {
  const { runId } = useSpaceFinderSelection()
  const { setSelectActive } = useSpaceFinderCandidatesActions()

  useEffect(
    function stopCandidateSelectionOnRunChange() {
      setSelectActive(false)
      return () => setSelectActive(false)
    },
    [runId, setSelectActive],
  )

  return null
}

const candidateCentroid = (candidate: SpaceFinderCandidate): [number, number] => {
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
  active,
  onFocus,
  onRemove,
}: {
  candidate: SpaceFinderCandidate
  index: number
  active: boolean
  onFocus: () => void
  onRemove: () => void
}) => {
  const score = candidate.properties.mce_gesamtscore
  const eignungsklasse =
    typeof candidate.properties.eignungsklasse === 'string'
      ? candidate.properties.eignungsklasse
      : null

  return (
    <ModeListItem
      id={spaceFinderCandidateListItemId(candidate.h3Id)}
      coordinates={candidateCentroid(candidate)}
      active={active}
      onClick={onFocus}
      actions={
        <RemoveIconButton
          label={`Kandidat ${index + 1} entfernen`}
          onClick={onRemove}
          className="-mr-0.5"
        />
      }
    >
      <div className="flex items-center gap-2">
        <span className={twJoin('w-5 shrink-0 text-right', modePanelListMetaClassName)}>
          {index + 1}.
        </span>
        <span className={twJoin('min-w-0 flex-1 truncate font-mono', modePanelListMetaClassName)}>
          {candidate.h3Id}
        </span>
        {eignungsklasse && <span className={spaceFinderTagClass}>{eignungsklasse}</span>}
        <span className={twJoin('w-8 shrink-0 text-right', modePanelListTitleClassName)}>
          {typeof score === 'number' ? Math.round(score) : '–'}
        </span>
      </div>
    </ModeListItem>
  )
}

/**
 * »Auswahl« section (D6): candidate selection lives in the panel, not as a
 * `SidebarInspector` takeover. The toggle switches map clicks on result hexagons between
 * add/remove-candidate and the normal inspector (`RegionMap` `handleClick`, already mode-gated).
 * Outputs: the GeoJSON download and the take-over into a Prüfliste (»In Prüfliste übernehmen«).
 */
export const SpaceFinderCandidatesSection = ({
  variantId,
  runId,
}: {
  variantId: number
  runId: number
}) => {
  const regionSlug = useRegion().slug
  const { variant, candidateRunKey: runKey } = useSpaceFinderSelection()
  const [reviewListModalOpen, setReviewListModalOpen] = useState(false)
  const candidates = useSpaceFinderCandidates(runKey)
  const selectActive = useSpaceFinderCandidateSelectActive()
  const { setSelectActive, setFocusedH3Id, addCandidates, removeCandidate, clearCandidates } =
    useSpaceFinderCandidatesActions()
  const { topHexagons } = useSpaceFinderTopHexagons()
  const missingTopHexagons =
    topHexagons?.filter((top) => !candidates.some((c) => c.h3Id === top.h3Id)) ?? []
  const focusedH3Id = useSpaceFinderFocusedCandidateH3Id()
  const { clearInspectorFeatures } = useMapActions()
  const { setFeaturesParam } = useFeaturesParam()
  const { mainMap: map } = useMap()
  const { mapParam } = useMapParam()

  // Close an open inspector — the candidate list takes its place in this same panel.
  const closeInspector = () => {
    clearInspectorFeatures()
    setFeaturesParam(null)
  }

  // A click on a list row switches the selection tool on (so all candidates are outlined on the
  // map), marks this candidate and moves the map there, at least at the zoom where the fine
  // hexagons are shown.
  const focusCandidate = (candidate: SpaceFinderCandidate) => {
    setSelectActive(true)
    setFocusedH3Id(candidate.h3Id)
    closeInspector()
    if (!map) return
    const [minLng, minLat, maxLng, maxLat] = bbox({
      type: 'Feature',
      geometry: candidate.geometry as GeoJSON.Geometry,
      properties: {},
    })
    map.easeTo({
      center: [(minLng + maxLng) / 2, (minLat + maxLat) / 2],
      zoom: Math.max(map.getZoom(), FINE_HEXAGON_ZOOM),
      duration: 500,
    })
  }

  const toggleSelect = () => {
    const next = !selectActive
    setSelectActive(next)
    if (!next) return
    closeInspector()
    // Coarse cells cannot be selected — zoom in right away, to where only fine cells are shown.
    if (map && map.getZoom() < FINE_HEXAGON_ZOOM) {
      map.zoomTo(FINE_HEXAGON_ZOOM, { duration: 600 })
    }
  }

  return (
    <CollapsibleBox
      title="Auswahl"
      defaultOpen={selectActive || candidates.length > 0}
      // Collapsing ends the selection like »Auswahl beenden«; the candidates stay.
      onOpenChange={(open) => {
        if (!open) setSelectActive(false)
      }}
    >
      <button
        type="button"
        onClick={toggleSelect}
        aria-pressed={selectActive}
        // Same toggle look as »Gebiet bearbeiten« / »Zeichnen beenden« in the area form.
        className={twJoin(
          'flex w-full items-center justify-center gap-1.5',
          radioButtonClass(selectActive),
        )}
      >
        <SquaresPlusIcon className="size-4" aria-hidden="true" />
        {selectActive ? 'Auswahl beenden' : 'Kandidaten auswählen'}
      </button>

      {/* Like `QaZoomNotice`: below FINE_HEXAGON_ZOOM clicks go to the coarse overview
          cells, which RegionMap does not accept as candidates. */}
      {selectActive && (mapParam?.zoom ?? 0) < FINE_HEXAGON_ZOOM && (
        <Callout
          tone="notice"
          compact
          actions={
            <button
              type="button"
              className={twJoin(modePanelSmallButtonClassName, 'border-yellow-300 bg-white')}
              disabled={!map}
              onClick={() => map?.zoomTo(FINE_HEXAGON_ZOOM, { duration: 600 })}
            >
              Hineinzoomen
            </button>
          }
        >
          Kandidaten lassen sich erst weiter hineingezoomt auswählen — vorher zeigt die Karte je
          Zelle nur einen Überblick über die besten Flächen.
        </Callout>
      )}

      {candidates.length === 0 ? (
        <p className="text-sm text-gray-500">
          Klicke Hexagone auf der Karte an, um sie als Kandidaten für Abstellanlagen zu sammeln.
          Ausgewählte Hexagone sind gelb umrandet.
        </p>
      ) : (
        // Edge to edge inside the box (cancels its `p-2.5`), hairlines like the Hinweise list.
        <ul className={twJoin('-mx-2.5 flex flex-col', modePanelTintHairlineTopClassName)}>
          {candidates.map((candidate, index) => (
            <CandidateRow
              key={candidate.h3Id}
              candidate={candidate}
              index={index}
              active={candidate.h3Id === focusedH3Id}
              onFocus={() => focusCandidate(candidate)}
              onRemove={() => runKey != null && removeCandidate(runKey, candidate.h3Id)}
            />
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-2">
        {topHexagons && topHexagons.length > 0 && (
          <button
            type="button"
            disabled={missingTopHexagons.length === 0}
            onClick={() => {
              if (runKey == null) return
              addCandidates(
                runKey,
                missingTopHexagons.map((top) => ({
                  h3Id: top.h3Id,
                  geometry: top.geometry,
                  properties: top.properties,
                })),
              )
              setSelectActive(true)
              closeInspector()
            }}
            className={twMerge(
              buttonStylesSecondary,
              'gap-2 disabled:cursor-not-allowed disabled:opacity-60',
            )}
          >
            <QueueListIcon className="size-4" />
            {TOP_FILTER_LABEL} übernehmen ({topHexagons.length})
          </button>
        )}
        <button
          type="button"
          disabled={candidates.length === 0}
          onClick={() => downloadCandidatesGeojson(candidates, candidateExportFileName(variantId))}
          className={twMerge(
            buttonStylesSecondary,
            'gap-2 disabled:cursor-not-allowed disabled:opacity-60',
          )}
        >
          <ArrowDownTrayIcon className="size-4" />
          Als GeoJSON herunterladen
        </button>
        <button
          type="button"
          disabled={candidates.length === 0}
          onClick={(event) => {
            captureModalOpenOrigin(event.currentTarget)
            setReviewListModalOpen(true)
          }}
          className={twMerge(
            buttonStylesSecondary,
            'gap-2 disabled:cursor-not-allowed disabled:opacity-60',
          )}
        >
          <ClipboardDocumentCheckIcon className="size-4" />
          In Prüfliste übernehmen
        </button>
        {candidates.length > 0 && (
          <div className={spaceFinderDiscardRowClass}>
            <button
              type="button"
              onClick={() => runKey != null && clearCandidates(runKey)}
              className={spaceFinderDiscardLinkClass}
            >
              Auswahl leeren
            </button>
          </div>
        )}
      </div>
      {variant && (
        <SpaceFinderReviewListModal
          open={reviewListModalOpen}
          onClose={() => setReviewListModalOpen(false)}
          regionSlug={regionSlug}
          runId={runId}
          candidates={candidates}
          defaultListName={`Flächenfinder: ${variant.area.title} – ${variant.title}`}
        />
      )}
    </CollapsibleBox>
  )
}
