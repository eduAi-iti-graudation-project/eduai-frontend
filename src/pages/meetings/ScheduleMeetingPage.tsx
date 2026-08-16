import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select"
import { LoadingState } from "@/components/shared/LoadingState"
import { ErrorState } from "@/components/shared/ErrorState"
import { useAuth } from "@/providers/use-auth"
import { useCreateMeeting } from "@/hooks/use-meetings"
import * as api from "@/lib/api"

function toDateTimeLocal(date: Date): string {
 const pad = (n: number) => n.toString().padStart(2, "0")
 return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function ScheduleMeetingPage() {
 const { user } = useAuth()
 const navigate = useNavigate()
 const create = useCreateMeeting()

 const isTeacher = user?.role === "TEACHER" || user?.role === "ADMIN"
 const basePath = isTeacher ? "/meetings" : "/student/meetings"

 const offeringsQuery = useQuery({
  queryKey: ["offerings"],
  queryFn: () => api.getOfferings(),
  staleTime: 60_000,
 })

 const now = new Date()
 const [title, setTitle] = useState("")
 const [type, setType] = useState<api.MeetingType>("CLASS")
 const [courseOfferingId, setCourseOfferingId] = useState<string>("")
 const [start, setStart] = useState(toDateTimeLocal(new Date(now.getTime() + 60 * 60 * 1000)))
 const [end, setEnd] = useState(toDateTimeLocal(new Date(now.getTime() + 2 * 60 * 60 * 1000)))
 const [recordingEnabled, setRecordingEnabled] = useState(false)

 const offerings = useMemo(() => {
  const all = offeringsQuery.data ?? []
  if (user?.role === "ADMIN") return all
  return all.filter((o) => o.teacher?.id === user?.id)
 }, [offeringsQuery.data, user?.id, user?.role])

 const onSubmit = async (event: React.FormEvent) => {
  event.preventDefault()
  if (!title.trim()) return
  try {
   const meeting = await create.mutateAsync({
    title: title.trim(),
    type,
    courseOfferingId: courseOfferingId || undefined,
    scheduledStart: new Date(start).toISOString(),
    scheduledEnd: new Date(end).toISOString(),
    recordingEnabled,
   })
   navigate(`${basePath}/${meeting.id}`)
  } catch {
   // toast handled in hook
  }
 }

 return (
  <div className="p-xl max-w-2xl mx-auto w-full">
   <header className="mb-lg">
    <h1 className="font-headline-xl text-headline-xl text-primary mb-1">Schedule a meeting</h1>
    <p className="font-body-md text-body-md text-on-surface-variant">
     Pick a time slot, and we'll spin up a LiveKit room when it's time to join.
    </p>
   </header>

   <Card className="border-border">
    <CardHeader>
     <CardTitle className="font-label-xl text-label-xl text-on-surface">Meeting details</CardTitle>
    </CardHeader>
    <CardContent>
     <form onSubmit={onSubmit} className="space-y-lg">
      <div className="space-y-2">
       <Label htmlFor="title">Title</Label>
       <Input
        id="title"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="e.g. Trigonometry review"
        required
       />
      </div>

      <div className="space-y-2">
       <Label htmlFor="type">Type</Label>
       <Select value={type} onValueChange={(v) => setType(v as api.MeetingType)}>
        <SelectTrigger id="type" className="w-full">
         <SelectValue />
        </SelectTrigger>
        <SelectContent>
         <SelectItem value="CLASS">Class</SelectItem>
         <SelectItem value="AD_HOC">Ad-hoc</SelectItem>
        </SelectContent>
       </Select>
      </div>

      {type === "CLASS" && (
       <div className="space-y-2">
        <Label htmlFor="offering">Class offering</Label>
        {offeringsQuery.isLoading ? (
         <LoadingState className="py-sm" />
        ) : offeringsQuery.isError ? (
         <ErrorState
          title="Failed to load offerings"
          message={offeringsQuery.error?.message ?? "Something went wrong"}
          onRetry={() => offeringsQuery.refetch()}
          className="py-sm"
         />
        ) : (
         <Select value={courseOfferingId} onValueChange={setCourseOfferingId}>
          <SelectTrigger id="offering" className="w-full">
           <SelectValue placeholder="Select a class" />
          </SelectTrigger>
          <SelectContent>
           {offerings.map((offering) => (
            <SelectItem key={offering.id} value={offering.id}>
             {offering.course.name} · {offering.section.name}
            </SelectItem>
           ))}
          </SelectContent>
         </Select>
        )}
       </div>
      )}

      <div className="grid grid-cols-2 gap-md">
       <div className="space-y-2">
        <Label htmlFor="start">Start</Label>
        <Input id="start" type="datetime-local" value={start} onChange={(event) => setStart(event.target.value)} required />
       </div>
       <div className="space-y-2">
        <Label htmlFor="end">End</Label>
        <Input id="end" type="datetime-local" value={end} onChange={(event) => setEnd(event.target.value)} required />
       </div>
      </div>

      <label className="flex items-center gap-3 cursor-pointer">
       <Checkbox checked={recordingEnabled} onCheckedChange={(v) => setRecordingEnabled(v === true)} />
       <span>
        <span className="block font-label-md text-label-md text-on-surface">Record the meeting</span>
        <span className="block font-body-sm text-body-sm text-on-surface-variant">
         Produces an MP4 and auto-transcribed transcript after the meeting.
        </span>
        <span className="block font-body-sm text-body-sm text-on-surface-variant">
         Participants&apos; spoken questions may also be analyzed to
         suggest personalized follow-up material after the meeting
         (never sent without your review).
        </span>
       </span>
      </label>

      <div className="flex justify-end gap-3">
       <Button type="button" variant="ghost" onClick={() => navigate(basePath)}>
        Cancel
       </Button>
       <Button type="submit" disabled={create.isPending}>
        {create.isPending ? "Scheduling…" : "Schedule meeting"}
       </Button>
      </div>
     </form>
    </CardContent>
   </Card>
  </div>
 )
}