import {
  AGE_BAND_COLORS,
  ageBandColorExpression,
  PHOTO_TYPE_COLORS,
  parseIsoDateStartMs,
  photoTypeColorExpression,
  yearsAgoMs,
  type DateRange,
} from '@osm-editor-kit/street-imagery'
import type { DataDrivenPropertyValueSpecification } from 'maplibre-gl'
import { streetImageryDefaultMaxAgeYears, type StreetImageryStyleId } from './streetImageryParam'

type StreetImageryStyle = {
  name: string
  legend: { id: string; name: string; color: string }[]
  /** Colour of the view shapes; zoomed out also of dots and lines. */
  color: DataDrivenPropertyValueSpecification<string>
}

/** Fixed at load, so the layer paint stays the same between renders. */
const LOADED_AT = Date.now()

export const streetImageryStyleNames: Record<StreetImageryStyleId, string> = {
  type: 'Fototyp',
  age: 'Alter',
}

export const getStreetImageryStyle = (
  styleId: StreetImageryStyleId,
  date: DateRange,
): StreetImageryStyle => {
  if (styleId === 'type') {
    return {
      name: streetImageryStyleNames.type,
      legend: [
        { id: 'flat', name: 'Klassische Fotos', color: PHOTO_TYPE_COLORS.flat },
        { id: 'panorama', name: '360° Fotos', color: PHOTO_TYPE_COLORS.panorama },
      ],
      color: photoTypeColorExpression,
    }
  }

  // The colours run from the start of the date filter to today, so they fit any filter.
  const cutoff = date.from
    ? parseIsoDateStartMs(date.from)
    : yearsAgoMs(streetImageryDefaultMaxAgeYears, LOADED_AT)
  return {
    name: streetImageryStyleNames.age,
    legend: [
      { id: 'new', name: 'Neueste', color: AGE_BAND_COLORS.new },
      { id: 'mid', name: 'Mittel', color: AGE_BAND_COLORS.mid },
      { id: 'old', name: 'Ältere', color: AGE_BAND_COLORS.old },
      ...(date.from
        ? []
        : [{ id: 'outdated', name: 'Älter als 2 Jahre', color: AGE_BAND_COLORS.outdated }]),
    ],
    color: ageBandColorExpression(
      cutoff,
      LOADED_AT,
    ) as DataDrivenPropertyValueSpecification<string>,
  }
}
