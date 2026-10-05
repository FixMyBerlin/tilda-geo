import { isIsoDate, type DateRange } from '@osm-editor-kit/street-imagery'
import { format, subYears } from 'date-fns'
import { z } from 'zod'

/** Providers that show photos on the map. Their adapters are registered in `streetImageryConfig.ts`. */
export const streetImageryProviderIds = ['mapillary', 'panoramax'] as const
export type StreetImageryProviderId = (typeof streetImageryProviderIds)[number]

export const streetImageryStyleIds = ['type', 'age'] as const
export type StreetImageryStyleId = (typeof streetImageryStyleIds)[number]
export const defaultStreetImageryStyle: StreetImageryStyleId = 'type'

/** Photos older than this are hidden until the user moves the date slider. */
export const streetImageryDefaultMaxAgeYears = 2

const isoDate = z.string().refine(isIsoDate)

/** `?photos=` — street imagery on the map. Absent: off. */
export const zodStreetImageryParam = z.object({
  providers: z.array(z.enum(streetImageryProviderIds)).default([]),
  style: z.enum(streetImageryStyleIds).optional(),
  /** Absent: the default (last 2 years). `{}`: all dates. */
  date: z.object({ from: isoDate.optional(), to: isoDate.optional() }).optional(),
  /** The photo in the viewer. */
  photo: z
    .object({
      provider: z.enum(streetImageryProviderIds),
      id: z.string(),
      sequence: z.string().optional(),
    })
    .optional(),
})

export type StreetImageryParam = z.infer<typeof zodStreetImageryParam>

export const defaultStreetImageryParam: StreetImageryParam = { providers: [] }

/** Keeps defaults out of the URL; `undefined` removes the param. */
export const compactStreetImageryParam = (value: StreetImageryParam) => {
  if (value.providers.length === 0 && !value.photo) return undefined
  return {
    providers: value.providers,
    style: value.style === defaultStreetImageryStyle ? undefined : value.style,
    date: value.date,
    photo: value.photo,
  } satisfies StreetImageryParam
}

export const defaultStreetImageryDate = (): DateRange => ({
  from: format(subYears(new Date(), streetImageryDefaultMaxAgeYears), 'yyyy-MM-dd'),
})
