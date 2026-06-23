import { ArrowUpTrayIcon } from '@heroicons/react/24/outline'
import { useRef, useState } from 'react'
import { type StudyAreaGeometry, parseStudyAreaGeometry } from './extractStudyAreaGeometry'

/** Drag & drop (or click-to-pick) a GeoJSON file containing a single Polygon/MultiPolygon. */
export const GeoJsonUpload = ({
  onGeometry,
}: {
  onGeometry: (geometry: StudyAreaGeometry, fileName: string) => void
}) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFile = async (file: File) => {
    setError(null)
    try {
      const text = await file.text()
      const geometry = parseStudyAreaGeometry(text)
      setFileName(file.name)
      onGeometry(geometry, file.name)
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
          GeoJSON-Datei hierher ziehen
          <br />
          oder klicken zum Auswählen
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".geojson,.json,application/geo+json,application/json"
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
