import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { useDeferredValue, useState } from 'react'
import { SegmentedChoice } from '@/components/shared/SegmentedChoice/SegmentedChoice'
import {
  defaultUserDatasetName,
  isDuplicateUserDatasetName,
  MAX_USER_DATASET_NAME_LENGTH,
  MAX_USER_DATASETS,
  MAX_USER_DATASETS_BYTES,
  MAX_USER_GEOJSON_BYTES,
  MAX_USER_GEOJSON_FEATURES,
  newUserDatasetId,
  parseUserGeojson,
  type UserDataset,
  type UserDatasetMode,
  userDatasetCoverage,
  userDatasetCoverageMessage,
  userGeojsonByteSize,
} from '@/lib/planningUserGeojson'
import { RemoveIconButton } from '../RemoveIconButton'
import { spaceFinderPanelTitleInputClass } from '../spaceFinderPanelStyles'
import { GeoJsonUploadField } from './GeoJsonUpload'

/** `[value, label, tooltip]` — die Erklärung erscheint als Info-Icon auf dem jeweiligen Button. */
export const USER_DATASET_MODE_OPTIONS = [
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
] as const satisfies readonly (readonly [UserDatasetMode, string, string])[]

/** Alle Namen gefüllt und verschieden? Sonst lehnt der Server ab — Speichern bleibt gesperrt. */
export const userDatasetsValid = (datasets: UserDataset[]) =>
  datasets.every(
    (dataset) => dataset.name.trim().length > 0 && !isDuplicateUserDatasetName(datasets, dataset),
  )

/** Amber-Hinweis, wenn Daten (ganz oder teilweise) außerhalb des Planungsgebiets liegen. */
export const UserDatasetCoverageHint = ({ message }: { message: string }) => (
  <p className="flex items-start gap-1 rounded bg-amber-50 px-2 py-1 text-xs text-amber-800">
    <ExclamationTriangleIcon className="mt-px h-4 w-4 shrink-0" aria-hidden="true" />
    <span>{message}</span>
  </p>
)

/**
 * Liste der Eigene-Daten-Datensätze eines Planungsgebiets: je Datensatz Name (erscheint im Scoring
 * und in der Sidebar), Modus (Bonus/Abzug/Ausschluss, gilt für alle Varianten), Objektzahl, Hinweis
 * bei Daten außerhalb des Gebiets und „Entfernen“; darunter der Upload für einen weiteren Datensatz.
 * Nur die Stärke bei Bonus/Abzug gehört zur Variante und steht im Faktoren-Block.
 */
export const UserDatasetsField = ({
  datasets,
  onChange,
  studyArea,
  readOnly = false,
  showErrors = false,
}: {
  datasets: UserDataset[]
  onChange: (datasets: UserDataset[]) => void
  /** Geometrie des Planungsgebiets für den Außerhalb-Hinweis (gezeichnet oder gespeichert). */
  studyArea: GeoJSON.Geometry | null | undefined
  readOnly?: boolean
  /** Nach einem Absende-Versuch: fehlende Namen markieren — wie beim Namen des Gebiets. */
  showErrors?: boolean
}) => {
  const [limitError, setLimitError] = useState<string | null>(null)
  const atLimit = datasets.length >= MAX_USER_DATASETS

  // Beim Zeichnen ändert sich das Gebiet laufend; der Hinweis darf hinterherhinken, die Karte nicht.
  const deferredStudyArea = useDeferredValue(studyArea)

  const add = (geojson: GeoJSON.FeatureCollection, fileName: string) => {
    const next: UserDataset = {
      id: newUserDatasetId(datasets),
      name: defaultUserDatasetName(fileName, datasets),
      mode: 'bonus',
      geojson,
    }
    const nextList = [...datasets, next]
    if (userGeojsonByteSize(nextList) > MAX_USER_DATASETS_BYTES) {
      setLimitError(
        `Alle Datensätze zusammen dürfen höchstens ${MAX_USER_DATASETS_BYTES / 1024 / 1024} MB groß sein.`,
      )
      return
    }
    setLimitError(null)
    onChange(nextList)
  }

  const update = (id: string, change: Partial<Pick<UserDataset, 'name' | 'mode'>>) =>
    onChange(datasets.map((dataset) => (dataset.id === id ? { ...dataset, ...change } : dataset)))

  const remove = (id: string) => {
    setLimitError(null)
    onChange(datasets.filter((dataset) => dataset.id !== id))
  }

  return (
    <div className="space-y-2">
      {datasets.length > 0 && (
        <ul className="space-y-2">
          {datasets.map((dataset) => {
            const nameMissing = showErrors && dataset.name.trim().length === 0
            const coverageMessage = userDatasetCoverageMessage(
              userDatasetCoverage(dataset.geojson, deferredStudyArea),
            )
            return (
              <li
                key={dataset.id}
                className="space-y-1 rounded border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={dataset.name}
                    maxLength={MAX_USER_DATASET_NAME_LENGTH}
                    disabled={readOnly}
                    onChange={(event) => update(dataset.id, { name: event.target.value })}
                    aria-label="Name des Datensatzes"
                    aria-invalid={nameMissing}
                    placeholder="Name des Datensatzes"
                    className={spaceFinderPanelTitleInputClass}
                  />
                  {!readOnly && (
                    <RemoveIconButton
                      label={`Datensatz ${dataset.name.trim() || 'ohne Namen'} entfernen`}
                      onClick={() => remove(dataset.id)}
                    />
                  )}
                </div>
                {nameMissing && <p className="text-red-600">Bitte einen Namen angeben.</p>}
                {isDuplicateUserDatasetName(datasets, dataset) && (
                  <p className="text-red-600">Diesen Namen trägt schon ein anderer Datensatz.</p>
                )}
                <p className="text-green-700">
                  ✓ {dataset.geojson.features.length.toLocaleString('de-DE')} Objekt(e) geladen
                </p>
                {coverageMessage && <UserDatasetCoverageHint message={coverageMessage} />}
                <SegmentedChoice
                  options={USER_DATASET_MODE_OPTIONS}
                  value={dataset.mode}
                  onChange={(mode) => update(dataset.id, { mode })}
                  disabled={readOnly}
                  className="grid grid-cols-2 gap-1.5"
                />
              </li>
            )
          })}
        </ul>
      )}

      {datasets.some((dataset) => dataset.mode === 'bonus' || dataset.mode === 'penalty') && (
        <p className="text-xs text-gray-500">
          Die Stärke von Bonus und Abzug stellt jede Variante bei den Faktoren ein.
        </p>
      )}

      {!readOnly && !atLimit && (
        <GeoJsonUploadField
          parse={parseUserGeojson}
          onResult={add}
          maxBytes={MAX_USER_GEOJSON_BYTES}
          historyScope="user_geojson"
          label={
            <>
              {datasets.length === 0
                ? 'Eigene GeoJSON- oder GeoPackage-Datei hierher ziehen'
                : 'Weitere GeoJSON- oder GeoPackage-Datei hierher ziehen'}
              <br />
              oder klicken (max. {MAX_USER_GEOJSON_BYTES / 1024 / 1024} MB,{' '}
              {MAX_USER_GEOJSON_FEATURES.toLocaleString('de-DE')} Objekte je Datei)
            </>
          }
        />
      )}
      {atLimit && (
        <p className="text-xs text-gray-500">
          Mehr als {MAX_USER_DATASETS} Datensätze sind nicht möglich.
        </p>
      )}
      {limitError && <p className="text-xs text-red-600">{limitError}</p>}
    </div>
  )
}
