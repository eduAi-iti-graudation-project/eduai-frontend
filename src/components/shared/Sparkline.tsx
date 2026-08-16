import { useId } from "react"

interface SparklineProps {
 values: number[]
 width?: number
 height?: number
 stroke?: string
 fill?: string
 className?: string
}

export function Sparkline({ values, width = 96, height = 28, stroke = "#a43073", fill = "#f05e9e", className }: SparklineProps) {
 const gradientId = useId()

 if (values.length < 2) {
  return null
 }

 const min = Math.min(...values)
 const max = Math.max(...values)
 const range = max - min || 1
 const step = width / (values.length - 1)

 const points = values.map((v, i) => {
  const x = i * step
  const y = height - ((v - min) / range) * (height - 4) - 2
  return [x, y] as const
 })

 const line = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`).join(" ")
 const area = `${line} L${width} ${height} L0 ${height} Z`

 return (
  <svg
   viewBox={`0 0 ${width} ${height}`}
   width="100%"
   height={height}
   className={className}
   role="img"
   aria-hidden="true"
   preserveAspectRatio="none"
  >
   <defs>
    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
     <stop offset="0%" stopColor={fill} stopOpacity="0.55" />
     <stop offset="100%" stopColor={fill} stopOpacity="0" />
    </linearGradient>
   </defs>
   <path d={area} fill={`url(#${gradientId})`} />
   <path d={line} fill="none" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
   <circle cx={points[points.length - 1][0]} cy={points[points.length - 1][1]} r="2.4" fill={stroke} />
  </svg>
 )
}