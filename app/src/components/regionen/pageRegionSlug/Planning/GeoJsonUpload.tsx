import { ArrowUpTrayIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useEffect, useRef, useState } from 'react'
import {
  deleteGeojsonHistoryEntry,
  type GeojsonHistoryEntry,
  type GeojsonHistoryKind,
  listGeojsonHistoryEntries,
  saveGeojsonHistoryEntry,
} from '@/lib/planningGeojsonHistory'
import {
  convertGeopackageToGeoJson,
  isGeopackageFile,
  mightNeedReprojection,
  reprojectToWgs84,
} from '@/lib/planningGeoConversion'
import { type StudyAreaGeometry, parseStudyAreaGeometry } from './extractStudyAreaGeometry'
import { Spinner } from './Spinner'

/**
 * Normalises an uploaded file to a GeoJSON string before it reaches `parse`: converts
 * GeoPackage files and reprojects legacy `crs`-tagged GeoJSON to WGS84. Both steps
 * dynamically import their (WASM-backed) dependency, so a plain WGS84 GeoJSON upload —
 * the common case — never pays for either.
 */
async function readAsGeoJsonText(file: File): Promise<string> {
  if (isGeopackageFile(file)) {
    const featureCollection = await convertGeopackageToGeoJson(file)
    return JSON.stringify(featureCollection)
  }
  const text = await file.text()
  if (!mightNeedReprojection(text)) return text
  let parsed: GeoJSON.GeoJSON
  try {
    parsed = JSON.parse(text) as GeoJSON.GeoJSON
  } catch {
    return text // invalid JSON — let `parse` below report it with its usual formatting
  }
  return JSON.stringify(await reprojectToWgs84(parsed))
}

/**
 * Generic drag & drop (or click-to-pick) file field for GeoJSON uploads.
 *
 * Parsing/validation is injected via `parse`, so the same component powers both
 * the study-area upload (single Polygon) and the user-obstacle upload
 * (Points/Lines/Polygons). `maxBytes`, when set, rejects oversized files before
 * they are read into memory. Every successful upload is also persisted to
 * IndexedDB under `historyScope` and the current region, so it shows up in a list
 * below the drop-zone – but only in the region it was uploaded in – for later
 * re-selection (clicking an entry behaves exactly like re-uploading it).
 */
export function GeoJsonUploadField<T>({
  parse,
  onResult,
  accept = '.geojson,.json,.gpkg,application/geo+json,application/json',
  maxBytes,
  label,
  historyScope,
  regionSlug,
}: {
  parse: (text: string) => T
  onResult: (result: T, fileName: string) => void
  accept?: string
  maxBytes?: number
  /** Custom drop-zone hint; defaults to the study-area wording. */
  label?: React.ReactNode
  /** Namespace for the IndexedDB upload history, e.g. `study_area` or `user_geojson`. */
  historyScope: GeojsonHistoryKind
  /** Uploads are only listed again in the region they were made for. */
  regionSlug: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [history, setHistory] = useState<GeojsonHistoryEntry[]>([])
  const [isConverting, setIsConverting] = useState(false)

  const refreshHistory = () => {
    void listGeojsonHistoryEntries(regionSlug, historyScope).then(setHistory)
  }

  useEffect(refreshHistory, [historyScope, regionSlug])

  const handleFile = async (file: File) => {
    setError(null)
    if (maxBytes != null && file.size > maxBytes) {
      setFileName(null)
      setError(`Datei zu groß (max. ${Math.round(maxBytes / 1024 / 1024)} MB).`)
      return
    }
    setIsConverting(true)
    try {
      const text = await readAsGeoJsonText(file)
      const result = parse(text)
      setFileName(file.name)
      onResult(result, file.name)
      await saveGeojsonHistoryEntry(regionSlug, historyScope, file.name, result)
      refreshHistory()
    } catch (e) {
      setFileName(null)
      setError((e as Error).message)
    } finally {
      setIsConverting(false)
    }
  }

  const selectHistoryEntry = (entry: GeojsonHistoryEntry) => {
    setError(null)
    setFileName(entry.fileName)
    onResult(entry.data as T, entry.fileName)
  }

  const deleteHistoryEntry = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    await deleteGeojsonHistoryEntry(id)
    refreshHistory()
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        disabled={isConverting}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          if (isConverting) return
          const file = e.dataTransfer.files[0]
          if (file) void handleFile(file)
        }}
        className={`flex flex-col items-center gap-1 rounded border-2 border-dashed px-3 py-4 text-center text-xs transition-colors ${
          isConverting
            ? 'cursor-wait border-gray-300 text-gray-500'
            : dragOver
              ? 'border-blue-400 bg-blue-50 text-blue-700'
              : 'border-gray-300 text-gray-500 hover:border-gray-400 hover:bg-gray-50'
        }`}
      >
        {isConverting ? (
          <>
            <Spinner className="h-5 w-5 border-blue-500" />
            <span>Datei wird verarbeitet …</span>
          </>
        ) : (
          <>
            <ArrowUpTrayIcon className="h-5 w-5" />
            <span>
              {label ?? (
                <>
                  GeoJSON- oder GeoPackage-Datei hierher ziehen
                  <br />
                  oder klicken zum Auswählen
                </>
              )}
            </span>
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void handleFile(file)
          e.target.value = ''
        }}
      />
      {fileName && !error && <p className="text-xs text-green-700">✓ {fileName}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}

      {history.length > 0 && (
        <ul className="flex flex-col gap-0.5">
          {history.map((entry) => (
            <li
              key={entry.id}
              className="flex items-center justify-between gap-2 rounded border border-gray-200 px-2 py-1 text-xs text-gray-700 hover:border-gray-300 hover:bg-gray-50"
            >
              <button
                type="button"
                onClick={() => selectHistoryEntry(entry)}
                className="min-w-0 flex-1 truncate text-left"
              >
                {entry.fileName}
              </button>
              <button
                type="button"
                onClick={(e) => void deleteHistoryEntry(entry.id, e)}
                className="shrink-0 text-gray-400 hover:text-red-600"
                aria-label={`${entry.fileName} löschen`}
              >
                <XMarkIcon className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** Study-area upload: a single Polygon/MultiPolygon. Thin wrapper over the generic field. */
export const GeoJsonUpload = ({
  onGeometry,
  regionSlug,
}: {
  onGeometry: (geometry: StudyAreaGeometry, fileName: string) => void
  regionSlug: string
}) => (
  <GeoJsonUploadField
    parse={parseStudyAreaGeometry}
    onResult={onGeometry}
    historyScope="study_area"
    regionSlug={regionSlug}
  />
)
