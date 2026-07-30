import { z } from 'zod'

const emptyish = z.union([z.null(), z.undefined(), z.literal('')])

const booleanWire = z.union([
  z.boolean(),
  z.enum(['true', 'false']),
  z.literal(1),
  z.literal(0),
  emptyish,
])

/** Optional query string; coerces numbers, maps null/empty to undefined. */
export const optionalSearchString = () =>
  z
    .union([emptyish, z.coerce.string()])
    .transform((s) => (s === undefined || s === null || s === '' ? undefined : String(s)))
    .optional()

/** Boolean flag from URL search (handles wire strings, JSON booleans, 0/1). */
export const searchBoolean = (fallback = false) =>
  booleanWire
    .transform((v) => {
      if (v === undefined || v === null || v === '') return fallback
      if (typeof v === 'boolean') return v
      if (v === 'true' || v === 1) return true
      if (v === 'false' || v === 0) return false
      return fallback
    })
    .catch(fallback)

/** Optional boolean flag; absent/empty stays undefined. */
export const optionalSearchBoolean = () =>
  booleanWire
    .transform((v) => {
      if (v === undefined || v === null || v === '') return undefined
      if (typeof v === 'boolean') return v
      if (v === 'true' || v === 1) return true
      if (v === 'false' || v === 0) return false
      return undefined
    })
    .optional()

const numberWire = z.union([z.number(), z.coerce.number(), emptyish])

/** Numeric flag from URL search; absent/empty/invalid falls back to `fallback`. */
export const searchNumber = (fallback: number) =>
  numberWire
    .transform((v) => (v === undefined || v === null || v === '' || Number.isNaN(v) ? fallback : v))
    .catch(fallback)

/** Optional numeric flag; absent/empty/invalid stays undefined. */
export const optionalSearchNumber = () =>
  numberWire
    .transform((v) =>
      v === undefined || v === null || v === '' || Number.isNaN(v) ? undefined : v,
    )
    .optional()
    .catch(undefined)

/** String list from comma-separated wire, JSON array string, or native array. */
export const searchStringArray = () =>
  z
    .union([z.array(z.coerce.string()), z.string(), emptyish])
    .transform((raw) => {
      if (raw === undefined || raw === null || raw === '') return []
      if (Array.isArray(raw)) return raw.map(String)
      if (raw.startsWith('[')) {
        try {
          const parsed = JSON.parse(raw) as unknown
          return Array.isArray(parsed) ? parsed.map(String) : [raw]
        } catch {
          return raw.split(',').filter(Boolean)
        }
      }
      return raw.includes(',') ? raw.split(',').filter(Boolean) : [raw]
    })
    .catch([])

/** JSON object from wire string or router-parsed object. */
export const optionalSearchJson = <T extends z.ZodType>(schema: T) =>
  z
    .union([schema, z.string(), z.record(z.string(), z.unknown()), emptyish])
    .transform((raw): z.infer<T> | undefined => {
      if (raw === undefined || raw === null || raw === '') return undefined
      if (typeof raw === 'object' && !Array.isArray(raw)) {
        const parsed = schema.safeParse(raw)
        return parsed.success ? parsed.data : undefined
      }
      if (typeof raw === 'string') {
        try {
          const parsed = schema.safeParse(JSON.parse(raw))
          return parsed.success ? parsed.data : undefined
        } catch {
          return undefined
        }
      }
      return undefined
    })
    .optional()
