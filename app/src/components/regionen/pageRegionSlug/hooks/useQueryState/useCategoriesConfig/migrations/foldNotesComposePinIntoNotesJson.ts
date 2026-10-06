import { searchParamsRegistry } from '@/shared/regionen/searchParamsRegistry'

const COMPOSE_PIN_KEYS = ['osmNote', 'internalNote', 'atlasNote'] as const

const parseJsonObject = (raw: string) => {
  try {
    const parsed: unknown = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>
    }
  } catch {
    return null
  }
  return null
}

/**
 * Fold sibling compose-pin keys into `notes.new`. First present wins: `osmNote`, then
 * `internalNote`, then `atlasNote`. Always deletes those keys. Merges into existing notes JSON
 * so mixed filter+pin URLs keep both. Non-JSON `notes` (legacy visibility flag) is left alone.
 */
export const foldNotesComposePinIntoNotesJson = (params: URLSearchParams) => {
  let pin: string | undefined
  for (const key of COMPOSE_PIN_KEYS) {
    const value = params.get(key)
    if (value && pin === undefined) pin = value
    params.delete(key)
  }

  if (!pin) return

  const notesKey = searchParamsRegistry.notes
  const existingWire = params.get(notesKey)
  if (existingWire === null || existingWire === '') {
    params.set(notesKey, JSON.stringify({ new: pin }))
    return
  }

  if (!existingWire.trim().startsWith('{')) return

  const existing = parseJsonObject(existingWire)
  if (!existing) return

  existing.new = pin
  params.set(notesKey, JSON.stringify(existing))
}
