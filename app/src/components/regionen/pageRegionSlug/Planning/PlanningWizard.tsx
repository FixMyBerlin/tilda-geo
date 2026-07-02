import { PencilSquareIcon } from '@heroicons/react/24/outline'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { bbox } from '@turf/turf'
import { useEffect, useMemo, useState } from 'react'
import { useMap } from 'react-map-gl/maplibre'
import { twJoin } from 'tailwind-merge'
import { MAX_STUDY_AREA_KM2, studyAreaSizeKm2 } from '@/lib/planningStudyAreaLimit'
import type { FactorConfig } from '@/server/planning/planning.functions'
import {
  createPlanningScenarioFn,
  runPlanningScenarioFn,
} from '@/server/planning/planning.functions'
import {
  planningScenariosQueryOptions,
  planningScenarioQueryOptions,
} from '@/server/planning/planningQueryOptions'
import { usePlanningBoundaryState } from '../hooks/mapState/usePlanningBoundaryState'
import { BoundaryPicker } from './BoundaryPicker'
import type { StudyAreaGeometry } from './extractStudyAreaGeometry'
import { FactorFields } from './FactorEditorPanel'
import { GeoJsonUpload } from './GeoJsonUpload'
import { DEFAULT_FACTOR_TEMPLATE, PLANNING_USE_CASES, type PlanningUseCase } from './planningDefaults'
import { WizardStep } from './WizardStep'

type AreaTab = 'search' | 'custom'

/**
 * 3-Schritte-Assistent zum Anlegen eines Szenarios: 1. Gebiet auswählen, 2. Art & Größe der
 * gesuchten Fläche, 3. Faktoren & Schwellenwerte. Der Abschluss-Button legt das Szenario an und
 * startet die Berechnung in einem Schritt (statt wie zuvor zwei getrennte Aktionen).
 */
export const PlanningWizard = ({
  regionSlug,
  onCreated,
  onCancel,
}: {
  regionSlug: string
  onCreated: (id: number) => void
  onCancel: () => void
}) => {
  const queryClient = useQueryClient()
  const { mainMap: map } = useMap()
  const setBoundaryHighlightGeom = usePlanningBoundaryState((s) => s.setBoundaryHighlightGeom)
  const setDrawingActive = usePlanningBoundaryState((s) => s.setDrawingActive)
  const drawingActive = usePlanningBoundaryState((s) => s.drawingActive)
  const drawnGeometry = usePlanningBoundaryState((s) => s.drawnGeometry)
  const setDrawnGeometry = usePlanningBoundaryState((s) => s.setDrawnGeometry)

  const [title, setTitle] = useState('')
  const [boundaryId, setBoundaryId] = useState<string | null>(null)
  const [studyArea, setStudyArea] = useState<unknown>(null)
  const [areaTab, setAreaTab] = useState<AreaTab>('search')

  const [useCase, setUseCase] = useState<PlanningUseCase>('fahrradbox')
  const [areaSizeM2, setAreaSizeM2] = useState<number | null>(
    PLANNING_USE_CASES.find((u) => u.key === 'fahrradbox')?.defaultAreaM2 ?? null,
  )

  const [config, setConfig] = useState<FactorConfig>({
    ...DEFAULT_FACTOR_TEMPLATE,
    study_area: null,
  } as FactorConfig)

  // Fly the map to a freshly chosen/uploaded geometry.
  const fitToGeometry = (geom: object) => {
    if (!map) return
    const [minLng, minLat, maxLng, maxLat] = bbox({
      type: 'Feature',
      geometry: geom as GeoJSON.Geometry,
      properties: {},
    })
    map.fitBounds([minLng, minLat, maxLng, maxLat], { padding: 60, duration: 800 })
  }

  // While drawing, TerraDraw renders the polygon itself and its geometry lives in `drawnGeometry`;
  // `studyArea` is set by search/upload. The effective area falls back to the live drawing so the
  // user can submit without first ending the draw (no extra highlight/fit to avoid flicker).
  const effectiveStudyArea = studyArea ?? drawnGeometry

  const areaKm2 = useMemo(
    () => (effectiveStudyArea ? studyAreaSizeKm2(effectiveStudyArea as GeoJSON.Geometry) : null),
    [effectiveStudyArea],
  )
  const areaTooLarge = areaKm2 != null && areaKm2 > MAX_STUDY_AREA_KM2

  // Reset all drawing/highlight state when the wizard unmounts.
  useEffect(() => {
    return () => {
      setDrawingActive(false)
      setDrawnGeometry(null)
      setBoundaryHighlightGeom(null)
    }
  }, [setDrawingActive, setDrawnGeometry, setBoundaryHighlightGeom])

  // Clear any previous selection when switching the area-definition method.
  const switchTab = (tab: AreaTab) => {
    setAreaTab(tab)
    setStudyArea(null)
    setBoundaryId(null)
    setDrawingActive(false)
    setDrawnGeometry(null)
    setBoundaryHighlightGeom(null)
  }

  const toggleDrawing = () => {
    if (drawingActive) {
      setDrawingActive(false)
      return
    }
    // Start a fresh drawing.
    setStudyArea(null)
    setDrawnGeometry(null)
    setBoundaryHighlightGeom(null)
    setDrawingActive(true)
  }

  const handleUpload = (geometry: StudyAreaGeometry, fileName: string) => {
    setDrawingActive(false)
    setStudyArea(geometry)
    setBoundaryHighlightGeom(geometry)
    fitToGeometry(geometry)
    if (!title) setTitle(fileName.replace(/\.(geo)?json$/i, ''))
  }

  const selectUseCase = (key: PlanningUseCase) => {
    setUseCase(key)
    const defaultAreaM2 = PLANNING_USE_CASES.find((u) => u.key === key)?.defaultAreaM2 ?? null
    if (defaultAreaM2 != null) setAreaSizeM2(defaultAreaM2)
  }

  const setWeight = (key: string, value: number) =>
    setConfig((c) => ({ ...c, weights: { ...c.weights, [key]: value } }))
  const setField = (key: keyof FactorConfig, value: number) =>
    setConfig((c) => ({ ...c, [key]: value }))
  const setVegetationDirection = (value: 'positive' | 'negative') =>
    setConfig((c) => ({ ...c, vegetation_direction: value }))

  const mutation = useMutation({
    mutationFn: async () => {
      if (!effectiveStudyArea) throw new Error('Bitte ein Gebiet auswählen')
      if (areaTooLarge)
        throw new Error(
          `Das Berechnungsgebiet ist zu groß (${areaKm2?.toFixed(1)} km²). Maximal ${MAX_STUDY_AREA_KM2} km² sind erlaubt.`,
        )
      const created = await createPlanningScenarioFn({
        data: {
          regionSlug,
          title,
          factorConfig: {
            ...config,
            study_area: effectiveStudyArea,
            use_case: useCase,
            area_size_m2: areaSizeM2,
          },
        },
      })
      await runPlanningScenarioFn({ data: { scenarioId: created.id } })
      return created
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries(planningScenariosQueryOptions(regionSlug))
      queryClient.invalidateQueries(planningScenarioQueryOptions(created.id))
      onCreated(created.id)
    },
  })

  const tabClass = (active: boolean) =>
    `flex-1 rounded px-2 py-1 text-xs font-medium ${
      active ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
    }`

  return (
    <div className="flex flex-col gap-2">
      <label className="flex flex-col gap-0.5 text-xs text-gray-600">
        Titel
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="rounded border border-gray-300 px-2 py-1 text-sm"
        />
      </label>

      <WizardStep number={1} title="Gebiet auswählen">
        <div className="flex flex-col gap-1 text-xs text-gray-600">
          Berechnungsgebiet
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
              setStudyArea(geom)
              setTitle(name)
            }}
            regionSlug={regionSlug}
          />
        )}

        {areaTab === 'custom' && (
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
              {drawingActive ? 'Zeichnen beenden' : 'Gebiet zeichnen'}
            </button>
            {drawingActive && (
              <p className="text-xs text-gray-500">In der Karte ein Polygon zeichnen.</p>
            )}
            <GeoJsonUpload onGeometry={handleUpload} />
          </div>
        )}

        {areaTooLarge && (
          <p className="text-xs text-red-600">
            Das Berechnungsgebiet ist zu groß ({areaKm2?.toFixed(1)} km²). Maximal{' '}
            {MAX_STUDY_AREA_KM2} km² sind erlaubt.
          </p>
        )}
      </WizardStep>

      <WizardStep number={2} title="Art & Größe der gesuchten Fläche">
        <div className="grid grid-cols-2 gap-1.5">
          {PLANNING_USE_CASES.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => selectUseCase(key)}
              className={twJoin(
                'rounded border px-2 py-1.5 text-xs font-medium transition-colors',
                useCase === key
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
              )}
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
            value={areaSizeM2 ?? ''}
            onChange={(e) => setAreaSizeM2(e.target.value === '' ? null : Number(e.target.value))}
            className="w-24 rounded border border-gray-300 px-1 py-0.5 text-right"
          />
        </label>

        <div className="rounded border border-dashed border-gray-300 bg-gray-50 px-2.5 py-2 text-xs text-gray-400">
          <span className="font-medium">Automatische Flächensuche</span> — bald verfügbar. Schlägt
          künftig passende Flächen innerhalb des Gebiets automatisch vor.
        </div>
      </WizardStep>

      <WizardStep number={3} title="Faktoren & Schwellenwerte">
        <FactorFields
          config={config}
          setWeight={setWeight}
          setField={setField}
          setVegetationDirection={setVegetationDirection}
        />
      </WizardStep>

      {mutation.isError && (
        <p className="text-xs text-red-600">{String((mutation.error as Error).message)}</p>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || !effectiveStudyArea || areaTooLarge}
          className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {mutation.isPending ? 'Wird gestartet…' : 'Berechnung jetzt starten'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          Abbrechen
        </button>
      </div>
    </div>
  )
}
