export interface CachedLocalRecording {
  meetingId: string
  blob: Blob
  objectUrl: string
  fileName: string
  sizeBytes: number
  recordedAt: string
}

const memoryRecordings = new Map<string, CachedLocalRecording>()
const listeners = new Set<() => void>()

function notifyListeners() {
  listeners.forEach((cb) => cb())
}

export function subscribeLocalRecordings(callback: () => void): () => void {
  listeners.add(callback)
  return () => listeners.delete(callback)
}

const DB_NAME = "eduai_recordings_idb"
const DB_VERSION = 1
const STORE_NAME = "meeting_recordings"

function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB not available"))
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "meetingId" })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function saveLocalRecording(meetingId: string, blob: Blob): Promise<CachedLocalRecording> {
  const existing = memoryRecordings.get(meetingId)
  if (existing) {
    try { URL.revokeObjectURL(existing.objectUrl) } catch {}
  }
  const objectUrl = URL.createObjectURL(blob)
  const ext = blob.type.includes("webm") ? "webm" : blob.type.includes("mp4") ? "mp4" : "webm"
  const entry: CachedLocalRecording = {
    meetingId,
    blob,
    objectUrl,
    fileName: `meeting-${meetingId.slice(0, 8)}-${Date.now()}.${ext}`,
    sizeBytes: blob.size,
    recordedAt: new Date().toISOString(),
  }
  memoryRecordings.set(meetingId, entry)
  notifyListeners()

  try {
    const db = await openIDB()
    const tx = db.transaction(STORE_NAME, "readwrite")
    const store = tx.objectStore(STORE_NAME)
    store.put({
      meetingId,
      blob,
      fileName: entry.fileName,
      sizeBytes: entry.sizeBytes,
      recordedAt: entry.recordedAt,
    })
  } catch (err) {
    console.warn("[recording-cache] IndexedDB save failed:", err)
  }

  return entry
}

export function getLocalRecordingSync(meetingId: string): CachedLocalRecording | undefined {
  return memoryRecordings.get(meetingId)
}

export async function getLocalRecordingAsync(meetingId: string): Promise<CachedLocalRecording | undefined> {
  const inMem = memoryRecordings.get(meetingId)
  if (inMem) return inMem

  try {
    const db = await openIDB()
    const tx = db.transaction(STORE_NAME, "readonly")
    const store = tx.objectStore(STORE_NAME)
    const raw = await new Promise<any>((resolve) => {
      const req = store.get(meetingId)
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => resolve(undefined)
    })
    if (raw && raw.blob) {
      const objectUrl = URL.createObjectURL(raw.blob)
      const entry: CachedLocalRecording = {
        meetingId: raw.meetingId,
        blob: raw.blob,
        objectUrl,
        fileName: raw.fileName,
        sizeBytes: raw.sizeBytes,
        recordedAt: raw.recordedAt,
      }
      memoryRecordings.set(meetingId, entry)
      notifyListeners()
      return entry
    }
  } catch (err) {
    console.warn("[recording-cache] IndexedDB read failed:", err)
  }
  return undefined
}

export function clearLocalRecording(meetingId: string): void {
  const existing = memoryRecordings.get(meetingId)
  if (existing) {
    try { URL.revokeObjectURL(existing.objectUrl) } catch {}
    memoryRecordings.delete(meetingId)
  }
  notifyListeners()

  openIDB().then((db) => {
    const tx = db.transaction(STORE_NAME, "readwrite")
    const store = tx.objectStore(STORE_NAME)
    store.delete(meetingId)
  }).catch(() => {})
}

export function localRecordingAsFile(entry: CachedLocalRecording): File {
  return new File([entry.blob], entry.fileName, { type: entry.blob.type || "video/webm" })
}

