/**
 * Helpers for parking `condition_category` as emitted by Lua `classify_parking_conditions`
 * (`processing/topics/parking/helper/classify_parking_conditions.lua`).
 *
 * - **Between** restriction classes Lua uses `;` only (`SEPARATOR`, final `table.concat(condition_class, ';')`).
 * - **Inside** one `base ( … )` wrapper, list-like pieces come from `table.concat(..., ", ")` — commas, not semicolons, as the Lua joiner.
 * - A single OSM condition fragment inside one pair of parens may still contain `;` between opening_hours-style windows; we never split on that — we translate the detail string as one unit.
 *
 * Use `splitParkingConditionCategoryValue` for the top-level `;` split only (parenthesis-aware, one nesting level).
 *
 * Detail-token copy uses `tilda_parkings--parking_condition_detail_token--<id>` (`--` subcategory: derived in the inspector, not a tile property).
 */
import { translations } from '../translations/translations.const'
import { splitSemicolonRespectingBrackets } from '../utils/splitSemicolonRespectingBrackets'

export function resolveParkingConditionCategoryBase(baseKey: string) {
  return translations[`tilda_parkings--condition_category=${baseKey}`]
}

export function resolveParkingConditionDetailToken(tokenId: string) {
  return translations[`tilda_parkings--parking_condition_detail_token--${tokenId}`]
}

/** Split full tile value at Lua’s class separator `;` without splitting `;` inside `( … )`. */
export function splitParkingConditionCategoryValue(value: string) {
  return splitSemicolonRespectingBrackets(value)
}

/** Base keys from Lua `classify_parking_conditions` / `condition_category`, longest first for prefix matching. */
export const PARKING_CONDITION_CATEGORY_BASE_KEYS_LONGEST_FIRST = [
  'vehicle_restriction',
  'access_restriction',
  'disabled_private',
  'assumed_private',
  'assumed_free',
  'time_limited',
  'car_sharing',
  'no_stopping',
  'no_standing',
  'unspecified',
  'no_parking',
  'maxweight',
  'residents',
  'bus_lane',
  'charging',
  'disabled',
  'private',
  'loading',
  'mixed',
  'paid',
  'taxi',
  'free',
] as const

type ParseOk = {
  base: string
  detailGroups: string[]
  raw: string
}

type ParseFallback = {
  base: null
  detailGroups: []
  raw: string
}

export type ParseParkingConditionCategorySegmentResult = ParseOk | ParseFallback

export function parseParkingConditionCategorySegment(
  segment: string,
): ParseParkingConditionCategorySegmentResult {
  const s = segment.trim()
  if (!s) {
    return { base: null, detailGroups: [], raw: segment }
  }

  for (const base of PARKING_CONDITION_CATEGORY_BASE_KEYS_LONGEST_FIRST) {
    if (s === base) {
      return { base, detailGroups: [], raw: segment }
    }
    if (!s.startsWith(`${base} (`)) {
      continue
    }

    let rest = s.slice(base.length).trimStart()
    const detailGroups: string[] = []

    while (rest.length > 0) {
      if (!rest.startsWith('(')) {
        return { base: null, detailGroups: [], raw: segment }
      }
      const m = rest.match(/^\(([^)]*)\)/)
      if (!m?.[1]) {
        return { base: null, detailGroups: [], raw: segment }
      }
      detailGroups.push(m[1])
      rest = rest.slice(m[0].length).trimStart()
    }

    return { base, detailGroups, raw: segment }
  }

  return { base: null, detailGroups: [], raw: s }
}

const WEEKDAY_LABEL: Record<string, string> = {
  Mo: 'Montag',
  Tu: 'Dienstag',
  We: 'Mittwoch',
  Th: 'Donnerstag',
  Fr: 'Freitag',
  Sa: 'Samstag',
  Su: 'Sonntag',
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Weekday / holiday abbreviations as emitted by opening_hours-style strings in Lua. */
export function translateParkingConditionCategoryWeekdays(detail: string) {
  let out = detail.replace(/PH off/g, 'Feiertag ausgenommen')

  out = out.replace(
    /\b(Mo|Tu|We|Th|Fr|Sa|Su)-(Mo|Tu|We|Th|Fr|Sa|Su)\b/g,
    (_, a: string, b: string) => {
      const la = WEEKDAY_LABEL[a]
      const lb = WEEKDAY_LABEL[b]
      if (!la || !lb) {
        return `${a}-${b}`
      }
      return `${la}-${lb}`
    },
  )

  out = out.replace(/\bPH\b/g, 'Feiertag')
  out = out.replace(/\bSH\b/g, 'Ferien')

  for (const abbr of ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] as const) {
    const label = WEEKDAY_LABEL[abbr]
    const re = new RegExp(`(^|[^A-Za-z0-9_])${abbr}(?![A-Za-z0-9_])`, 'g')
    out = out.replace(re, `$1${label}`)
  }

  return out
}

/**
 * Ids resolved via `tilda_parkings--parking_condition_detail_token--${id}` (synthetic subcategory, not a tile property).
 * Longer ids first (substring tokens must not steal from longer ones).
 */
export const PARKING_CONDITION_DETAIL_TOKEN_IDS_LONGEST_FIRST = [
  'passenger_car',
  'load-unload',
  'agricultural',
  'discouraged',
  'destination',
  'designated',
  'permissive',
  'motorcycle',
  'motorhome',
  'emergency',
  'employees',
  'customers',
  'axleload',
  'delivery',
  'motorcar',
  'military',
  'forestry',
  'minutes',
  'minute',
  'hazmat',
  'nights',
  'hours',
  'weeks',
  'night',
  'height',
  'weight',
  'width',
  'length',
  'sunrise',
  'sunset',
  'summer',
  'spring',
  'winter',
  'autumn',
  'wheels',
  'except',
  'only',
  'stay',
  'permit',
  'yes',
  'hour',
  'week',
  'days',
  'day',
  'bus',
  'snow',
  'wet',
  'hgv',
  'psv',
  'off',
  'no',
] as const

export function translateParkingConditionCategoryDetailTokens(
  detail: string,
  resolveToken: (tokenId: string) => string | undefined,
) {
  let out = detail
  for (const tokenId of PARKING_CONDITION_DETAIL_TOKEN_IDS_LONGEST_FIRST) {
    const repl = resolveToken(tokenId)
    if (!repl) {
      continue
    }
    const re = new RegExp(`(^|[^A-Za-z0-9_-])${escapeRegExp(tokenId)}(?![A-Za-z0-9_-])`, 'g')
    out = out.replace(re, `$1${repl}`)
  }
  return out
}

export function formatParkingConditionCategoryDetailGroup(
  detail: string,
  resolveToken: (tokenId: string) => string | undefined,
) {
  const afterWeekdays = translateParkingConditionCategoryWeekdays(detail)
  return translateParkingConditionCategoryDetailTokens(afterWeekdays, resolveToken)
}

export function formatParkingConditionCategorySegment(
  segment: string,
  resolveBase: (baseKey: string) => string | undefined,
  resolveToken: (tokenId: string) => string | undefined,
) {
  const parsed = parseParkingConditionCategorySegment(segment)
  if (!parsed.base) {
    return parsed.raw
  }
  const baseLabel = resolveBase(parsed.base) ?? parsed.base
  const suffix = parsed.detailGroups
    .map((g) => ` (${formatParkingConditionCategoryDetailGroup(g, resolveToken)})`)
    .join('')
  return baseLabel + suffix
}
