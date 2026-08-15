import { useMemo } from "react"
import { Link } from "react-router-dom"
import { PageHeader } from "@/components/shared/PageHeader"
import { useStudyLabOfferings } from "@/hooks/use-study-lab"
import { useLabs } from "@/hooks/use-labs"
import { LabStatusChip } from "@/components/labs/LabStatusChip"

export function StudentLabsPage() {
  const { labs, isLoading } = useLabs()
  const offerings = useStudyLabOfferings()

  const offeringNameMap = useMemo(
    () =>
      new Map(
        (offerings.data ?? []).map((o) => [o.offeringId, o.courseName]),
      ),
    [offerings.data],
  )

  return (
    <div className="flex-1 flex flex-col">
      <PageHeader
        title="Lab Simulations"
        subtitle="Interactive physics simulations your teacher built from class material. Can you hit the objective?"
      />

      <div className="px-6 pb-6 flex-1">
        {isLoading ? (
          <p className="font-body-md text-body-md text-on-surface-variant">Loading labs…</p>
        ) : labs.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-surface p-10 text-center">
            <span className="material-symbols-outlined text-[40px] text-on-surface-variant">science</span>
            <p className="font-headline-sm text-headline-sm text-on-surface mt-3">No labs yet</p>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">
              Your teachers haven't published any simulations for your classes yet.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {labs.map((lab) => (
              <Link
                key={lab.id}
                to={`/student/labs/${lab.id}`}
                className="group rounded-lg border border-border bg-surface p-5 transition-colors hover:border-primary/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary">science</span>
                  </span>
                  <LabStatusChip status={lab.status} />
                </div>
                <p className="font-label-lg text-label-lg text-on-surface mt-4 group-hover:text-primary transition-colors">
                  {lab.topic}
                </p>
                <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">
                  {offeringNameMap.get(lab.courseOfferingId) ?? "—"}
                </p>
                <p className="font-label-sm text-label-sm text-on-surface-variant mt-3 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px]">schedule</span>
                  Published{" "}
                  {lab.publishedAt
                    ? new Date(lab.publishedAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })
                    : "recently"}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}