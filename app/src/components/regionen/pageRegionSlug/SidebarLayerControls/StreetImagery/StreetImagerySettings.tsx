import { isIsoDate } from '@osm-editor-kit/street-imagery'
import {
  PhotoDateRangeFilter,
  StreetImageryLocaleProvider,
} from '@osm-editor-kit/street-imagery-react'
import { useState } from 'react'
import { twMerge } from 'tailwind-merge'
import {
  mapControlButtonGroupSegmentClassName,
  mobileControlButtonClassName,
} from '../../mobile/mobileControlButton.const'
import {
  streetImageryDefaultMaxAgeYears,
  streetImageryStyleIds,
} from '../../streetImagery/streetImageryParam'
import {
  getStreetImageryStyle,
  streetImageryStyleNames,
} from '../../streetImagery/streetImageryStyles'
import { useStreetImageryCapturedAt } from '../../streetImagery/useStreetImageryCapturedAt'
import { useStreetImageryParam } from '../../streetImagery/useStreetImageryParam'

const DATE_INPUTS_ID = 'street-imagery-date-inputs'
const dateInputs = [
  { key: 'from', label: 'Von' },
  { key: 'to', label: 'Bis' },
] as const

const lineCount = (count: number) =>
  count === 1 ? '1 Aufnahmefahrt' : `${count.toLocaleString('de')} Aufnahmefahrten`

/** Colouring and date filter of the photo layers. */
export const StreetImagerySettings = () => {
  const { providers, style, date, setStyle, setDate } = useStreetImageryParam()
  const { capturedAt, counts } = useStreetImageryCapturedAt(providers)
  const [dateInputsOpen, setDateInputsOpen] = useState(false)

  if (providers.length === 0) {
    return (
      <p className="text-xs text-gray-500">
        Stil und Filter gelten für Mapillary und Panoramax. Aktiviere eine der beiden Ebenen.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <div>
        <p className="text-xs text-gray-500">Stil</p>
        {/* One connected toggle, as the buttons above. */}
        <div className="isolate mt-1 flex -space-x-px rounded-md shadow-sm">
          {streetImageryStyleIds.map((id) => (
            <button
              key={id}
              type="button"
              aria-pressed={style === id}
              onClick={() => setStyle(id)}
              className={twMerge(
                mobileControlButtonClassName,
                mapControlButtonGroupSegmentClassName,
                'h-7 flex-1 cursor-pointer text-xs font-medium first:rounded-l-md last:rounded-r-md',
                style === id && 'z-10 bg-yellow-400 text-gray-950 hover:bg-yellow-400',
              )}
            >
              {streetImageryStyleNames[id]}
            </button>
          ))}
        </div>
        <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-700">
          {getStreetImageryStyle(style, date).legend.map((entry) => (
            <li key={entry.id} className="flex items-center gap-1">
              <span
                className="size-2.5 flex-none rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              {entry.name}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <div className="flex items-baseline justify-between gap-2 text-xs">
          <p className="text-gray-500">Filter</p>
          <button
            type="button"
            aria-expanded={dateInputsOpen}
            aria-controls={DATE_INPUTS_ID}
            onClick={() => setDateInputsOpen(!dateInputsOpen)}
            className="cursor-pointer text-gray-700 underline decoration-gray-300 underline-offset-2 hover:text-gray-950"
          >
            nach Datum
          </button>
        </div>
        {/* Zoomed out the marks count track lines, not photos: say so in their tooltips. */}
        <StreetImageryLocaleProvider
          locale="de"
          messages={counts === 'lines' ? { dateFilter: { photoCount: lineCount } } : undefined}
        >
          <PhotoDateRangeFilter
            value={date}
            onChange={setDate}
            capturedAt={capturedAt}
            recommendedMaxAgeYears={streetImageryDefaultMaxAgeYears}
            // The panel is narrow: fewer years give the year lines and their labels room.
            maxYears={5}
            // Exact days are below, one row each, so the full date fits.
            dateInputs="none"
            allDatesAction={false}
          />
        </StreetImageryLocaleProvider>
        {dateInputsOpen && (
          <div id={DATE_INPUTS_ID} className="mt-1.5 space-y-1 text-xs text-gray-500">
            {dateInputs.map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2">
                <span className="w-7 flex-none">{label}</span>
                <input
                  type="date"
                  value={date[key] ?? ''}
                  onChange={(event) => {
                    const day = event.target.value
                    if (day === '') setDate({ ...date, [key]: undefined })
                    else if (isIsoDate(day)) setDate({ ...date, [key]: day })
                  }}
                  className="min-w-0 flex-1 rounded-md border-gray-300 px-2 py-1 text-sm text-gray-900 focus:border-yellow-500 focus:ring-yellow-500"
                />
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
