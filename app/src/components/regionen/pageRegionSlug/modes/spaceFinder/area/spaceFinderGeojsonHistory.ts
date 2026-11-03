const DB_NAME = 'tilda-space-finder'
const DB_VERSION = 1
// Same store under the old module name; its upload history is not carried over.
const LEGACY_DB_NAME = 'tilda-planning'
const STORE_NAME = 'geojson_uploads'
const SCOPE_INDEX = 'scope'
const SCOPE_SEPARATOR = '::'

/** Kind of upload; the stored scope additionally carries the region, see `scopeKey`. */
export type GeojsonHistoryKind = 'study_area' | 'user_geojson'

export type GeojsonHistoryEntry = {
  id: number
  scope: string
  fileName: string
  data: unknown
  savedAt: number
}

/**
 * Uploads only make sense in the region they were made for, so the indexed `scope`
 * combines the region slug with the kind of upload.
 */
function scopeKey(regionSlug: string, kind: GeojsonHistoryKind) {
  return `${regionSlug}${SCOPE_SEPARATOR}${kind}`
}

let legacyDbDeleted = false

function openDb() {
  if (!legacyDbDeleted) {
    legacyDbDeleted = true
    indexedDB.deleteDatabase(LEGACY_DB_NAME)
  }
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const store = request.result.createObjectStore(STORE_NAME, {
        keyPath: 'id',
        autoIncrement: true,
      })
      store.createIndex(SCOPE_INDEX, 'scope')
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/** Persists an uploaded GeoJSON (already parsed to its target shape) for later re-selection. */
export async function saveGeojsonHistoryEntry(
  regionSlug: string,
  kind: GeojsonHistoryKind,
  fileName: string,
  data: unknown,
) {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).add({
      scope: scopeKey(regionSlug, kind),
      fileName,
      data,
      savedAt: Date.now(),
    })
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}

/** Lists the uploads of one kind that were made in this region, newest first. */
export async function listGeojsonHistoryEntries(regionSlug: string, kind: GeojsonHistoryKind) {
  const db = await openDb()
  const entries = await new Promise<GeojsonHistoryEntry[]>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const request = tx.objectStore(STORE_NAME).index(SCOPE_INDEX).getAll(scopeKey(regionSlug, kind))
    request.onsuccess = () => resolve(request.result as GeojsonHistoryEntry[])
    request.onerror = () => reject(request.error)
  })
  db.close()
  return entries.sort((a, b) => b.savedAt - a.savedAt)
}

export async function deleteGeojsonHistoryEntry(id: number) {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}
