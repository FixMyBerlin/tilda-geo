import { useState } from 'react'
import { useActiveBikelanesLayers } from './useActiveBikelanesLayers'
import type { BikelanesWidthOperator } from './useBikelanesFilterState'
import { useBikelanesFilterActions, useBikelanesWidthFilter } from './useBikelanesFilterState'
import { BikelanesFuehrungsformFilterPill } from './BikelanesFuehrungsformFilterPill'
import { BikelanesOberflaecheFilterPill } from './BikelanesOberflaecheFilterPill'

const WIDTH_OPERATOR_OPTIONS: { value: BikelanesWidthOperator; label: string }[] = [
  { value: 'gt', label: 'Breite >' },
  { value: 'lt', label: 'Breite <' },
  { value: 'eq', label: 'Breite =' },
]

/** Prototype filter UI for the Radinfrastruktur (bikelanes) layer: a "Führungsform" pill that
 * opens a checklist, plus a Breite comparator. Only rendered while a bikelanes style is
 * actually visible on the map. */
export const BikelanesFilterPills = () => {
  const activeLayers = useActiveBikelanesLayers()
  const widthFilter = useBikelanesWidthFilter()
  const { setWidthFilter } = useBikelanesFilterActions()

  const [widthOperator, setWidthOperator] = useState<BikelanesWidthOperator>('gt')
  const [widthInput, setWidthInput] = useState('')

  if (!activeLayers.length) return null

  const submitWidthFilter = () => {
    const value = Number.parseFloat(widthInput.replace(',', '.'))
    if (Number.isNaN(value) || value < 0) return
    setWidthFilter({ operator: widthOperator, value })
  }

  return (
    <div className="flex max-w-[calc(100vw-18rem)] flex-wrap items-center gap-1.5">
      <BikelanesFuehrungsformFilterPill />
      <BikelanesOberflaecheFilterPill />

      <div className="flex h-8 items-center gap-1.5 rounded-full border border-gray-300 bg-white px-3 shadow-sm">
        <select
          value={widthOperator}
          onChange={(event) => setWidthOperator(event.target.value as BikelanesWidthOperator)}
          className="w-24 shrink-0 bg-transparent text-xs text-gray-700 outline-none"
        >
          {WIDTH_OPERATOR_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <input
          type="number"
          inputMode="decimal"
          step="0.1"
          min="0"
          placeholder="m"
          value={widthInput}
          onChange={(event) => setWidthInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') submitWidthFilter()
          }}
          className="w-14 shrink-0 border-0 bg-transparent p-0 text-xs text-gray-700 outline-none focus:ring-0"
        />
        {widthFilter ? (
          <button
            type="button"
            onClick={() => {
              setWidthFilter(null)
              setWidthInput('')
            }}
            className="shrink-0 px-1 text-xs text-gray-400 hover:text-gray-600"
            aria-label="Breitenfilter zurücksetzen"
          >
            ✕
          </button>
        ) : (
          <button
            type="button"
            onClick={submitWidthFilter}
            className="shrink-0 px-1 text-xs font-medium text-yellow-600 hover:text-yellow-700"
          >
            OK
          </button>
        )}
      </div>
    </div>
  )
}
