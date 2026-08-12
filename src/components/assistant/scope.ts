export interface AssistantScope {
  kind: "all" | "student" | "teacher" | "offering"
  id?: string
  name?: string
}

export interface ScopeGroup {
  label: string
  kind: AssistantScope["kind"]
  items: { id: string; name: string }[]
}

export function scopeLabel(s: AssistantScope, fallback = "All"): string {
  if (s.kind === "student") return `Student: ${s.name}`
  if (s.kind === "teacher") return `Teacher: ${s.name}`
  if (s.kind === "offering") return `Course: ${s.name}`
  return fallback
}