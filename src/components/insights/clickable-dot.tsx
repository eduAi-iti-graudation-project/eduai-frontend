import type { ReactElement } from "react"
import type { ChartPointClick } from "@/components/insights/chart-components"

interface DotRenderProps {
 cx?: number
 cy?: number
 r?: number
 payload?: unknown
}

/** Renders each curve point as a clickable circle. Line/Area/Radar spread onClick onto
 *  the SVG path, so the handler only ever receives a raw MouseEvent — a custom `dot`
 *  render function is the reliable way to read the point's payload. */
export function clickableDot(
 color: string,
 radius: number,
 onClick: ChartPointClick | undefined,
): ((props: unknown) => ReactElement<SVGElement>) | undefined {
 if (!onClick) return undefined
 return (props) => {
  const dotProps = props as DotRenderProps
  const payload = dotProps.payload as { label?: string; value?: number } | null | undefined
  const p =
   payload && typeof payload.label === "string" && typeof payload.value === "number"
    ? { label: payload.label, value: payload.value }
    : null
  return (
   <circle
    cx={dotProps.cx ?? 0}
    cy={dotProps.cy ?? 0}
    r={dotProps.r ?? radius}
    fill={color}
    strokeWidth={0}
    style={{ cursor: "pointer" }}
    onClick={(e) => {
     if (!p) return
     e.stopPropagation()
     onClick(p.label, p.value)
    }}
   />
  )
 }
}