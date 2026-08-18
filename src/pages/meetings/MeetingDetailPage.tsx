import { useEffect, useRef, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/EmptyState"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LoadingState } from "@/components/shared/LoadingState"
import { ErrorState } from "@/components/shared/ErrorState"
import { useAuth } from "@/providers/use-auth"
import { useMeeting, useUploadMeetingRecording } from "@/hooks/use-meetings"
import { MeetingStatusBadge, TranscriptStatusBadge } from "@/components/meetings/MeetingStatusBadge"
import { TranscriptPanel } from "@/components/meetings/TranscriptPanel"
import { StruggleSignalsPanel } from "@/components/meetings/StruggleSignalsPanel"
import { cn } from "@/lib/utils"
import * as api from "@/lib/api"
import {
  getLocalRecordingAsync,
  getLocalRecordingSync,
  subscribeLocalRecordings,
  clearLocalRecording,
  localRecordingAsFile,
  type CachedLocalRecording,
} from "@/lib/local-recording-cache"
import type { MeetingDetail } from "@/lib/api"

function formatDate(iso: string): string {
 return new Date(iso).toLocaleString(undefined, {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
 })
}

function MetaRow({ icon, label, value }: { icon: string; label: string; value: React.ReactNode }) {
 return (
  <div className="flex items-center gap-3">
   <span className="material-symbols-outlined text-[20px] text-on-surface-variant shrink-0">{icon}</span>
   <span className="font-label-md text-label-md text-on-surface-variant w-32 shrink-0">{label}</span>
   <span className="font-body-md text-body-md text-on-surface min-w-0 break-words">{value}</span>
  </div>
 )
}

function RecordingTab({ meeting }: { meeting: MeetingDetail }) {
  const { id } = useParams<{ id: string }>()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadRecording = useUploadMeetingRecording()

  const [cached, setCached] = useState<CachedLocalRecording | undefined>(undefined)
  const [pickedFile, setPickedFile] = useState<File | undefined>(undefined)
  const [pickedPreviewUrl, setPickedPreviewUrl] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (!id) return
    let active = true
    const check = async () => {
      const syncRec = getLocalRecordingSync(id)
      if (syncRec && active) {
        setCached(syncRec)
        return
      }
      const asyncRec = await getLocalRecordingAsync(id)
      if (active && asyncRec) {
        setCached(asyncRec)
      }
    }
    void check()
    const unsubscribe = subscribeLocalRecordings(() => {
      void check()
    })
    return () => {
      active = false
      unsubscribe()
    }
  }, [id])

  useEffect(() => {
    return () => {
      if (pickedPreviewUrl) {
        try { URL.revokeObjectURL(pickedPreviewUrl) } catch {}
      }
    }
  }, [pickedPreviewUrl])

  const recording = useQuery({
    queryKey: ["meetings", id, "recording"],
    queryFn: () => api.getMeetingRecording(id as string),
    enabled: !!id && !!meeting.recordingUrl,
    staleTime: 5 * 60 * 1000,
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !id) return
    if (pickedPreviewUrl) {
      try { URL.revokeObjectURL(pickedPreviewUrl) } catch {}
    }
    const url = URL.createObjectURL(file)
    setPickedFile(file)
    setPickedPreviewUrl(url)
  }

  const handleUploadCached = async () => {
    if (!id || !cached) return
    const file = localRecordingAsFile(cached)
    uploadRecording.mutate({ id, file }, {
      onSuccess: () => {
        toast.success("Recording uploaded to storage")
        clearLocalRecording(id)
        setCached(undefined)
      },
      onError: (err: any) => {
        toast.error(`Upload failed: ${err?.message ?? "Unknown error"}`)
      },
    })
  }

  const handleUploadPicked = async () => {
    if (!id || !pickedFile) return
    uploadRecording.mutate({ id, file: pickedFile }, {
      onSuccess: () => {
        toast.success("Recording uploaded to storage")
        if (pickedPreviewUrl) {
          try { URL.revokeObjectURL(pickedPreviewUrl) } catch {}
        }
        setPickedFile(undefined)
        setPickedPreviewUrl(undefined)
      },
      onError: (err: any) => {
        toast.error(`Upload failed: ${err?.message ?? "Unknown error"}`)
      },
    })
  }

  const handleDiscardCached = () => {
    if (!id) return
    clearLocalRecording(id)
    setCached(undefined)
    toast.info("Local recording discarded")
  }

  const handleDiscardPicked = () => {
    if (pickedPreviewUrl) {
      try { URL.revokeObjectURL(pickedPreviewUrl) } catch {}
    }
    setPickedFile(undefined)
    setPickedPreviewUrl(undefined)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleDownloadLocal = () => {
    if (!cached) return
    const file = localRecordingAsFile(cached)
    const url = URL.createObjectURL(file)
    const a = document.createElement("a")
    a.href = url
    a.download = cached.fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const handleDownloadCloud = async () => {
    if (!recording.data?.recordingUrl) return
    try {
      const res = await fetch(recording.data.recordingUrl)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const ext = blob.type.includes("mp4") ? "mp4" : "webm"
      a.download = `meeting-recording-${id?.slice(0, 8)}.${ext}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch {
      window.open(recording.data.recordingUrl, "_blank")
    }
  }

  const hasLocalPreview = (!!cached || !!pickedPreviewUrl)
  const localPreviewSrc = cached ? cached.objectUrl : pickedPreviewUrl

  if (meeting.status !== "ENDED") {
    return (
      <EmptyState
        icon="fiber_manual_record"
        title="Recording in progress"
        description="The recording will be available here after the meeting ends."
      />
    )
  }

  if (!meeting.recordingUrl && hasLocalPreview) {
    return (
      <div className="space-y-md">
        <div className="rounded-xl overflow-hidden bg-black shadow-lg">
          <video
            src={localPreviewSrc}
            controls
            className="w-full max-h-[420px] aspect-video object-contain"
          />
        </div>
        <div className="space-y-2">
          {cached && (
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px] mr-1 align-middle">save</span>
              Locally recorded file: <strong>{cached.fileName}</strong>{" "}
              ({(cached.sizeBytes / 1024 / 1024).toFixed(1)} MB) · recorded{" "}
              {new Date(cached.recordedAt).toLocaleString()}
            </p>
          )}
          {pickedFile && (
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px] mr-1 align-middle">description</span>
              Picked file: <strong>{pickedFile.name}</strong>{" "}
              ({(pickedFile.size / 1024 / 1024).toFixed(1)} MB)
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2 justify-between items-center">
          <div className="flex gap-2 flex-wrap">
            <Button
              disabled={uploadRecording.isPending}
              onClick={cached ? handleUploadCached : handleUploadPicked}
            >
              <span className="material-symbols-outlined text-[18px] mr-1.5">cloud_upload</span>
              {uploadRecording.isPending ? "Uploading to cloud..." : "Upload Recording to Cloud"}
            </Button>
            {cached && (
              <Button variant="outline" size="sm" onClick={handleDownloadLocal}>
                <span className="material-symbols-outlined text-[18px] mr-1.5">download</span>
                Download Copy
              </Button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/webm"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              disabled={uploadRecording.isPending}
              onClick={() => fileInputRef.current?.click()}
            >
              <span className="material-symbols-outlined text-[18px] mr-1.5">folder_open</span>
              Pick Different File
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            disabled={uploadRecording.isPending}
            onClick={cached ? handleDiscardCached : handleDiscardPicked}
          >
            <span className="material-symbols-outlined text-[18px] mr-1">close</span>
            Discard
          </Button>
        </div>
      </div>
    )
  }

  if (!meeting.recordingUrl) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-border rounded-xl text-center space-y-4">
        <span className="material-symbols-outlined text-[48px] text-on-surface-variant">videocam_off</span>
        <div>
          <h3 className="font-label-lg text-label-lg text-on-surface mb-1">No recording video file available</h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant max-w-md">
            Pick a recorded video file (MP4 or WebM). You will see a preview before uploading it to storage.
          </p>
        </div>
        {(meeting.isHost || true) && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/webm"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              disabled={uploadRecording.isPending}
              onClick={() => fileInputRef.current?.click()}
            >
              <span className="material-symbols-outlined text-[18px] mr-1.5">video_library</span>
              Pick Recording Video
            </Button>
          </div>
        )}
      </div>
    )
  }

  if (recording.isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoadingState className="h-8" />
      </div>
    )
  }

  if (recording.isError || !recording.data?.recordingUrl) {
    return (
      <EmptyState
        icon="videocam"
        title="Recording not ready yet"
        description="The recording file isn't reachable yet — it may still be processing. Try again in a minute."
      />
    )
  }

  return (
    <div className="space-y-md">
      <div className="rounded-xl overflow-hidden bg-black shadow-lg">
        <video
          src={recording.data.recordingUrl}
          controls
          className="w-full max-h-[420px] aspect-video object-contain"
        />
      </div>
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div className="flex gap-2 flex-wrap">
          {hasLocalPreview && (
            <Button
              size="sm"
              variant="secondary"
              disabled={uploadRecording.isPending}
              onClick={cached ? handleUploadCached : handleUploadPicked}
            >
              <span className="material-symbols-outlined text-[18px] mr-1">upgrade</span>
              Replace with Local ({cached ? (cached.sizeBytes/1024/1024).toFixed(1)+" MB" : pickedFile ? (pickedFile.size/1024/1024).toFixed(1)+" MB" : "file"})
            </Button>
          )}
          {meeting.isHost && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/webm"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                disabled={uploadRecording.isPending}
                onClick={() => fileInputRef.current?.click()}
              >
                <span className="material-symbols-outlined text-[18px] mr-1.5">upload</span>
                {uploadRecording.isPending ? "Replacing..." : "Replace Video"}
              </Button>
            </div>
          )}
        </div>
        <Button variant="outline" onClick={handleDownloadCloud}>
          <span className="material-symbols-outlined text-[18px] mr-1">download</span>
          Download recording
        </Button>
      </div>
    </div>
  )
}

function AttendanceTab({ meeting }: { meeting: MeetingDetail }) {
  const map = new Map<string, { name: string; joinedAt?: string | null; leftAt?: string | null }>()

  meeting.participants.forEach((p) => {
    map.set(p.userId, { name: p.name, joinedAt: null, leftAt: null })
  })

  meeting.attendance.forEach((a) => {
    map.set(a.userId, {
      name: a.name || map.get(a.userId)?.name || "Participant",
      joinedAt: a.joinedAt,
      leftAt: a.leftAt,
    })
  })

  const rows = Array.from(map.entries()).map(([userId, data]) => ({ userId, ...data }))

  if (rows.length === 0) {
    return (
      <EmptyState
        icon="groups"
        title="No attendance records"
        description="Attendance records will appear once participants join the meeting."
      />
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-border">
            <th className="py-2.5 pr-4 font-label-sm text-label-sm text-on-surface-variant">Participant</th>
            <th className="py-2.5 pr-4 font-label-sm text-label-sm text-on-surface-variant">Joined at</th>
            <th className="py-2.5 pr-4 font-label-sm text-label-sm text-on-surface-variant">Left at</th>
            <th className="py-2.5 font-label-sm text-label-sm text-on-surface-variant">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.userId} className="border-b border-border/60 last:border-0">
              <td className="py-3 pr-4 font-body-md text-body-md text-on-surface font-medium">{row.name}</td>
              <td className="py-3 pr-4 font-body-md text-body-md text-on-surface-variant tabular-nums">
                {row.joinedAt ? formatTime(row.joinedAt) : "—"}
              </td>
              <td className="py-3 pr-4 font-body-md text-body-md text-on-surface-variant tabular-nums">
                {row.leftAt ? formatTime(row.leftAt) : row.joinedAt ? "Present" : "—"}
              </td>
              <td className="py-3 font-body-md text-body-md">
                <span
                  className={cn(
                    "px-2.5 py-0.5 rounded-full text-xs font-semibold",
                    row.leftAt
                      ? "bg-surface-variant text-on-surface-variant"
                      : row.joinedAt
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700",
                  )}
                >
                  {row.leftAt ? "Attended" : row.joinedAt ? "Active" : "Not joined"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function formatTime(iso: string): string {
 return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
}

export function MeetingDetailPage() {
 const { id } = useParams<{ id: string }>()
 const { user } = useAuth()
 const { data: meeting, isLoading, isError, error, refetch } = useMeeting(id)
 const [tab, setTab] = useState<"recording" | "transcript" | "attendance" | "followup">(
  "recording",
 )

 const isTeacher = user?.role === "TEACHER" || user?.role === "ADMIN"
 const basePath = isTeacher ? "/meetings" : "/student/meetings"

 if (isLoading) return <LoadingState className="flex-1" />
 if (isError) {
  return (
   <ErrorState
    title="Failed to load meeting"
    message={error?.message ?? "Something went wrong"}
    onRetry={() => refetch()}
    className="flex-1"
   />
  )
 }
 if (!meeting) return null

 const canJoin = meeting.canJoin && (meeting.status === "SCHEDULED" || meeting.status === "LIVE")

 return (
  <div className="p-xl max-w-3xl mx-auto w-full">
   <Link to={basePath} className="font-label-md text-label-md text-primary hover:underline inline-flex items-center gap-1 mb-lg">
    <span className="material-symbols-outlined text-[18px]">arrow_back</span>
    Back to meetings
   </Link>

   <Card className="border-border mb-lg">
    <CardContent className="p-lg space-y-4">
     <div className="flex items-center justify-between gap-4">
      <h1 className="font-headline-lg text-headline-lg text-primary">{meeting.title}</h1>
      <MeetingStatusBadge status={meeting.status} />
     </div>
     <div className="space-y-3">
      <MetaRow icon="menu_book" label="Course" value={meeting.courseName ?? "Ad-hoc"} />
      {meeting.sectionName && <MetaRow icon="groups" label="Section" value={meeting.sectionName} />}
      <MetaRow icon="schedule" label="Starts" value={formatDate(meeting.scheduledStart)} />
      <MetaRow icon="schedule" label="Ends" value={formatDate(meeting.scheduledEnd)} />
      <MetaRow icon="person" label="Host" value={meeting.hostName} />
      <MetaRow
       icon="videocam"
       label="Recording"
       value={
        <span className="flex items-center gap-2">
         {meeting.recordingEnabled ? "Enabled" : "Off"}
         <TranscriptStatusBadge status={meeting.transcriptStatus} />
        </span>
       }
      />
     </div>
     {canJoin ? (
      <div className="flex justify-end gap-3 pt-2">
       <Button asChild>
        <Link to={`${basePath}/${meeting.id}/call`}>
         <span className="material-symbols-outlined text-[18px] mr-1">video_call</span>
         {meeting.status === "LIVE" ? "Join live" : "Join meeting"}
        </Link>
       </Button>
      </div>
     ) : meeting.status === "ENDED" ? (
      <p className="font-body-sm text-body-sm text-on-surface-variant text-right flex items-center justify-end gap-1">
       <span className="material-symbols-outlined text-[16px]">check_circle</span>
       This meeting has ended.
      </p>
     ) : !meeting.canJoin ? (
      <p className="font-body-sm text-body-sm text-on-surface-variant text-right">
       You don't have access to this meeting.
      </p>
     ) : null}
    </CardContent>
   </Card>

   <Tabs value={tab} onValueChange={(value) => setTab(value as typeof tab)}>
    <TabsList>
     <TabsTrigger value="recording">Recording</TabsTrigger>
     <TabsTrigger value="transcript">Transcript</TabsTrigger>
     <TabsTrigger value="attendance">Attendance</TabsTrigger>
     {isTeacher && <TabsTrigger value="followup">Follow-up</TabsTrigger>}
    </TabsList>
    <TabsContent value="recording">
     <RecordingTab meeting={meeting} />
    </TabsContent>
    <TabsContent value="transcript">
     <div
      className="h-[26rem] rounded-xl border border-border overflow-hidden"
     >
      <TranscriptPanel meetingId={meeting.id} className="h-full" />
     </div>
    </TabsContent>
    <TabsContent value="attendance">
     <Card className="border-border">
      <CardContent className="p-md">
       <AttendanceTab meeting={meeting} />
      </CardContent>
     </Card>
    </TabsContent>
    {isTeacher && (
     <TabsContent value="followup">
      <div className="h-[26rem] rounded-xl border border-border overflow-hidden">
       <StruggleSignalsPanel meetingId={meeting.id} className="h-full" />
      </div>
     </TabsContent>
    )}
   </Tabs>
  </div>
 )
}