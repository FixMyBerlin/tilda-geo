import { PencilSquareIcon } from '@heroicons/react/24/outline'
import { useStore } from '@tanstack/react-form'
import { bbox } from '@turf/turf'
import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { useMap } from 'react-map-gl/maplibre'
import { twJoin } from 'tailwind-merge'
import { fieldErrorClass, labelClass } from '@/components/shared/form/fields/sharedStyles'
import { TextField } from '@/components/shared/form/fields/TextField'
import { uniqueFormattedFormErrors } from '@/components/shared/form/formatError'
import type { FormApi } from '@/components/shared/form/types'
import { InfoTooltip } from '@/components/shared/InfoTooltip/InfoTooltip'
import { radioButtonClass } from '@/components/shared/SegmentedChoice/radioButtonClass'
import { MAX_STUDY_AREA_KM2, studyAreaSizeKm2 } from '@/lib/planningStudyAreaLimit'
import type { UserDataset } from '@/lib/planningUserGeojson'
import type { PlanningAreaFormValues } from '@/server/planning/planningFormSchemas'
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
} from '../factors/spaceFinderDefaults'
import {
  spaceFinderDiscardLinkClass,
  spaceFinderDiscardRowClass,
  spaceFinderNumberInputClass,
} from '../spaceFinderPanelStyles'
import { BoundaryPicker } from './BoundaryPicker'
import type { StudyAreaGeometry } from './extractStudyAreaGeometry'
import { GeoJsonUpload } from './GeoJsonUpload'
import { UserDatasetsField } from './UserDatasetsField'

type AreaTab = 'search' | 'custom'

const groupHeadlineClass = twJoin(labelClass, 'mb-0 flex items-baseline justify-between gap-2')

// Sections inside one rounded box, split by horizontal lines (like the Anzeige box).
const sectionClass = 'flex flex-col gap-2 p-2.5'

const tabClass = (active: boolean) =>
  `flex-1 rounded px-2 py-1 text-xs font-medium ${
    active ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
  }`

/**
 * The form as these fields see it: the datasets' GeoJSON is hidden from TanStack's deep key types,
 * which overflow on GeoJSON's recursive geometry types (TS2589). Only `userDatasets` is affected.
 */
type AreaFormFieldValues = Omit<PlanningAreaFormValues, 'userDatasets'> & { userDatasets: unknown }

type AreaFormFieldsProps = {
  form: FormApi<PlanningAreaFormValues>
  geometryStepTitle?: string
  /** The saved study area when an existing Gebiet is edited; "discard" goes back to it. */
  originalStudyArea?: StudyAreaGeometry | null
  /** Editing: open with the polygon already editable on the map, without a click on "Gebiet bearbeiten". */
  editGeometryOnOpen?: boolean
}

/**
 * Shared fields for creating or editing a planungsgebiet, inside the caller's `Form`. The drawn
 * study area lives in the space-finder store (the map draws outside the form) and is mirrored into
 * the `studyArea` field.
 */
export const AreaFormFields = ({
  form: areaForm,
  geometryStepTitle = 'Geometrie des Gebiets',
  originalStudyArea = null,
  editGeometryOnOpen = false,
}: AreaFormFieldsProps) => {
  const form = areaForm as unknown as FormApi<AreaFormFieldValues>
  const { mainMap: map } = useMap()
  const { setBoundaryHighlightGeom, setDrawingActive, setDrawnGeometry } =
    useSpaceFinderBoundaryActions()
  const drawingActive = useSpaceFinderDrawingActive()
  const drawnGeometry = useSpaceFinderDrawnGeometry()
  const draw = useSpaceFinderDraw()
  // UI-only state: which way the Gebiet is picked, and the picked boundary. Not submitted.
  const [areaTab, setAreaTab] = useState<AreaTab>(editGeometryOnOpen ? 'custom' : 'search')
  const [boundaryId, setBoundaryId] = useState<string | null>(null)
  // The name last filled in from a boundary or a file, see `suggestTitle`.
  const autoTitle = useRef<string | null>(null)

  const studyArea = useStore(form.store, (state) => state.values.studyArea)
  const showErrors = useStore(form.store, (state) => state.submissionAttempts > 0)
  const useCase = useStore(form.store, (state) => state.values.useCase)

  const areaKm2 = studyArea ? studyAreaSizeKm2(studyArea) : null
  const areaTooLarge = areaKm2 != null && areaKm2 > MAX_STUDY_AREA_KM2

  const setStudyArea = (geom: StudyAreaGeometry | null) => form.setFieldValue('studyArea', geom)
  // An effect event: `form` stays out of the sync effect's dependencies.
  const setStudyAreaFromDrawing = useEffectEvent(setStudyArea)

  useEffect(
    function syncDrawnStudyAreaIntoForm() {
      // The store is the source while drawing, and afterwards as long as the drawing is the area.
      // Every other source (boundary, upload, reset) clears `drawnGeometry` first.
      if (!drawingActive && drawnGeometry == null) return
      setStudyAreaFromDrawing(drawnGeometry)
    },
    [drawingActive, drawnGeometry],
  )

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

  // A name from the picked boundary or the file name — but never over a name someone typed.
  const suggestTitle = (name: string) => {
    const current = form.state.values.title
    if (current.trim() !== '' && current !== autoTitle.current) return
    form.setFieldValue('title', name)
    autoTitle.current = name
  }

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
    setStudyArea(originalStudyArea)
    setBoundaryHighlightGeom(originalStudyArea, { filled: false })
  }

  const switchTab = (tab: AreaTab) => {
    setAreaTab(tab)
    setBoundaryId(null)
    resetToOriginal()
  }

  // Drawing starts from the area that is there, so it can be changed instead of redrawn.
  // The sync effect then mirrors the drawing into the form.
  const startDrawing = () => {
    setDrawnGeometry(form.state.values.studyArea)
    setBoundaryHighlightGeom(null)
    setDrawingActive(true)
  }

  const startDrawingOnOpen = useEffectEvent(() => {
    if (editGeometryOnOpen) startDrawing()
  })
  // Only once per open form; later changes of the area must not restart the drawing.
  useEffect(function startEditingOnOpen() {
    startDrawingOnOpen()
  }, [])

  const toggleDrawing = () => {
    if (drawingActive) {
      draw.cancel()
      setDrawingActive(false)
      // Keep the finished area visible on the map once the drawing tools are gone.
      if (drawnGeometry) setBoundaryHighlightGeom(drawnGeometry)
      return
    }
    startDrawing()
  }

  // Throws the whole drawing away and starts a new one; undo can bring it back during the session.
  const discardAndRedraw = () => {
    draw.cancel()
    draw.replace([])
    setDrawnGeometry(null)
    setStudyArea(null)
    setBoundaryHighlightGeom(null)
    setDrawingActive(true)
  }

  const canDiscardArea = studyArea != null || draw.isDrawing
  // Editing only: the area differs from the saved one, so "back to the saved area" means something.
  const canRestoreOriginal =
    originalStudyArea != null &&
    JSON.stringify(studyArea ?? null) !== JSON.stringify(originalStudyArea)

  const handleStudyUpload = (geometry: StudyAreaGeometry, fileName: string) => {
    draw.cancel()
    setDrawingActive(false)
    setDrawnGeometry(null)
    setStudyArea(geometry)
    setBoundaryHighlightGeom(geometry)
    fitToGeometry(geometry)
    suggestTitle(fileName.replace(/\.(geo)?json$/i, ''))
  }

  return (
    <div className="p-3">
      <div className="flex flex-col divide-y divide-gray-300 rounded border border-gray-300 bg-gray-100">
        <div className={sectionClass}>
          <TextField form={form} name="title" label="Name" />

          {/* TODO Flächenfinder: the „Art & Größe der gesuchten Fläche“ selection is hidden via
          `SHOW_PLANNING_USE_CASE_UI` (spaceFinderDefaults.ts) because it has no effect on score or
          area search yet. The block stays on purpose and reappears by flipping the flag; the
          values still come from the defaults of the calling forms (AreaWizard/AreaEditor) and
          are saved. */}
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
                      form.setFieldValue('useCase', key)
                      const defaultAreaM2 = PLANNING_USE_CASES.find(
                        (u) => u.key === key,
                      )?.defaultAreaM2
                      if (defaultAreaM2 != null) form.setFieldValue('areaSizeM2', defaultAreaM2)
                    }}
                    className={radioButtonClass(useCase === key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <form.Field name="areaSizeM2">
                {(field) => (
                  <div>
                    <label className="flex items-center justify-between gap-2 text-xs text-gray-600">
                      <span>Flächengröße (m²)</span>
                      <input
                        name={field.name}
                        type="number"
                        min={0}
                        step={1}
                        value={field.state.value ?? ''}
                        onBlur={field.handleBlur}
                        onChange={(e) =>
                          field.handleChange(e.target.value === '' ? null : Number(e.target.value))
                        }
                        aria-invalid={field.state.meta.errors.length > 0}
                        className={spaceFinderNumberInputClass}
                      />
                    </label>
                    {uniqueFormattedFormErrors(field.state.meta.errors).map((message) => (
                      <p key={message} role="alert" className={fieldErrorClass}>
                        {message}
                      </p>
                    ))}
                  </div>
                )}
              </form.Field>
            </div>
          )}
        </div>

        <div className={sectionClass}>
          <div className={groupHeadlineClass}>{geometryStepTitle}</div>
          <div className="flex flex-col gap-1 text-xs text-gray-600">
            <div className="flex gap-1 rounded bg-gray-200 p-0.5">
              <button
                type="button"
                className={tabClass(areaTab === 'search')}
                onClick={() => switchTab('search')}
              >
                Gebiet suchen
              </button>
              <button
                type="button"
                className={tabClass(areaTab === 'custom')}
                onClick={() => switchTab('custom')}
              >
                Eigenes Gebiet
              </button>
            </div>
          </div>

          {areaTab === 'search' && (
            <BoundaryPicker
              value={boundaryId}
              onChange={(id, geom, name) => {
                setBoundaryId(id)
                setDrawnGeometry(null)
                setStudyArea(geom as StudyAreaGeometry)
                suggestTitle(name)
              }}
            />
          )}

          {areaTab === 'custom' && (
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
                  : studyArea
                    ? 'Gebiet bearbeiten'
                    : 'Gebiet zeichnen'}
              </button>
              {(canDiscardArea || canRestoreOriginal) && (
                <div className={spaceFinderDiscardRowClass}>
                  {canDiscardArea && (
                    <button
                      type="button"
                      onClick={discardAndRedraw}
                      className={spaceFinderDiscardLinkClass}
                    >
                      Gebiet verwerfen
                    </button>
                  )}
                  {canRestoreOriginal && (
                    <button
                      type="button"
                      onClick={resetToOriginal}
                      className={spaceFinderDiscardLinkClass}
                    >
                      Änderungen am Gebiet verwerfen
                    </button>
                  )}
                </div>
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

          {areaTooLarge ? (
            <p className={fieldErrorClass}>
              Das Berechnungsgebiet ist zu groß ({areaKm2?.toFixed(1)} km²). Maximal{' '}
              {MAX_STUDY_AREA_KM2} km² sind erlaubt.
            </p>
          ) : (
            <form.Field name="studyArea">
              {(field) =>
                showErrors &&
                uniqueFormattedFormErrors(field.state.meta.errors).map((message) => (
                  <p key={message} role="alert" className={fieldErrorClass}>
                    {message}
                  </p>
                ))
              }
            </form.Field>
          )}
        </div>

        <div className={sectionClass}>
          <div className={groupHeadlineClass}>
            <span className="flex items-center gap-1">
              Eigene Daten
              <InfoTooltip>{GROUP_HELP.eigendaten}</InfoTooltip>
            </span>
          </div>
          <form.Field name="userDatasets">
            {(field) => (
              <UserDatasetsField
                datasets={field.state.value as UserDataset[]}
                onChange={(datasets) => field.handleChange(datasets)}
                studyArea={studyArea}
                showErrors={showErrors}
              />
            )}
          </form.Field>
        </div>
      </div>
    </div>
  )
}
