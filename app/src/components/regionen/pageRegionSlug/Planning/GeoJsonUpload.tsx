import { ArrowUpTrayIcon } from '@heroicons/react/24/outline'
import { useRef, useState } from 'react'
import { type StudyAreaGeometry, parseStudyAreaGeometry } from './extractStudyAreaGeometry'

/**
 * Generic drag & drop (or click-to-pick) file field for GeoJSON uploads.
 *
 * Parsing/validation is injected via `parse`, so the same component powers both
 * the study-area upload (single Polygon) and the user-obstacle upload
 * (Points/Lines/Polygons). `maxBytes`, when set, rejects oversized files before
 * they are read into memory.
 */
export function GeoJsonUploadField<T>({
  parse,
  onResult,
  accept = '.geojson,.json,application/geo+json,application/json',
  maxBytes,
  label,
}: {
  parse: (text: string) => T
  onResult: (result: T, fileName: string) => void
  accept?: string
  maxBytes?: number
  /** Custom drop-zone hint; defaults to the study-area wording. */
  label?: React.ReactNode
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFile = async (file: File) => {
    setError(null)
    if (maxBytes != null && file.size > maxBytes) {
      setFileName(null)
      setError(`Datei zu groß (max. ${Math.round(maxBytes / 1024 / 1024)} MB).`)
      return
    }
    try {
      const text = await file.text()
      const result = parse(text)
      setFileName(file.name)
      onResult(result, file.name)
    } catch (e) {
      setFileName(null)
      setError((e as Error).message)
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          const file = e.dataTransfer.files[0]
          if (file) void handleFile(file)
        }}
        className={`flex flex-col items-center gap-1 rounded border-2 border-dashed px-3 py-4 text-center text-xs transition-colors ${
          dragOver
            ? 'border-blue-400 bg-blue-50 text-blue-700'
            : 'border-gray-300 text-gray-500 hover:border-gray-400 hover:bg-gray-50'
        }`}
      >
        <ArrowUpTrayIcon className="h-5 w-5" />
        <span>
          {label ?? (
            <>
              GeoJSON-Datei hierher ziehen
              <br />
              oder klicken zum Auswählen
            </>
          )}
        </span>
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
    </div>
  )
}

/** Study-area upload: a single Polygon/MultiPolygon. Thin wrapper over the generic field. */
export const GeoJsonUpload = ({
  onGeometry,
}: {
  onGeometry: (geometry: StudyAreaGeometry, fileName: string) => void
}) => <GeoJsonUploadField parse={parseStudyAreaGeometry} onResult={onGeometry} />
