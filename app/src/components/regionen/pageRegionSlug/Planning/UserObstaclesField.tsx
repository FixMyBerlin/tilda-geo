import { MAX_USER_GEOJSON_BYTES, parseUserGeojson } from '@/lib/planningUserGeojson'
import type { FactorConfig } from '@/server/planning/planning.functions'
import { GeoJsonUploadField } from './GeoJsonUpload'
import { SegmentedChoice } from './SegmentedChoice'
import { ModifierSlider } from './WeightSlider'

const MODES = [
  ['bonus', 'Bonus'],
  ['penalty', 'Abzug'],
  ['exclude_inside', 'Ausschluss innen'],
  ['exclude_outside', 'Ausschluss außen'],
] as const

export type UserGeojsonMode = (typeof MODES)[number][0]

/**
 * Upload, Modus und – bei weichen Modi – Stärke-Slider im Block Eigene Daten.
 * Wird von `FactorFields` gerendert.
 */
export const UserObstaclesField = ({
  config,
  setWeight,
  setUserGeojson,
  setUserGeojsonMode,
  readOnly = false,
}: {
  config: FactorConfig
  setWeight: (key: string, value: number) => void
  setUserGeojson: (geojson: GeoJSON.FeatureCollection | undefined) => void
  setUserGeojsonMode: (mode: UserGeojsonMode) => void
  readOnly?: boolean
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
        <div className="flex items-center justify-between rounded border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs">
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
      ) : (
        !readOnly && (
          <div className="mt-2">
            <GeoJsonUploadField
              parse={parseUserGeojson}
              onResult={(fc) => setUserGeojson(fc)}
              maxBytes={MAX_USER_GEOJSON_BYTES}
              historyScope="user_geojson"
              label={
                <>
                  Eigene GeoJSON-Datei hierher ziehen
                  <br />
                  oder klicken (max. 5 MB)
                </>
              }
            />
          </div>
        )
      )}
      {geojson && (
        <SegmentedChoice
          options={MODES}
          value={mode}
          onChange={setUserGeojsonMode}
          disabled={readOnly}
          className="grid grid-cols-2 gap-1.5"
        />
      )}
      {showSlider && (
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
