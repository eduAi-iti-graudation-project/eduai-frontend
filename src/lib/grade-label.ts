export interface GradeRef {
  id: string
  level: number
  name: string | null
}

export function getGradeLabel(grade: GradeRef | null | undefined): string | null {
  if (!grade) return null
  if (typeof grade.level === "number" && grade.level > 0) return `Grade ${grade.level}`
  if (grade.name) return grade.name
  return null
}