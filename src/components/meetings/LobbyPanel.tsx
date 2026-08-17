import { useEffect, useRef, useState } from "react"
import { createLocalVideoTrack } from "livekit-client"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select"
import { useMediaDevices } from "@/hooks/use-livekit"

interface LobbyPanelProps {
 title: string
 subtitle: string
 joining: boolean
 onJoin: (devices: { cameraId?: string; micId?: string }) => void
 onBack: () => void
}

export function LobbyPanel({ title, subtitle, joining, onJoin, onBack }: LobbyPanelProps) {
 const { cameras, mics, error: devicesError } = useMediaDevices()
 const [cameraId, setCameraId] = useState<string>("default")
 const [micId, setMicId] = useState<string>("default")
 const [previewError, setPreviewError] = useState<string | null>(null)
 const videoRef = useRef<HTMLVideoElement | null>(null)
 const trackRef = useRef<Awaited<ReturnType<typeof createLocalVideoTrack>> | null>(null)

 useEffect(() => {
  let cancelled = false
  void (async () => {
   trackRef.current?.stop()
   trackRef.current = null
   try {
    const track = await createLocalVideoTrack({ deviceId: cameraId })
    if (cancelled) {
     track.stop()
     return
    }
    trackRef.current = track
    if (videoRef.current) {
     videoRef.current.srcObject = new MediaStream([track.mediaStreamTrack])
     void videoRef.current.play().catch(() => undefined)
    }
    setPreviewError(null)
   } catch (cause: unknown) {
    setPreviewError(cause instanceof Error ? cause.message : "Camera unavailable")
   }
  })()
  return () => {
   cancelled = true
  }
 }, [cameraId])

 useEffect(() => {
  return () => {
   trackRef.current?.stop()
   trackRef.current = null
  }
 }, [])

 const deviceOptions = (devices: MediaDeviceInfo[]) => (
  <>
   <SelectItem value="default">Default</SelectItem>
   {devices.map((device) => (
    <SelectItem key={device.deviceId} value={device.deviceId}>
     {device.label || "Unnamed device"}
    </SelectItem>
   ))}
  </>
 )

 return (
  <div className="flex border  flex-col items-center  bg-inverse-surface text-inverse-on-surface p-xl overflow-y-auto">
   <div className="w-full   max-w-2xl my-auto min-w-0">
    <div className="text-center mt-20 mb-lg">
     <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
      <span className="material-symbols-outlined text-[28px]">video_call</span>
     </div>
     <h1 className="font-headline-md text-headline-md font-bold">{title}</h1>
     <p className="font-body-md  text-body-md text-inverse-on-surface/70 mt-1">{subtitle}</p>
    </div>

    <div className="rounded-2xl overflow-hidden bg-black relative max-h-[42vh] aspect-video mb-lg">
     <video ref={videoRef} muted playsInline className="w-full h-full object-contain" />
     {(previewError || devicesError) && (
      <div className="absolute inset-0 flex items-center justify-center bg-surface-container-high">
       <div className="text-center px-lg">
        <span className="material-symbols-outlined text-[40px] text-inverse-on-surface/70 block mb-2">videocam_off</span>
        <p className="font-label-md text-label-md text-inverse-on-surface/70">{previewError ?? devicesError}</p>
       </div>
      </div>
     )}
    </div>

    <div className="space-y-md min-w-0">
     <div className="space-y-1">
      <Label className="font-label-md text-label-md text-inverse-on-surface/70">Camera</Label>
      <Select value={cameraId} onValueChange={setCameraId}>
       <SelectTrigger className="bg-white/10 border-white/10 text-inverse-on-surface">
        <SelectValue placeholder="Choose camera" />
       </SelectTrigger>
       <SelectContent>{deviceOptions(cameras)}</SelectContent>
      </Select>
     </div>

     <div className="space-y-1">
      <Label className="font-label-md text-label-md text-inverse-on-surface/70">Microphone</Label>
      <Select value={micId} onValueChange={setMicId}>
       <SelectTrigger className="bg-white/10 border-white/10 text-invers">
        <SelectValue placeholder="Choose microphone" />
       </SelectTrigger>
       <SelectContent>{deviceOptions(mics)}</SelectContent>
      </Select>
     </div>

     <div className="flex gap-md pt-sm">
      <Button variant="outline" className="flex-1 bg-transparent border-white/10 text-inverse-on-surface/70 hover:bg-white/10" onClick={onBack} disabled={joining}>
       Back
      </Button>
      <Button className="flex-1" onClick={() => onJoin({ cameraId, micId })} disabled={joining}>
       {joining ? (
        <>
         <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
         Joining…
        </>
       ) : (
        <>
         <span className="material-symbols-outlined text-[18px]">call</span>
         Join meeting
        </>
       )}
      </Button>
     </div>
    </div>
   </div>
  </div>
 )
}
