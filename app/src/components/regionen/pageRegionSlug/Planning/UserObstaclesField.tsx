import { MAX_USER_GEOJSON_BYTES, parseUserGeojson } from '@/lib/planningUserGeojson'
import type { FactorConfig } from '@/server/planning/planning.functions'
import { GeoJsonUploadField } from './GeoJsonUpload'
import { SegmentedChoice } from './SegmentedChoice'
import { WeightScaleLegend, WeightSlider } from './WeightSlider'

const MODES = [
  ['bonus', 'Bonus'],
  ['penalty', 'Abzug'],
  ['exclude_inside', 'Ausschluss innen'],
  ['exclude_outside', 'Ausschluss außen'],
] as const

export type UserGeojsonMode = (typeof MODES)[number][0]

/**
 * Gesammelter Block „Eigene Flächen": Upload einer GeoJSON-Datei (Punkte/Linien/
 * Flächen) plus Wirkungsmodus und – bei weichen Modi – Stärke. Komponiert aus den
 * geteilten Bausteinen `GeoJsonUploadField` und `SegmentedChoice`. Wird von
 * `FactorFields` gerendert und erscheint dadurch in Wizard und Editor.
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

  return (
    <div>
      <div className="mb-1 font-semibold">Eigene Flächen</div>
      <p className="mb-1.5 text-xs text-gray-500">
        GeoJSON hochladen (Punkte, Linien, Flächen). Punkte werden mit 1,5 m, Linien mit 2,5 m
        gepuffert. „Bonus/Abzug“ verschieben den Gesamtscore innerhalb der Fläche; „Ausschluss
        innen/außen“ schließen Hexagone hart aus (Gesamtscore 0).
      </p>

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
          <GeoJsonUploadField
            parse={parseUserGeojson}
            onResult={(fc) => setUserGeojson(fc)}
            maxBytes={MAX_USER_GEOJSON_BYTES}
            label={
              <>
                Eigene GeoJSON-Datei hierher ziehen
                <br />
                oder klicken (max. 5 MB)
              </>
            }
          />
        )
      )}

      {geojson && (
        <div className="mt-1.5 flex flex-col gap-1.5">
          <SegmentedChoice
            options={MODES}
            value={mode}
            onChange={setUserGeojsonMode}
            disabled={readOnly}
            className="grid grid-cols-2 gap-1.5"
          />
          {isSoft && (
            <div>
              {!readOnly && <WeightScaleLegend />}
              <WeightSlider
                label="Stärke"
                weight={weight}
                onChange={(value) => setWeight('w_eigendaten', value)}
                readOnly={readOnly}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
