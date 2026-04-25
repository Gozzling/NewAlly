export interface PersonalMatchRecord {
  id: string
  createdAt: number
  syncedAt?: number
  syncStatus: 'pending' | 'synced' | 'failed'
  placement: number | null
  units: string[]
  items: string[]
  augments: string[]
  comp: string | null
  duration: number | null
  source: 'gep_match_end'
  raw?: Record<string, unknown>
}

const DB_NAME = 'tft-ally-db'
const DB_VERSION = 1
const STORE_PERSONAL_MATCHES = 'personalMatches'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)

    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_PERSONAL_MATCHES)) {
        const store = db.createObjectStore(STORE_PERSONAL_MATCHES, { keyPath: 'id' })
        store.createIndex('createdAt', 'createdAt', { unique: false })
        store.createIndex('syncStatus', 'syncStatus', { unique: false })
      }
    }

    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('Failed to open IndexedDB'))
  })
}

export async function savePersonalMatch(record: PersonalMatchRecord): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_PERSONAL_MATCHES, 'readwrite')
    tx.objectStore(STORE_PERSONAL_MATCHES).put(record)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('Failed to save personal match'))
  })
  db.close()
}

export async function getPersonalMatches(limit = 50): Promise<PersonalMatchRecord[]> {
  const db = await openDb()
  const rows = await new Promise<PersonalMatchRecord[]>((resolve, reject) => {
    const tx = db.transaction(STORE_PERSONAL_MATCHES, 'readonly')
    const req = tx.objectStore(STORE_PERSONAL_MATCHES).getAll()
    req.onsuccess = () => resolve((req.result as PersonalMatchRecord[]) ?? [])
    req.onerror = () => reject(req.error ?? new Error('Failed to read personal matches'))
  })
  db.close()
  return rows.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit)
}

export async function markPersonalMatchSynced(id: string, ok: boolean): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_PERSONAL_MATCHES, 'readwrite')
    const store = tx.objectStore(STORE_PERSONAL_MATCHES)
    const getReq = store.get(id)

    getReq.onsuccess = () => {
      const row = getReq.result as PersonalMatchRecord | undefined
      if (!row) return
      row.syncStatus = ok ? 'synced' : 'failed'
      if (ok) row.syncedAt = Date.now()
      store.put(row)
    }

    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('Failed to update sync status'))
  })
  db.close()
}
