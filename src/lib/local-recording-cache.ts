export interface CachedLocalRecording {
  meetingId: string
  blob: Blob
  objectUrl: string
  fileName: string
  sizeBytes: number
  recordedAt: string
}

const recordings = new Map<string, CachedLocalRecording>()

export function setLocalRecording(meetingId: string, blob: Blob): CachedLocalRecording {
  const existing = recordings.get(meetingId)
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
  recordings.set(meetingId, entry)
  return entry
}

export function getLocalRecording(meetingId: string): CachedLocalRecording | undefined {
  return recordings.get(meetingId)
}

export function clearLocalRecording(meetingId: string): void {
  const existing = recordings.get(meetingId)
  if (existing) {
    try { URL.revokeObjectURL(existing.objectUrl) } catch {}
    recordings.delete(meetingId)
  }
}

export function localRecordingAsFile(entry: CachedLocalRecording): File {
  return new File([entry.blob], entry.fileName, { type: entry.blob.type })
}
