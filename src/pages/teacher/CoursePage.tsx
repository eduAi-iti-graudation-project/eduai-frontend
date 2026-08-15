import { useParams, useSearchParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import * as api from "@/lib/api"
import { useAuth } from "@/providers/use-auth"
import { LoadingState } from "@/components/shared/LoadingState"
import { ErrorState } from "@/components/shared/ErrorState"
import { BackLink } from "@/components/shared/BackLink"
import { CourseMaterialsTab } from "./CourseMaterialsTab"

export function CoursePage() {
  const { courseId } = useParams<{ courseId: string }>()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()

  const courseQuery = useQuery({
    queryKey: ["course", courseId],
    queryFn: () => api.getCourse(courseId!),
    enabled: !!courseId,
  })

  const offeringsQuery = useQuery({
    queryKey: ["teacher-offerings", user?.id, courseId],
    queryFn: () => api.getTeacherOfferings(user!.id, courseId!),
    enabled: !!user?.id && !!courseId,
  })

  const gradesQuery = useQuery({
    queryKey: ["teacher-grades", user?.id],
    queryFn: () => api.getTeacherGrades(user!.id),
    enabled: !!user?.id,
  })

  const grade = gradesQuery.data?.find(
    (g) => courseQuery.data && g.id === courseQuery.data.gradeLevelId,
  )

  const backTo = searchParams.get("gradeId")
    ? `/grades/${searchParams.get("gradeId")}`
    : "/grades"

  if (courseQuery.isError) {
    return (
      <ErrorState
        title="Something went wrong"
        message={courseQuery.error instanceof Error ? courseQuery.error.message : "Failed to load course"}
        onRetry={() => courseQuery.refetch()}
        className="flex-1"
      />
    )
  }

  if (courseQuery.isLoading || !courseQuery.data) {
    return <LoadingState className="flex-1 p-xl max-w-7xl mx-auto w-full" />
  }

  const course = courseQuery.data
  const offerings = offeringsQuery.data ?? []
  const primaryOffering = offerings[0]

  return (
    <div className="flex-1 p-xl max-w-7xl mx-auto w-full">
      <BackLink
        to={backTo}
        label={searchParams.get("gradeId") ? "Back to Grade" : "Back to Grades"}
        className="mb-md"
      />

      <div className="mb-sm">
        <h1 className="font-headline-xl text-headline-xl text-on-surface">{course.name}</h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
          {grade ? `Grade ${grade.level}${grade.name ? ` — ${grade.name}` : ""}` : ""}
          {course.description ? ` · ${course.description}` : ""}
        </p>
      </div>

      <div className="flex flex-wrap gap-sm mb-xl">
        {offerings.length === 0 ? (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-surface-container text-on-surface-variant font-label-sm text-label-sm">
            <span className="material-symbols-outlined text-[15px]">groups</span>
            Not teaching this course in any section yet
          </span>
        ) : (
          offerings.map((o) => (
            <span
              key={o.id}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-secondary-fixed text-secondary font-label-sm text-label-sm"
            >
              <span className="material-symbols-outlined text-[15px]">groups</span>
              {o.section.name}
            </span>
          ))
        )}
      </div>

      {primaryOffering ? (
        <CourseMaterialsTab
          key={course.id}
          courseId={course.id}
          offeringId={primaryOffering.id}
          sectionName={primaryOffering.section.name}
        />
      ) : (
        <p className="font-body-md text-body-md text-on-surface-variant">
          Materials can be managed here once you are assigned to teach this course in a section.
        </p>
      )}
    </div>
  )
}