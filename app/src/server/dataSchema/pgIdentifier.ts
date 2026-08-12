import { createHash } from 'node:crypto'

const PG_IDENT_MAX_BYTES = 63

/**
 * Aside name that stays ≤ 63 bytes and stays unique when two long names share a truncated prefix.
 * Format: `{truncatedBase}_{8-hex}{suffix}` e.g. `census_pop…_a1b2c3d4__old`.
 */
export function asidePgIdentifier(original: string, suffix: string) {
  // Postgres identifiers are capped at 63 bytes; a short hash keeps truncated names unique.
  const hash = createHash('sha256').update(original).digest('hex').slice(0, 8)
  const fixedTail = `_${hash}${suffix}`
  const fixedBytes = new TextEncoder().encode(fixedTail).byteLength
  if (fixedBytes >= PG_IDENT_MAX_BYTES) {
    throw new Error(`Aside suffix "${fixedTail}" alone exceeds Postgres 63-byte identifier limit`)
  }
  const truncated = truncateUtf8Bytes(original, PG_IDENT_MAX_BYTES - fixedBytes)
  return `${truncated}${fixedTail}`
}

export type AsideRenameMapping = {
  table: { from: string; to: string }
  indexes: Array<{ from: string; to: string }>
  constraints: Array<{ from: string; to: string }>
  /** Sequences owned by the table (SERIAL/IDENTITY); Postgres does not rename these with the table. */
  sequences: Array<{ from: string; to: string }>
}

function truncateUtf8Bytes(value: string, maxBytes: number) {
  const encoder = new TextEncoder()
  if (encoder.encode(value).byteLength <= maxBytes) return value
  let end = value.length
  while (end > 0 && encoder.encode(value.slice(0, end)).byteLength > maxBytes) {
    end -= 1
  }
  return value.slice(0, end)
}
