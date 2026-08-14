import { PencilSquareIcon } from '@heroicons/react/24/outline'
import { bbox } from '@turf/turf'
import { useEffect, useMemo } from 'react'
import { useMap } from 'react-map-gl/maplibre'
import { twJoin } from 'tailwind-merge'
import { MAX_STUDY_AREA_KM2, studyAreaSizeKm2 } from '@/lib/planningStudyAreaLimit'
import { usePlanningBoundaryState } from '../hooks/mapState/usePlanningBoundaryState'
import { BoundaryPicker } from './BoundaryPicker'
import type { StudyAreaGeometry } from './extractStudyAreaGeometry'
import { GeoJsonUpload } from './GeoJsonUpload'
import { InfoTooltip } from './InfoTooltip'
import { GROUP_HELP } from './planningDefaults'
import { planningPanelTitleInputClass } from './planningPanelStyles'
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
}

type AreaFormFieldsProps = {
  regionSlug: string
  state: AreaFormState
  onTitleChange: (title: string) => void
  onBoundaryIdChange: (id: string | null) => void
  onStudyAreaChange: (geom: unknown) => void
  onAreaTabChange: (tab: AreaTab) => void
  onUserGeojsonChange: (geojson: GeoJSON.FeatureCollection | undefined) => void
  onUserGeojsonModeChange: (mode: UserGeojsonMode) => void
  titleMissing?: boolean
  showUserData?: boolean
  geometryStepTitle?: string
}

/** Shared fields for creating or editing a planungsgebiet. */
export const AreaFormFields = ({
  regionSlug,
  state,
  onTitleChange,
  onBoundaryIdChange,
  onStudyAreaChange,
  onAreaTabChange,
  onUserGeojsonChange,
  onUserGeojsonModeChange,
  titleMissing = false,
  showUserData = true,
  geometryStepTitle = 'Gebiet auswählen',
}: AreaFormFieldsProps) => {
  const { mainMap: map } = useMap()
  const setBoundaryHighlightGeom = usePlanningBoundaryState((s) => s.setBoundaryHighlightGeom)
  const setDrawingActive = usePlanningBoundaryState((s) => s.setDrawingActive)
  const drawingActive = usePlanningBoundaryState((s) => s.drawingActive)
  const drawnGeometry = usePlanningBoundaryState((s) => s.drawnGeometry)
  const setDrawnGeometry = usePlanningBoundaryState((s) => s.setDrawnGeometry)

  const effectiveStudyArea = state.studyArea ?? drawnGeometry

  const areaKm2 = useMemo(
    () => (effectiveStudyArea ? studyAreaSizeKm2(effectiveStudyArea as GeoJSON.Geometry) : null),
    [effectiveStudyArea],
  )
  const areaTooLarge = areaKm2 != null && areaKm2 > MAX_STUDY_AREA_KM2

  useEffect(() => {
    return () => {
      setDrawingActive(false)
      setDrawnGeometry(null)
      setBoundaryHighlightGeom(null)
    }
  }, [setDrawingActive, setDrawnGeometry, setBoundaryHighlightGeom])

  const fitToGeometry = (geom: object) => {
    if (!map) return
    const [minLng, minLat, maxLng, maxLat] = bbox({
      type: 'Feature',
      geometry: geom as GeoJSON.Geometry,
      properties: {},
    })
    map.fitBounds([minLng, minLat, maxLng, maxLat], { padding: 60, duration: 800 })
  }

  const switchTab = (tab: AreaTab) => {
    onAreaTabChange(tab)
    onStudyAreaChange(null)
    onBoundaryIdChange(null)
    setDrawingActive(false)
    setDrawnGeometry(null)
    setBoundaryHighlightGeom(null)
  }

  const toggleDrawing = () => {
    if (drawingActive) {
      setDrawingActive(false)
      return
    }
    onStudyAreaChange(null)
    setDrawnGeometry(null)
    setBoundaryHighlightGeom(null)
    setDrawingActive(true)
  }

  const handleStudyUpload = (geometry: StudyAreaGeometry, fileName: string) => {
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
            planningPanelTitleInputClass,
            titleMissing && 'border-red-500 focus:border-red-500 focus:ring-red-500',
          )}
        />
      </label>
      {titleMissing && <p className="text-xs text-red-600">Bitte einen Namen angeben.</p>}

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
            regionSlug={regionSlug}
          />
        )}

        {state.areaTab === 'custom' && (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={toggleDrawing}
              className={`flex items-center justify-center gap-1.5 rounded border px-2 py-1.5 text-xs font-medium ${
                drawingActive
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <PencilSquareIcon className="h-4 w-4" />
              {drawingActive ? 'Zeichnen abbrechen' : 'Gebiet zeichnen'}
            </button>
            {drawingActive && (
              <p className="text-xs text-gray-500">In der Karte ein Polygon zeichnen.</p>
            )}
            <GeoJsonUpload onGeometry={handleStudyUpload} />
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
            />
          </div>
        </div>
      )}
    </div>
  )
}

export const useEffectiveStudyArea = (studyArea: unknown) => {
  const drawnGeometry = usePlanningBoundaryState((s) => s.drawnGeometry)
  return studyArea ?? drawnGeometry
}

export const useStudyAreaKm2 = (studyArea: unknown) =>
  useMemo(() => (studyArea ? studyAreaSizeKm2(studyArea as GeoJSON.Geometry) : null), [studyArea])
