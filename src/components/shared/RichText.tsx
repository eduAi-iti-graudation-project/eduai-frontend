import ReactMarkdown, { type Components } from "react-markdown"
import remarkGfm from "remark-gfm"
import type { Root, Content, Parent, Text } from "mdast"
import type { Pluggable } from "unified"
import { cn } from "@/lib/utils"

const PCT_RE = /(\d+(?:\.\d+)?%)/g
const PCT_FULL = /^\d+(?:\.\d+)?%$/
const URL_RE = /(https?:\/\/[^\s<>"']+|www\.[^\s<>"']+)/g
const URL_FULL = /^(https?:\/\/|www\.)[^\s<>"']+$/
const MARKDOWN_MARKERS_RE =
  /(?:^|\n)\s*(?:#{1,6}\s|\*\*|[-*+]\s|\d+\.\s|> )|==[^=]+==|!\[|\[[^\]]+\]\(/

/**
 * Legacy prose generated before the formatting rules produced one dense
 * paragraph with no markdown at all. Give it a bolded takeaway opener so it
 * matches the style of newly generated content instead of rendering as a wall
 * of plain text.
 */
function legacyFlair(text: string): string {
  if (MARKDOWN_MARKERS_RE.test(text)) return text
  return text
    .split(/\n{2,}/)
    .map((block) => {
      if (/\*\*|==|^#{1,6}\s/.test(block)) return block
      const match = block.match(/^(.{5,240}?)\.(?=\s|$)/)
      if (!match) return block
      const rest = block.slice(match[0].length)
      return `**${match[1]}.**${rest}`
    })
    .join("\n\n")
}
function splitLinePct(value: string): Content[] {
  const out: Content[] = []
  for (const seg of value.split(PCT_RE)) {
    if (!seg) continue
    if (PCT_FULL.test(seg)) {
      out.push({
        type: "span",
        data: { pct: true },
        children: [{ type: "text", value: seg }],
      } as unknown as Content)
    } else {
      out.push(...splitLineUrls(seg))
    }
  }
  return out
}

function splitLineUrls(value: string): Content[] {
  const out: Content[] = []
  for (const seg of value.split(URL_RE)) {
    if (!seg) continue
    if (URL_FULL.test(seg)) {
      const href = seg.startsWith("http") ? seg : `https://${seg}`
      out.push({
        type: "link",
        url: href,
        children: [{ type: "text", value: seg }],
      } as unknown as Content)
    } else {
      out.push({ type: "text", value: seg })
    }
  }
  return out
}

function inlineTokens(value: string): Content[] {
  const out: Content[] = []
  for (const part of value.split(/(==[^=]+==)/g)) {
    if (!part) continue
    if (part.startsWith("==") && part.endsWith("==") && part.length > 4) {
      out.push({
        type: "mark",
        children: [{ type: "text", value: part.slice(2, -2) }],
      } as unknown as Content)
    } else {
      out.push(...splitLinePct(part))
    }
  }
  return out
}

function highlightPlugin(): (tree: Root) => void {
  return (tree) => {
    const visitChildren = (node: Parent | Root) => {
      if (!Array.isArray(node.children)) return
      const next: Content[] = []
      for (const child of node.children) {
        // never modify inside code / inline code / raw html
        if (child.type === "text" && typeof (child as Text).value === "string") {
          const value = (child as Text).value
          if (value.includes("==")) {
            next.push(...inlineTokens(value))
          } else {
            next.push(...splitLinePct(value))
          }
        } else {
          next.push(child)
        }
        if ("children" in child && (child.type as string) !== "code" && (child.type as string) !== "inlineCode") {
          visitChildren(child as Parent)
        }
      }
      node.children = next
    }
    visitChildren(tree as Root)
  }
}

const components: Components = {
  mark: ({ children }) => (
    <mark className="rounded-[4px] bg-[#fff1c2] text-[#6b4e00] px-1 py-0 -mx-0.5 font-medium">
      {children}
    </mark>
  ),
  span: ({ node, children }) => {
    const data = (node?.data ?? {}) as Record<string, unknown>
    if (data.pct === true) {
      return (
        <span className="rounded-full bg-primary/12 px-1.5 py-0.5 font-semibold text-primary whitespace-nowrap">
          {children}
        </span>
      )
    }
    return <span>{children}</span>
  },
  strong: ({ children }) => (
    <strong className="rounded-[3px] bg-primary/10 px-0.5 -mx-0.5 font-semibold text-primary">
      {children}
    </strong>
  ),
  em: ({ children }) => <em className="italic text-on-surface-variant">{children}</em>,
  del: ({ children }) => <del className="line-through text-on-surface-variant">{children}</del>,
  p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
  h1: ({ children }) => <h1 className="font-headline-md text-headline-md text-primary mb-2 mt-1">{children}</h1>,
  h2: ({ children }) => <h2 className="font-headline-sm text-headline-sm text-primary mb-2 mt-1">{children}</h2>,
  h3: ({ children }) => <h3 className="font-label-md text-label-md text-primary font-semibold mb-1 mt-1">{children}</h3>,
  ul: ({ children }) => <ul className="my-2 mb-3 space-y-1.5 pl-4 [&_li::marker]:text-primary [&_li::marker]:font-bold">{children}</ul>,
  ol: ({ children }) => (
    <ol className="my-2 mb-3 space-y-1.5 pl-4 [&_li::marker]:text-primary [&_li::marker]:font-semibold">{children}</ol>
  ),
  li: ({ children }) => <li className="pl-0.5 leading-relaxed [&>p]:mb-0">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="my-2 rounded-r-md border-l-[3px] border-primary bg-primary-container/40 px-3 py-2 italic text-on-surface-variant">
      {children}
    </blockquote>
  ),
  pre: ({ children }) => (
    <pre className="my-2 overflow-x-auto rounded-md bg-surface-container-high p-3 text-[13px] leading-relaxed text-on-surface">{children}</pre>
  ),
  code: ({ className, children }) =>
    className ? (
      <code className={cn("font-code-sm", className)}>{children}</code>
    ) : (
      <code className="rounded-sm bg-surface-container-high px-1.5 py-0.5 font-code-sm text-[13px] text-on-surface">
        {children}
      </code>
    ),
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noreferrer" className="font-medium text-primary underline underline-offset-2 hover:text-primary/80">
      {children}
    </a>
  ),
  table: ({ children }) => (
    <div className="my-2 overflow-x-auto rounded-md border border-outline-variant">
      <table className="w-full border-collapse text-left">{children}</table>
    </div>
  ),
  th: ({ children }) => <th className="border-b border-outline-variant bg-surface-container-low px-2 py-1.5 font-label-sm text-label-sm text-on-surface font-semibold">{children}</th>,
  td: ({ children }) => <td className="border-b border-outline-variant px-2 py-1.5 font-body-sm text-body-sm text-on-surface">{children}</td>,
  hr: () => <hr className="my-3 border-outline-variant" />,
}

interface RichTextProps {
  text: string
  className?: string
}

export function RichText({ text, className }: RichTextProps) {
  return (
    <div className={cn("font-body-md text-body-md text-on-surface leading-relaxed break-words", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm, highlightPlugin] as Pluggable[]} components={components as Components}>
        {legacyFlair(text)}
      </ReactMarkdown>
    </div>
  )
}