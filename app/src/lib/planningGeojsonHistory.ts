const DB_NAME = 'tilda-planning'
const DB_VERSION = 2
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

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = (event) => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
        store.createIndex(SCOPE_INDEX, 'scope')
        return
      }
      if (event.oldVersion < 2) {
        // Entries from before uploads were scoped per region cannot be attributed to
        // one anymore, so they would stay invisible – and therefore undeletable – in
        // every region. Drop them instead of leaving them behind in the quota.
        const store = request.transaction?.objectStore(STORE_NAME)
        const cursorRequest = store?.openCursor()
        if (!cursorRequest) return
        cursorRequest.onsuccess = () => {
          const cursor = cursorRequest.result
          if (!cursor) return
          const entry = cursor.value as GeojsonHistoryEntry
          if (!entry.scope.includes(SCOPE_SEPARATOR)) cursor.delete()
          cursor.continue()
        }
      }
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
): Promise<void> {
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
export async function listGeojsonHistoryEntries(
  regionSlug: string,
  kind: GeojsonHistoryKind,
): Promise<GeojsonHistoryEntry[]> {
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

export async function deleteGeojsonHistoryEntry(id: number): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}
