export function renderReportSection(content: unknown): string {
  if (content == null) return "No content available."
  if (typeof content === "string") {
    return content.trim() === "" ? "No content available." : content
  }
  if (typeof content === "object") return JSON.stringify(content, null, 2)
  return String(content)
}