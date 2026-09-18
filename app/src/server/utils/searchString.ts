/** Trim; empty/whitespace becomes undefined so optional filters stay off. */
export function optionalTrimmed(value?: string) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

/** Whitespace-separated search terms; blank input yields no terms. */
export function searchTerms(q?: string) {
  return optionalTrimmed(q)?.split(/\s+/) ?? []
}
