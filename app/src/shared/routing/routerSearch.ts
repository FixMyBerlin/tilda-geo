import { parseSearchWith, stringifySearchWith } from '@tanstack/react-router'
import { joinUrlCommaList } from '@/shared/orderedList/commaList'

const parseSearch = parseSearchWith(JSON.parse)
const stringifySearchDefault = stringifySearchWith(JSON.stringify)

const isWirePrimitive = (item: unknown) =>
  typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean'

const REGION_SEARCH_DEFAULTS: Record<string, unknown> = {
  bg: 'default',
  bg3d: false,
}

/** Flatten string/number/boolean arrays to comma lists; drop empty arrays and known defaults. */
const normalizeSearchForStringify = (search: Record<string, unknown>) => {
  const normalized: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(search)) {
    if (value === undefined) continue
    if (key in REGION_SEARCH_DEFAULTS && value === REGION_SEARCH_DEFAULTS[key]) continue
    if (Array.isArray(value)) {
      if (value.length === 0) continue
      if (value.every(isWirePrimitive)) {
        normalized[key] = joinUrlCommaList(value.map(String))
        continue
      }
    }
    normalized[key] = value
  }
  return normalized
}

/** Decode safe query-value characters after default stringify. */
const makeSearchPretty = (searchString: string) =>
  searchString
    .replaceAll('%22', '"')
    .replaceAll('%2C', ',')
    .replaceAll('%27', "'")
    .replaceAll('%28', '(')
    .replaceAll('%29', ')')
    .replaceAll('%3A', ':')
    .replaceAll('%3B', ';')
    .replaceAll('%5B', '[')
    .replaceAll('%5D', ']')
    .replaceAll('%7B', '{')
    .replaceAll('%7D', '}')
    .replaceAll('%2F', '/')

export const routerSearch = {
  parse: parseSearch,
  stringify: (search: Record<string, unknown>) =>
    makeSearchPretty(stringifySearchDefault(normalizeSearchForStringify(search))),
}
