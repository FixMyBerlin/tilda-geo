const DB_NAME = 'tilda-planning'
const DB_VERSION = 1
const STORE_NAME = 'geojson_uploads'
const SCOPE_INDEX = 'scope'

export type GeojsonHistoryEntry = {
  id: number
  scope: string
  fileName: string
  data: unknown
  savedAt: number
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
        store.createIndex(SCOPE_INDEX, 'scope')
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/** Persists an uploaded GeoJSON (already parsed to its target shape) for later re-selection. */
export async function saveGeojsonHistoryEntry(
  scope: string,
  fileName: string,
  data: unknown,
): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).add({ scope, fileName, data, savedAt: Date.now() })
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}

/** Lists all stored uploads for a scope (e.g. `study_area`, `user_geojson`), newest first. */
export async function listGeojsonHistoryEntries(scope: string): Promise<GeojsonHistoryEntry[]> {
  const db = await openDb()
  const entries = await new Promise<GeojsonHistoryEntry[]>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const request = tx.objectStore(STORE_NAME).index(SCOPE_INDEX).getAll(scope)
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
