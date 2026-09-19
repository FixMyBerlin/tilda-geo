import {
  MAX_USER_GEOJSON_BYTES,
  MAX_USER_GEOJSON_FEATURES,
  parseUserGeojson,
} from '@/lib/planningUserGeojson'
import type { FactorConfig } from '@/server/planning/planning.functions'
import { GeoJsonUploadField } from './GeoJsonUpload'
import { SegmentedChoice } from './SegmentedChoice'
import { ModifierSlider } from './WeightSlider'

/** `[value, label, tooltip]` — die Erklärung erscheint als Info-Icon auf dem jeweiligen Button. */
export const USER_GEOJSON_MODES = [
  [
    'bonus',
    'Bonus',
    'Erhöht den Score innerhalb der hochgeladenen Fläche um die eingestellte Stärke.',
  ],
  [
    'penalty',
    'Abzug',
    'Senkt den Score innerhalb der hochgeladenen Fläche um die eingestellte Stärke.',
  ],
  [
    'exclude_inside',
    'Ausschluss innen',
    'Schließt die hochgeladene Fläche komplett von der Suche aus, z. B. für Tabuzonen.',
  ],
  [
    'exclude_outside',
    'Ausschluss außen',
    'Nur die hochgeladene Fläche bleibt zulässig, alles andere wird ausgeschlossen, z. B. für erlaubte Zonen.',
  ],
] as const

export type UserGeojsonMode = (typeof USER_GEOJSON_MODES)[number][0]

export type UserObstaclesConfig = Pick<
  FactorConfig,
  'user_geojson' | 'user_geojson_mode' | 'weights'
>

/**
 * Upload, Modus und – bei weichen Modi – Stärke-Slider im Block Eigene Daten.
 */
export const UserObstaclesField = ({
  config,
  regionSlug,
  setWeight,
  setUserGeojson,
  setUserGeojsonMode,
  readOnly = false,
  showWeight = true,
  showModePicker = true,
}: {
  config: UserObstaclesConfig
  /** Frühere Uploads werden nur in der Region wieder vorgeschlagen, in der sie entstanden. */
  regionSlug: string
  setWeight: (key: string, value: number) => void
  setUserGeojson: (geojson: GeoJSON.FeatureCollection | undefined) => void
  setUserGeojsonMode: (mode: UserGeojsonMode) => void
  readOnly?: boolean
  /** Gewicht-Slider nur in der Varianten-Faktoransicht; am Planungsgebiet entfällt er. */
  showWeight?: boolean
  /** Modus (Bonus/Abzug/Ausschluss) wird in der Faktoren-Auswahl gewählt, nicht am
   *  Planungsgebiet — dort bleibt nur der Upload. */
  showModePicker?: boolean
}) => {
  const geojson = config.user_geojson as GeoJSON.FeatureCollection | undefined
  const mode = (config.user_geojson_mode ?? 'bonus') as UserGeojsonMode
  const featureCount = geojson?.features?.length ?? 0
  const isSoft = mode === 'bonus' || mode === 'penalty'
  const weight = config.weights?.w_eigendaten ?? 0
  const showSlider = isSoft && !!geojson

  return (
    <div className="space-y-1">
      {geojson ? (
        <div className="rounded border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-green-700">✓ {featureCount} Objekt(e) geladen</span>
            {!readOnly && (
              <button
                type="button"
                onClick={() => setUserGeojson(undefined)}
                className="text-gray-500 hover:text-red-600"
              >
                Entfernen
              </button>
            )}
          </div>
          {!showModePicker && (
            <p className="mt-1 text-gray-500">
              Umgang mit der Datei (Bonus/Abzug/Ausschluss) bei den Faktoren einstellen.
            </p>
          )}
        </div>
      ) : (
        !readOnly && (
          <div className="mt-2">
            <GeoJsonUploadField
              parse={parseUserGeojson}
              onResult={(fc) => setUserGeojson(fc)}
              maxBytes={MAX_USER_GEOJSON_BYTES}
              historyScope="user_geojson"
              regionSlug={regionSlug}
              label={
                <>
                  Eigene GeoJSON- oder GeoPackage-Datei hierher ziehen
                  <br />
                  oder klicken (max. {MAX_USER_GEOJSON_BYTES / 1024 / 1024} MB,{' '}
                  {MAX_USER_GEOJSON_FEATURES.toLocaleString('de-DE')} Objekte)
                </>
              }
            />
          </div>
        )
      )}
      {geojson && showModePicker && (
        <SegmentedChoice
          options={USER_GEOJSON_MODES}
          value={mode}
          onChange={setUserGeojsonMode}
          disabled={readOnly}
          className="grid grid-cols-2 gap-1.5"
        />
      )}
      {showWeight && showSlider && (
        <ModifierSlider
          label="Stärke"
          weight={weight}
          direction={mode === 'penalty' ? 'negative' : 'positive'}
          onChange={(value) => setWeight('w_eigendaten', value)}
          readOnly={readOnly}
        />
      )}
    </div>
  )
}
