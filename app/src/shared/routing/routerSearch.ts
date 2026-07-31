import { parseSearchWith, stringifySearchWith } from '@tanstack/react-router'

const parseSearch = parseSearchWith(JSON.parse)
const stringifySearchDefault = stringifySearchWith(JSON.stringify)

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
  stringify: (search: Record<string, unknown>) => makeSearchPretty(stringifySearchDefault(search)),
}
