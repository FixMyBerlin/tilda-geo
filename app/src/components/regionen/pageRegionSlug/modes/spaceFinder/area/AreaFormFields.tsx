import { PencilSquareIcon } from '@heroicons/react/24/outline'
import { bbox } from '@turf/turf'
import { useEffect } from 'react'
import { useMap } from 'react-map-gl/maplibre'
import { twJoin } from 'tailwind-merge'
import { InfoTooltip } from '@/components/shared/InfoTooltip/InfoTooltip'
import { radioButtonClass } from '@/components/shared/SegmentedChoice/radioButtonClass'
import { MAX_STUDY_AREA_KM2, studyAreaSizeKm2 } from '@/lib/planningStudyAreaLimit'
import {
  useSpaceFinderBoundaryActions,
  useSpaceFinderDrawnGeometry,
  useSpaceFinderDrawingActive,
} from '../../../hooks/mapState/space-finder-boundary-store'
import { useSpaceFinderDraw } from '../drawing/useSpaceFinderDraw'
import {
  GROUP_HELP,
  PLANNING_USE_CASES,
  SHOW_PLANNING_USE_CASE_UI,
  type PlanningUseCase,
} from '../factors/spaceFinderDefaults'
import {
  spaceFinderNumberInputClass,
  spaceFinderPanelTitleInputClass,
} from '../spaceFinderPanelStyles'
import { BoundaryPicker } from './BoundaryPicker'
import type { StudyAreaGeometry } from './extractStudyAreaGeometry'
import { GeoJsonUpload } from './GeoJsonUpload'
import { UserObstaclesField, type UserGeojsonMode } from './UserObstaclesField'
import { WizardStep } from './WizardStep'

type AreaTab = 'search' | 'custom'

const groupHeadlineClass =
  'flex items-baseline justify-between gap-2 border-b border-gray-200 pb-0.5 text-sm font-bold text-gray-800'

const tabClass = (active: boolean) =>
  `flex-1 rounded px-2 py-1 text-xs font-medium ${
    active ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
  }`

type AreaFormState = {
  title: string
  boundaryId: string | null
  studyArea: unknown
  areaTab: AreaTab
  userGeojson: GeoJSON.FeatureCollection | undefined
  userGeojsonMode: UserGeojsonMode
  useCase: PlanningUseCase
  areaSizeM2: number | null
}

type AreaFormFieldsProps = {
  state: AreaFormState
  onTitleChange: (title: string) => void
  onBoundaryIdChange: (id: string | null) => void
  onStudyAreaChange: (geom: unknown) => void
  onAreaTabChange: (tab: AreaTab) => void
  onUserGeojsonChange: (geojson: GeoJSON.FeatureCollection | undefined) => void
  onUserGeojsonModeChange: (mode: UserGeojsonMode) => void
  onUseCaseChange: (useCase: PlanningUseCase) => void
  onAreaSizeM2Change: (value: number | null) => void
  titleMissing?: boolean
  showUserData?: boolean
  geometryStepTitle?: string
  /** The saved study area when an existing Gebiet is edited; "discard" goes back to it. */
  originalStudyArea?: StudyAreaGeometry | null
}

/** Shared fields for creating or editing a planungsgebiet. */
export const AreaFormFields = ({
  state,
  onTitleChange,
  onBoundaryIdChange,
  onStudyAreaChange,
  onAreaTabChange,
  onUserGeojsonChange,
  onUserGeojsonModeChange,
  onUseCaseChange,
  onAreaSizeM2Change,
  titleMissing = false,
  showUserData = true,
  geometryStepTitle = 'Gebiet auswählen',
  originalStudyArea = null,
}: AreaFormFieldsProps) => {
  const { mainMap: map } = useMap()
  const { setBoundaryHighlightGeom, setDrawingActive, setDrawnGeometry } =
    useSpaceFinderBoundaryActions()
  const drawingActive = useSpaceFinderDrawingActive()
  const drawnGeometry = useSpaceFinderDrawnGeometry()
  const draw = useSpaceFinderDraw()

  const effectiveStudyArea = state.studyArea ?? drawnGeometry

  const areaKm2 = effectiveStudyArea
    ? studyAreaSizeKm2(effectiveStudyArea as GeoJSON.Geometry)
    : null
  const areaTooLarge = areaKm2 != null && areaKm2 > MAX_STUDY_AREA_KM2

  useEffect(
    function resetDrawingStoreOnUnmount() {
      return function clearDrawingStore() {
        setDrawingActive(false)
        setDrawnGeometry(null)
        setBoundaryHighlightGeom(null)
      }
    },
    [setDrawingActive, setDrawnGeometry, setBoundaryHighlightGeom],
  )

  const fitToGeometry = (geom: object) => {
    if (!map) return
    const [minLng, minLat, maxLng, maxLat] = bbox({
      type: 'Feature',
      geometry: geom as GeoJSON.Geometry,
      properties: {},
    })
    map.fitBounds([minLng, minLat, maxLng, maxLat], { padding: 60, duration: 800 })
  }

  // Back to where the form started: the saved area when editing, nothing when creating.
  const resetToOriginal = () => {
    draw.cancel()
    setDrawingActive(false)
    setDrawnGeometry(null)
    onStudyAreaChange(originalStudyArea)
    setBoundaryHighlightGeom(originalStudyArea, { filled: false })
  }

  const switchTab = (tab: AreaTab) => {
    onAreaTabChange(tab)
    onBoundaryIdChange(null)
    resetToOriginal()
  }

  const toggleDrawing = () => {
    if (drawingActive) {
      draw.cancel()
      setDrawingActive(false)
      // Keep the finished area visible on the map once the drawing tools are gone.
      if (drawnGeometry) setBoundaryHighlightGeom(drawnGeometry)
      return
    }
    // Drawing starts from the area that is there, so it can be changed instead of redrawn.
    const current = effectiveStudyArea as GeoJSON.Geometry | null
    const isPolygonal = current?.type === 'Polygon' || current?.type === 'MultiPolygon'
    setDrawnGeometry(isPolygonal ? current : null)
    onStudyAreaChange(null)
    setBoundaryHighlightGeom(null)
    setDrawingActive(true)
  }

  // Something to take back: a running or finished drawing, or a picked area that is not the saved one.
  const hasGeometryToDiscard =
    drawingActive ||
    drawnGeometry != null ||
    JSON.stringify(state.studyArea ?? null) !== JSON.stringify(originalStudyArea)

  const handleStudyUpload = (geometry: StudyAreaGeometry, fileName: string) => {
    draw.cancel()
    setDrawingActive(false)
    onStudyAreaChange(geometry)
    setBoundaryHighlightGeom(geometry)
    fitToGeometry(geometry)
    if (!state.title) onTitleChange(fileName.replace(/\.(geo)?json$/i, ''))
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="flex flex-col gap-1 text-sm text-gray-700">
        Name des Planungsgebiets
        <input
          type="text"
          required
          aria-invalid={titleMissing}
          value={state.title}
          onChange={(e) => onTitleChange(e.target.value)}
          className={twJoin(
            spaceFinderPanelTitleInputClass,
            titleMissing && 'border-red-500 focus:border-red-500 focus:ring-red-500',
          )}
        />
      </label>
      {titleMissing && <p className="text-xs text-red-600">Bitte einen Namen angeben.</p>}

      {/* TODO Flächenfinder: Auswahl „Art & Größe der gesuchten Fläche“ ist über
          `SHOW_PLANNING_USE_CASE_UI` (spaceFinderDefaults.ts) ausgeblendet, weil sie bisher keinen
          Effekt auf Score oder Flächensuche hat. Der Block bleibt bewusst stehen und wird durch
          Umstellen des Flags wieder sichtbar; die Werte laufen weiterhin über die Defaults der
          aufrufenden Formulare (AreaWizard/AreaEditor) und werden gespeichert. */}
      {SHOW_PLANNING_USE_CASE_UI && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-gray-700">
            Art & Größe der gesuchten Fläche
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {PLANNING_USE_CASES.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  onUseCaseChange(key)
                  const defaultAreaM2 = PLANNING_USE_CASES.find((u) => u.key === key)?.defaultAreaM2
                  if (defaultAreaM2 != null) onAreaSizeM2Change(defaultAreaM2)
                }}
                className={radioButtonClass(state.useCase === key)}
              >
                {label}
              </button>
            ))}
          </div>
          <label className="flex items-center justify-between gap-2 text-xs text-gray-600">
            <span>Flächengröße (m²)</span>
            <input
              type="number"
              min={0}
              step={1}
              value={state.areaSizeM2 ?? ''}
              onChange={(e) =>
                onAreaSizeM2Change(
                  e.target.value === '' ? null : Math.max(0, Number(e.target.value)),
                )
              }
              className={spaceFinderNumberInputClass}
            />
          </label>
        </div>
      )}

      <WizardStep number={1} title={geometryStepTitle}>
        <div className="flex flex-col gap-1 text-xs text-gray-600">
          Berechnungsgebiet
          <div className="flex gap-1 rounded bg-gray-200 p-0.5">
            <button
              type="button"
              className={tabClass(state.areaTab === 'search')}
              onClick={() => switchTab('search')}
            >
              Gebiet suchen
            </button>
            <button
              type="button"
              className={tabClass(state.areaTab === 'custom')}
              onClick={() => switchTab('custom')}
            >
              Eigenes Gebiet
            </button>
          </div>
        </div>

        {state.areaTab === 'search' && (
          <BoundaryPicker
            value={state.boundaryId}
            onChange={(id, geom, name) => {
              onBoundaryIdChange(id)
              onStudyAreaChange(geom)
              onTitleChange(name)
            }}
          />
        )}

        {state.areaTab === 'custom' && (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={toggleDrawing}
              className={twJoin(
                'flex items-center justify-center gap-1.5',
                radioButtonClass(drawingActive),
              )}
            >
              <PencilSquareIcon className="h-4 w-4" />
              {drawingActive
                ? 'Zeichnen beenden'
                : effectiveStudyArea
                  ? 'Gebiet bearbeiten'
                  : 'Gebiet zeichnen'}
            </button>
            {hasGeometryToDiscard && (
              <button
                type="button"
                onClick={resetToOriginal}
                className="text-xs text-gray-500 underline hover:text-gray-700"
              >
                {originalStudyArea ? 'Änderungen am Gebiet verwerfen' : 'Gebiet verwerfen'}
              </button>
            )}
            {drawingActive && (
              <p key="drawing-hint" className="text-xs text-gray-500">
                Ecken ziehen oder auf eine Kante klicken, um das Gebiet zu ändern.
              </p>
            )}
            {/* Stable key: hiding the drawing hint must not remount the field and drop its state. */}
            <GeoJsonUpload key="study-area-geojson" onGeometry={handleStudyUpload} />
          </div>
        )}

        {areaTooLarge && (
          <p className="text-xs text-red-600">
            Das Berechnungsgebiet ist zu groß ({areaKm2?.toFixed(1)} km²). Maximal{' '}
            {MAX_STUDY_AREA_KM2} km² sind erlaubt.
          </p>
        )}
      </WizardStep>

      {showUserData && (
        <div>
          <div className={groupHeadlineClass}>
            <span className="flex items-center gap-1">
              Eigene Daten
              <InfoTooltip>{GROUP_HELP.eigendaten}</InfoTooltip>
            </span>
          </div>
          <div className="mt-1">
            <UserObstaclesField
              config={{
                user_geojson: state.userGeojson,
                user_geojson_mode: state.userGeojsonMode,
                weights: { w_eigendaten: 0.1 },
              }}
              setWeight={() => {}}
              setUserGeojson={onUserGeojsonChange}
              setUserGeojsonMode={onUserGeojsonModeChange}
              showWeight={false}
              showModePicker={false}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export const useEffectiveStudyArea = (studyArea: unknown) => {
  const drawnGeometry = useSpaceFinderDrawnGeometry()
  return studyArea ?? drawnGeometry
}

export const useStudyAreaKm2 = (studyArea: unknown) =>
  studyArea ? studyAreaSizeKm2(studyArea as GeoJSON.Geometry) : null
