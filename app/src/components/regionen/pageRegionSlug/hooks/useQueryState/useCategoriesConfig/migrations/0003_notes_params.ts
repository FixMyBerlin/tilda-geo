import type { UrlMigration } from './types'

/** Known QA config slugs. `slug--style` bookmarks for these become `{ key }` with the same slug. */
const QA_KNOWN_SLUGS = new Set([
  'euvm-parkraum-2025',
  'euvm-parkraum-2025-aussen',
  'euvm-parkraum-2026',
  'euvm-parkraum-2026-aussen',
])

/**
 * Old `slug--style` second half → new `qa.status`. `undefined` means omit the field
 * (`all`, `user-selected`). Missing keys (including `none`) drop the whole param.
 */
const QA_STATUS_MAP = {
  all: undefined,
  'user-selected': undefined,
  'user-pending': 'pending-problematic',
  'user-pending-needs-review': 'pending-needs-review',
  'user-pending-problematic': 'pending-problematic',
  'user-not-ok-processing': 'not-ok-processing',
  'user-not-ok-osm': 'not-ok-osm',
  'user-ok-construction': 'ok-construction',
  'user-ok-reference-error': 'ok-reference-error',
  'user-ok-qa-tooling-error': 'ok-qa-tooling-error',
} as const satisfies Record<string, string | undefined>

type LegacyNotesFilter = {
  query?: string | null
  completed?: boolean | null
  user?: string | null
  commented?: boolean | null
  notReacted?: boolean | null
}

const parseJsonObject = (raw: string | null) => {
  if (!raw) return null
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

const flattenNotesFilter = (raw: Record<string, unknown> | null) => {
  if (!raw) return {}
  const filter = raw as LegacyNotesFilter
  const next: Record<string, unknown> = {}
  if (typeof filter.query === 'string' && filter.query) next.search = filter.query
  if (typeof filter.completed === 'boolean') next.completed = filter.completed
  if (typeof filter.commented === 'boolean') next.commented = filter.commented
  if (typeof filter.notReacted === 'boolean') next.notReacted = filter.notReacted
  if (typeof filter.user === 'string' && filter.user) next.user = filter.user
  return next
}

/**
 * JSON `qa` with a string `key` is kept (any slug) and leftover `qaFilter.users` is merged.
 * Legacy `slug--style` values for known slugs become `{ key }` (plus mapped status/users).
 * Unknown `slug--style` slug or status drops `qa`.
 */
const migrateQaParam = (params: URLSearchParams) => {
  const raw = params.get('qa')
  const qaFilter = parseJsonObject(params.get('qaFilter'))
  params.delete('qaFilter')

  if (raw === null || raw === '') {
    params.delete('qa')
    return
  }

  if (raw.trim().startsWith('{')) {
    const existing = parseJsonObject(raw)
    if (existing && typeof existing.key === 'string') {
      const users = qaFilter?.users
      if (Array.isArray(users) && users.length > 0 && !existing.users) {
        existing.users = users.map(String)
      }
      params.set('qa', JSON.stringify(existing))
      return
    }
    params.delete('qa')
    return
  }

  const separatorIndex = raw.lastIndexOf('--')
  if (separatorIndex <= 0) {
    params.delete('qa')
    return
  }

  const slug = raw.slice(0, separatorIndex)
  const style = raw.slice(separatorIndex + 2)
  if (!QA_KNOWN_SLUGS.has(slug) || !(style in QA_STATUS_MAP)) {
    params.delete('qa')
    return
  }

  const qa: Record<string, unknown> = { key: slug }
  const status = QA_STATUS_MAP[style as keyof typeof QA_STATUS_MAP]
  if (status) qa.status = status

  const users = qaFilter?.users
  if (Array.isArray(users) && users.length > 0) {
    qa.users = users.map(String)
  }

  params.set('qa', JSON.stringify(qa))
}

/**
 * MIGRATION: Notes + QA URL params (v3).
 * - `atlasNote` → `internalNote`. Visibility keys `osmNotes` / `notes` stay for the path redirect.
 * - `notes` → `internalNotes` (legacy TILDA visibility flag; stripped after redirect).
 * - `osmNotesFilter` / `atlasNotesFilter` → flat `notesMode` JSON. Old filter keys deleted.
 * - JSON `qa` with a string `key` is kept (unknown slugs included); leftover `qaFilter.users` is merged.
 * - `qa` `slug--style` plus `qaFilter.users` → one `qa` object (same slug). Unknown slug/status drops `qa`.
 * Does not change the pathname.
 */
const migration: UrlMigration = (initialUrl) => {
  const url = new URL(initialUrl)
  const params = url.searchParams

  const rename = (oldKey: string, newKey: string) => {
    if (!params.has(oldKey)) return
    const value = params.get(oldKey)
    if (value !== null && !params.has(newKey)) params.set(newKey, value)
    params.delete(oldKey)
  }

  rename('notes', 'internalNotes')
  rename('atlasNote', 'internalNote')

  const osmFilter = parseJsonObject(params.get('osmNotesFilter'))
  const atlasFilter = parseJsonObject(params.get('atlasNotesFilter'))
  params.delete('osmNotesFilter')
  params.delete('atlasNotesFilter')

  const notesMode = {
    ...flattenNotesFilter(osmFilter),
    ...flattenNotesFilter(atlasFilter),
  }
  if (Object.keys(notesMode).length > 0 && !params.has('notesMode')) {
    params.set('notesMode', JSON.stringify(notesMode))
  }

  migrateQaParam(params)

  return url.toString()
}

export default migration
