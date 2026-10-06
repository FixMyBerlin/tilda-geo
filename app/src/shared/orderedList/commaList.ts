export const parseCommaList = (value: string) =>
  value
    .split(/[\n,]+/)
    .map((part) => part.trim())
    .filter(Boolean)

/** Human-readable lists in forms/admin UI (space after comma). */
export const joinCommaList = (items: string[]) => items.join(', ')

/** Compact lists for URL search params (no spaces), e.g. `data=a,b`. */
export const joinUrlCommaList = (items: string[]) => items.join(',')
