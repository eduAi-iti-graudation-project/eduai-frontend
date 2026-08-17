import { useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { toast } from "sonner"
import { LabSimulationFrame } from "@/components/labs/LabSimulationFrame"
import { PageHeader } from "@/components/shared/PageHeader"
import { Button } from "@/components/ui/button"
import { useStudyLabOfferings } from "@/hooks/use-study-lab"
import { useLab } from "@/hooks/use-labs"
import { LabStatusChip } from "@/components/labs/LabStatusChip"

export function StudentLabDetailPage() {
 const { id = "" } = useParams()
 const { data: lab, isLoading } = useLab(id)
 const offerings = useStudyLabOfferingNames()
 const [objectiveCount, setObjectiveCount] = useState(0)

 const onObjectiveComplete = useMemo(
  () => () => {
   setObjectiveCount((count) => {
    const next = count + 1
    toast.success(`Objective complete${next > 1 ? ` (${next}×)` : ""}!`)
    return next
   })
  },
  [],
 )

 if (isLoading) {
  return (
   <div className="flex-1 flex flex-col items-center justify-center gap-3 py-xl">
    <span className="material-symbols-outlined text-[32px] text-on-surface-variant animate-spin">progress_activity</span>
    <p className="font-body-md text-body-md text-on-surface-variant">Loading simulation…</p>
   </div>
  )
 }

 if (!lab || (!lab.gameSpec && !lab.generatedCode)) {
  return (
   <div className="flex-1 flex flex-col items-center justify-center py-xl gap-2">
    <p className="font-body-lg text-body-lg text-on-surface">This simulation is not available.</p>
    <Link to="/student/labs" className="text-primary hover:underline">Back to labs</Link>
   </div>
  )
 }

 return (
  <div className="flex-1 flex flex-col">
   <PageHeader
    title={lab.topic}
    subtitle={offerings.get(lab.courseOfferingId) ?? "—"}
    actions={
     <div className="flex items-center gap-2">
      <Link to="/student/labs">
       <Button variant="ghost">Back to labs</Button>
      </Link>
      <LabStatusChip status={lab.status} />
     </div>
    }
   />

   <div className="px-6 pb-6 flex-1 min-h-0">
    <div className="aspect-[16/10] max-h-[70vh]">
     <LabSimulationFrame
       spec={lab.gameSpec}
       code={lab.generatedCode}
       onObjectiveComplete={onObjectiveComplete}
       className="h-full"
      />
    </div>
    {objectiveCount > 0 && (
     <p className="font-body-md text-body-md text-on-surface-variant mt-3">
      Objective reached {objectiveCount}× — nice work. Use Restart to try the setup again.
     </p>
    )}
   </div>
  </div>
 )
}

function useStudyLabOfferingNames(): Map<string, string> {
 const offerings = useStudyLabOfferings()
 return useMemo(
  () =>
   new Map(
    (offerings.data ?? []).map((o) => [o.offeringId, o.courseName]),
   ),
  [offerings.data],
 )
}