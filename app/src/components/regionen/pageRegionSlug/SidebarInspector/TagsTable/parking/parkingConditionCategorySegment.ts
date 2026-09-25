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
 * Weekday and English month abbreviations in opening_hours-style fragments are translated in this module; other detail-token German strings come from a dedicated static map.
 */
import { translations } from '../translations/translations.const'
import { splitSemicolonRespectingBrackets } from '../utils/splitSemicolonRespectingBrackets'
import { parkingConditionDetailTokenTranslations } from './parkingConditionDetailTokenTranslations.const'

export function resolveParkingConditionCategoryBase(baseKey: string) {
  return translations[`tilda_parkings--condition_category=${baseKey}`]
}

export function resolveParkingConditionDetailToken(tokenId: string) {
  return parkingConditionDetailTokenTranslations[
    tokenId as keyof typeof parkingConditionDetailTokenTranslations
  ]
}

/** Split full tile value at Lua’s class separator `;` without splitting `;` inside `( … )`. */
export function splitParkingConditionCategoryValue(value: string) {
  return splitSemicolonRespectingBrackets(value)
}

/** Base keys from Lua `classify_parking_conditions` / `condition_category`, longest first for prefix matching. */
const PARKING_CONDITION_CATEGORY_BASE_KEYS_LONGEST_FIRST = [
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
  'invalid',
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

/** `mo` / `MO` → `Mo`; OSM data contains lowercase weekdays such as `mo-Fr` or `mo-sa`. */
function weekdayLabel(abbr: string) {
  return WEEKDAY_LABEL[`${abbr.charAt(0).toUpperCase()}${abbr.charAt(1).toLowerCase()}`]
}

/** Weekday / holiday abbreviations as emitted by opening_hours-style strings in Lua (weekdays match case-insensitively). */
function translateParkingConditionCategoryWeekdays(detail: string) {
  let out = detail.replace(/PH off/g, 'Feiertag ausgenommen')

  out = out.replace(
    /\b(Mo|Tu|We|Th|Fr|Sa|Su)-(Mo|Tu|We|Th|Fr|Sa|Su)\b/gi,
    (_, a: string, b: string) => {
      const la = weekdayLabel(a)
      const lb = weekdayLabel(b)
      if (!la || !lb) {
        return `${a}-${b}`
      }
      return `${la}-${lb}`
    },
  )

  out = out.replace(/\bPH\b/g, 'Feiertag')
  out = out.replace(/\bSH\b/g, 'Ferien')

  out = out.replace(
    /(^|[^A-Za-z0-9_])(Mo|Tu|We|Th|Fr|Sa|Su)(?![A-Za-z0-9_])/gi,
    (match, prefix: string, abbr: string) => {
      const label = weekdayLabel(abbr)
      return label ? `${prefix}${label}` : match
    },
  )

  return out
}

const MONTH_ABBR_TO_DE: Record<string, string> = {
  Jan: 'Jan.',
  Feb: 'Feb.',
  Mar: 'März',
  Apr: 'April',
  May: 'Mai',
  Jun: 'Juni',
  Jul: 'Juli',
  Aug: 'Aug.',
  Sep: 'Sep.',
  Oct: 'Okt.',
  Nov: 'Nov.',
  Dec: 'Dez.',
}

const MONTH_ABBRS_ORDERED = Object.keys(MONTH_ABBR_TO_DE)

/**
 * English month tokens from Lua / opening_hours-style fragments: replace each `Jan` or `Jan.` (etc.)
 * with the canonical German string in `MONTH_ABBR_TO_DE` in one step. Optional `.` is part of the
 * English token so it is not left behind (e.g. `Apr-Sep.: ` → `April-Sep.: `). Month ranges need no
 * special case: `Mar-Oct` becomes `März-Okt.` by replacing each side.
 */
function translateParkingConditionCategoryMonths(detail: string) {
  let out = detail
  for (const abbr of MONTH_ABBRS_ORDERED) {
    const label = MONTH_ABBR_TO_DE[abbr]
    const re = new RegExp(`(^|[^A-Za-z0-9_])${abbr}(\\.?)(?![A-Za-z0-9_])`, 'g')
    out = out.replace(re, `$1${label}`)
  }
  return out
}

/**
 * Ids resolved via `tilda_parkings--parking_condition_detail_token--${id}` (synthetic subcategory, not a tile property).
 * Longer ids first (substring tokens must not steal from longer ones).
 */
const PARKING_CONDITION_DETAIL_TOKEN_IDS_LONGEST_FIRST = [
  'passenger_car',
  'load-unload',
  'car_sharing',
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
  'residents',
  'axleload',
  'delivery',
  'disabled',
  'motorcar',
  'military',
  'forestry',
  'private',
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
  'taxi',
  'none',
  'bus',
  'snow',
  'wet',
  'hgv',
  'psv',
  'off',
  'no',
] as const

function translateParkingConditionCategoryDetailTokens(
  detail: string,
  resolveToken: (tokenId: string) => string | undefined,
) {
  // OSM `restriction:conditional=…; none @ residents` reaches the detail string verbatim: "none @ X" means "except X".
  const exceptLabel = resolveToken('except')
  let out = exceptLabel ? detail.replace(/\bnone @ /g, `${exceptLabel} `) : detail
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

function formatParkingConditionCategoryDetailGroup(
  detail: string,
  resolveToken: (tokenId: string) => string | undefined,
) {
  const afterWeekdays = translateParkingConditionCategoryWeekdays(detail)
  const afterMonths = translateParkingConditionCategoryMonths(afterWeekdays)
  return translateParkingConditionCategoryDetailTokens(afterMonths, resolveToken)
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
