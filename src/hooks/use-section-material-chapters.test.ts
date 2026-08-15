import { describe, it, expect } from "vitest"
import { filterMaterialChaptersByCourse } from "@/hooks/use-materials"
import type { Material, MaterialChapter } from "@/lib/api"

const courseChapter: MaterialChapter = {
  id: "cc-1",
  title: "Course chapter",
  order: 0,
  materials: [],
  courseId: "course-1",
  courseOfferingId: null,
}

const offeringChapter: MaterialChapter = {
  id: "oc-1",
  title: "Offering chapter",
  order: 1,
  materials: [],
  courseId: "course-1",
  courseOfferingId: "off-1",
}

const otherCourseChapter: MaterialChapter = {
  id: "cc-2",
  title: "Other course chapter",
  order: 0,
  materials: [],
  courseId: "course-2",
  courseOfferingId: null,
}

const sharedMaterial: Material = {
  id: "m-1",
  title: "Shared",
  classId: "sec-1",
  courseId: "course-1",
  courseOfferingId: null,
  createdAt: "2026-01-01T00:00:00Z",
}

const sectionMaterial: Material = {
  id: "m-2",
  title: "Section only",
  classId: "sec-1",
  courseId: "course-1",
  courseOfferingId: "off-1",
  createdAt: "2026-01-01T00:00:00Z",
}

const otherCourseMaterial: Material = {
  id: "m-3",
  title: "Other course",
  classId: "sec-1",
  courseId: "course-2",
  courseOfferingId: null,
  createdAt: "2026-01-01T00:00:00Z",
}

describe("filterMaterialChaptersByCourse", () => {
  const allChapters = [courseChapter, offeringChapter, otherCourseChapter]
  const allUnassigned = [sharedMaterial, sectionMaterial, otherCourseMaterial]

  it("keeps course-level and offering-level chapters of the selected course", () => {
    const { chapters } = filterMaterialChaptersByCourse(
      allChapters,
      allUnassigned,
      "course-1",
      "off-1",
    )
    expect(chapters.map((c) => c.id)).toEqual(["cc-1", "oc-1"])
  })

  it("drops chapters of other courses", () => {
    const { chapters } = filterMaterialChaptersByCourse(
      allChapters,
      allUnassigned,
      "course-1",
      "off-1",
    )
    expect(chapters.map((c) => c.id)).not.toContain("cc-2")
  })

  it("keeps shared and section-only materials of the selected course", () => {
    const { unassigned } = filterMaterialChaptersByCourse(
      allChapters,
      allUnassigned,
      "course-1",
      "off-1",
    )
    expect(unassigned.map((m) => m.id)).toEqual(["m-1", "m-2"])
  })

  it("drops materials of other courses", () => {
    const { unassigned } = filterMaterialChaptersByCourse(
      allChapters,
      allUnassigned,
      "course-1",
      "off-1",
    )
    expect(unassigned.map((m) => m.id)).not.toContain("m-3")
  })

  it("matches legacy chapters by offering id even without courseId", () => {
    const legacy = { ...offeringChapter, courseId: undefined }
    const { chapters } = filterMaterialChaptersByCourse(
      [legacy],
      [],
      "course-1",
      "off-1",
    )
    expect(chapters.map((c) => c.id)).toEqual(["oc-1"])
  })

  it("returns nothing when no course is selected", () => {
    const { chapters, unassigned } = filterMaterialChaptersByCourse(
      allChapters,
      allUnassigned,
      null,
      null,
    )
    expect(chapters).toEqual([])
    expect(unassigned).toEqual([])
  })
})
