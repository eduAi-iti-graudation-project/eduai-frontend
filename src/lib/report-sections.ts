function humanizeKey(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^./, (c) => c.toUpperCase())
}

function renderObject(obj: Record<string, unknown>, indent: string): string {
  const lines: string[] = []
  for (const [key, value] of Object.entries(obj)) {
    if (value == null) continue
    if (typeof value === "string") {
      const text = value.trim()
      if (text === "") continue
      lines.push(`${indent}- **${humanizeKey(key)}:** ${text}`)
    } else if (Array.isArray(value)) {
      lines.push(`${indent}- **${humanizeKey(key)}:**`)
      lines.push(renderList(value, indent + "  "))
    } else if (typeof value === "object") {
      lines.push(`${indent}- **${humanizeKey(key)}:**`)
      lines.push(renderObject(value as Record<string, unknown>, indent + "  "))
    } else {
      lines.push(`${indent}- **${humanizeKey(key)}:** ${String(value)}`)
    }
  }
  return lines.join("\n")
}

function renderList(items: unknown[], indent: string): string {
  const lines: string[] = []
  for (const item of items) {
    if (item == null) continue
    if (typeof item === "string") {
      const text = item.trim()
      if (text !== "") lines.push(`${indent}- ${text}`)
    } else if (Array.isArray(item)) {
      lines.push(`${indent}- ${renderList(item, indent + "  ")}`)
    } else if (typeof item === "object") {
      const rendered = renderObject(item as Record<string, unknown>, indent + "  ")
      lines.push(rendered)
    } else {
      lines.push(`${indent}- ${String(item)}`)
    }
  }
  return lines.join("\n")
}

export function renderReportSection(content: unknown): string {
  if (content == null) return "No content available."
  if (typeof content === "string") {
    return content.trim() === "" ? "No content available." : content
  }
  if (Array.isArray(content)) {
    const rendered = renderList(content, "").trim()
    return rendered === "" ? "No content available." : rendered
  }
  if (typeof content === "object") {
    const rendered = renderObject(content as Record<string, unknown>, "").trim()
    return rendered === "" ? "No content available." : rendered
  }
  return String(content)
}