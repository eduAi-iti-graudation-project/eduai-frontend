/* eslint-disable react-hooks/immutability */
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  checkTimetableConflict,
  createTimetableSlot,
  DAY_ORDER,
  deleteTimetableSlot,
  getErrorMessage,
  type CourseOffering,
  type DayOfWeek,
  type SlotConflict,
  type TimetableSlotWithOffering,
  updateTimetableSlot,
} from "@/lib/api"
import { orderedDays } from "@/lib/timetable-settings"
import { cn } from "@/lib/utils"
import {
  colorForTag,
  fmtTime,
  fmtTimeRange,
  fromMinutes,
  isToday,
 
  toMinutes,
} from "./timetable-utils"

const HOUR_PX = 56
const SNAP_MIN = 15
const MIN_CREATE_MIN = 30

const GRID_GUTTER = 64

type DragState =
  | {
      mode: "move"
      slotId: string
      courseOfferingId: string
      day: DayOfWeek
      startMin: number
      endMin: number
      originDay: DayOfWeek
      originStart: number
      originEnd: number
    }
  | {
      mode: "resize"
      slotId: string
      courseOfferingId: string
      day: DayOfWeek
      startMin: number
      endMin: number
      originEnd: number
    }
  | {
      mode: "create"
      day: DayOfWeek
      startMin: number
      endMin: number
    }

interface CreatePopoverState {
  x: number
  y: number
  day: DayOfWeek
  startMin: number
  endMin: number
}

interface TooltipState {
  x: number
  y: number
  slot: TimetableSlotWithOffering
}

export interface WeeklyTimetableGridProps {
  slots: TimetableSlotWithOffering[]
  editable?: boolean
  showSection?: boolean
  offerings?: CourseOffering[]
  sectionId?: string
  days?: DayOfWeek[]
  dayStartHour?: number
  dayEndHour?: number
  showNowIndicator?: boolean
  fillHeight?: boolean
  className?: string
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => setMatches(mql.matches)
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [query])
  return matches
}

function timeFromEvent(
  rect: DOMRect,
  clientY: number,
  dayStartMin: number,
  daySpanMin: number,
): number {
  const ratio = Math.min(Math.max((clientY - rect.top) / rect.height, 0), 1)
  const minutes = dayStartMin + ratio * daySpanMin
  return Math.round(minutes / SNAP_MIN) * SNAP_MIN
}

export function WeeklyTimetableGrid({
  slots,
  editable = false,
  showSection = false,
  offerings = [],
  sectionId,
  days = orderedDays(),
  dayStartHour = 7,
  dayEndHour = 18,
  showNowIndicator = !editable,
  fillHeight = false,
  className,
}: WeeklyTimetableGridProps) {
  const queryClient = useQueryClient()
  const containerRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)

  const [localSlots, setLocalSlots] = useState(slots)
  const [prevSlots, setPrevSlots] = useState(slots)
  if (prevSlots !== slots) {
    setPrevSlots(slots)
    setLocalSlots(slots)
  }
  const [drag, setDrag] = useState<DragState | null>(null)
  const [popover, setPopover] = useState<CreatePopoverState | null>(null)
  const [conflict, setConflict] = useState<SlotConflict | null>(null)
  const [conflictChecking, setConflictChecking] = useState(false)
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const [mobileDay, setMobileDay] = useState<DayOfWeek>(() => {
    const todayName = DAY_ORDER[(new Date().getDay() + 6) % 7]
    return orderedDays().find((d) => d === todayName) ?? DAY_ORDER[0]
  })

  const mobile = useMediaQuery("(max-width: 767px)")

  // ── Row-height expansion (content-aware) ──────────────────────────
  // If a slot's content needs more vertical space than its time-proportional
  // height gives it, we grow the *whole hour row* (across all day columns)
  // instead of letting the slot overlap its neighbours.
  const slotRefs = useRef<Map<string, HTMLDivElement | null>>(new Map())
  const hourCount = Math.max(0, dayEndHour - dayStartHour)

  // ── Fill-height mode ─────────────────────────────────────────────
  // When `fillHeight` is set, scale the hour row height so the grid
  // body fills whatever vertical space the container provides, instead
  // of leaving dead space below a fixed 56px-per-hour grid.
  const [size, setSize] = useState<{ height: number; header: number } | null>(null)

  useLayoutEffect(() => {
    if (!fillHeight) return
    const el = containerRef.current
    if (!el) return
    const headerEl = el.querySelector<HTMLElement>("[data-grid-header]")
    const measure = () => {
      setSize({ height: el.clientHeight, header: headerEl?.offsetHeight ?? 44 })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    if (headerEl) ro.observe(headerEl)
    return () => ro.disconnect()
  }, [fillHeight])

  const hourPx =
    fillHeight && size
      ? Math.max(34, Math.min(88, (size.height - size.header) / Math.max(hourCount, 1)))
      : HOUR_PX

  const [rowExtra, setRowExtra] = useState<number[]>(() => new Array(hourCount).fill(0))

  useLayoutEffect(() => {
    if (mobile) {
      setRowExtra((prev) => (prev.length === hourCount && prev.every((v) => v === 0) ? prev : new Array(hourCount).fill(0)))
      return
    }
    const next = new Array(hourCount).fill(0)
    for (const slot of localSlots) {
      const el = slotRefs.current.get(slot.id)
      if (!el) continue
      const startMin = toMinutes(slot.startTime)
      const endMin = toMinutes(slot.endTime)
      const GAP = 8
      const baseHeight = Math.max(hourPx / 2 - GAP, ((endMin - startMin) / 60) * hourPx - GAP)
      const contentHeight = el.scrollHeight
      if (contentHeight > baseHeight) {
        const hourIdx = Math.floor((startMin - dayStartMin) / 60)
        if (hourIdx >= 0 && hourIdx < next.length) {
          next[hourIdx] = Math.max(next[hourIdx], contentHeight - baseHeight)
        }
      }
    }
    setRowExtra((prev) =>
      prev.length === next.length && prev.every((v, i) => v === next[i]) ? prev : next,
    )
  })

  const cumulativeExtra = useMemo(() => {
    const arr: number[] = []
    let sum = 0
    for (let i = 0; i < rowExtra.length; i++) {
      arr.push(sum)
      sum += rowExtra[i]
    }
    return arr
  }, [rowExtra])
  const totalExtra = useMemo(() => rowExtra.reduce((a, b) => a + b, 0), [rowExtra])

  // Converts a minute-of-day into a pixel offset that accounts for any
  // hour rows that had to grow to fit their content.
  const adjustedTop = (min: number) => {
    const rawIdx = (min - dayStartMin) / 60
    const hourIdx = Math.min(Math.max(Math.floor(rawIdx), 0), Math.max(rowExtra.length - 1, 0))
    const fractionIntoHour = Math.min(Math.max(rawIdx - hourIdx, 0), 1)
    const baseTop = rawIdx * hourPx
    const extraBefore = cumulativeExtra[hourIdx] ?? totalExtra
    const extraWithin = (rowExtra[hourIdx] ?? 0) * fractionIntoHour
    return baseTop + extraBefore + extraWithin
  }

  const slotById = useMemo(() => {
    const map = new Map<string, TimetableSlotWithOffering>()
    for (const s of localSlots) map.set(s.id, s)
    return map
  }, [localSlots])

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["timetable"] })
  }

  const refresh = () => {
    invalidate()
  }

  const dayStartMin = dayStartHour * 60
  const daySpanMin = (dayEndHour - dayStartHour) * 60
  const columnHeight = (daySpanMin / 60) * hourPx + totalExtra

  // ── Conflict preview (debounced, same backend check as save) ─────
  const pendingCheckRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!drag || drag.mode === "create") return
    const { courseOfferingId, day, startMin, endMin } = drag
    if (pendingCheckRef.current) clearTimeout(pendingCheckRef.current)
    pendingCheckRef.current = setTimeout(async () => {
      setConflictChecking(true)
      try {
        const result = await checkTimetableConflict({
          courseOfferingId,
          day,
          start: fromMinutes(startMin),
          end: fromMinutes(endMin),
          excludeSlotId: drag.mode === "resize" || drag.mode === "move" ? drag.slotId : undefined,
        })
        setConflict(result.conflict)
      } catch {
        setConflict(null)
      } finally {
        setConflictChecking(false)
      }
    }, 300)
    return () => {
      if (pendingCheckRef.current) clearTimeout(pendingCheckRef.current)
    }
  }, [drag])

  // ── Drag lifecycle ───────────────────────────────────────────────
  const dragStartSlot = (
    e: React.PointerEvent,
    slot: TimetableSlotWithOffering,
    resize = false,
  ) => {
    if (!editable) return
    e.stopPropagation()
    e.preventDefault()
    setConflict(null)
    const startMin = toMinutes(slot.startTime)
    const endMin = toMinutes(slot.endTime)
    setDrag(
      resize
        ? {
            mode: "resize",
            slotId: slot.id,
            courseOfferingId: slot.courseOfferingId,
            day: slot.dayOfWeek,
            startMin,
            endMin,
            originEnd: endMin,
          }
        : {
            mode: "move",
            slotId: slot.id,
            courseOfferingId: slot.courseOfferingId,
            day: slot.dayOfWeek,
            startMin,
            endMin,
            originDay: slot.dayOfWeek,
            originStart: startMin,
            originEnd: endMin,
          },
    )
  }

  async function commitMove(d: Extract<DragState, { mode: "move" }>) {
    try {
      await updateTimetableSlot(d.slotId, {
        dayOfWeek: d.day,
        startTime: fromMinutes(d.startMin),
        endTime: fromMinutes(d.endMin),
      })
      setLocalSlots((prev) =>
        prev.map((s) =>
          s.id === d.slotId
            ? {
                ...s,
                dayOfWeek: d.day,
                startTime: fromMinutes(d.startMin),
                endTime: fromMinutes(d.endMin),
              }
            : s,
        ),
      )
      toast.success("Slot moved")
      refresh()
    } catch (err) {
      toast.error(getErrorMessage(err))
      setLocalSlots(slots)
    }
  }

  async function commitResize(d: Extract<DragState, { mode: "resize" }>) {
    try {
      await updateTimetableSlot(d.slotId, {
        endTime: fromMinutes(d.endMin),
      })
      setLocalSlots((prev) =>
        prev.map((s) => (s.id === d.slotId ? { ...s, endTime: fromMinutes(d.endMin) } : s)),
      )
      toast.success("Slot updated")
      refresh()
    } catch (err) {
      toast.error(getErrorMessage(err))
      setLocalSlots(slots)
    }
  }

  useEffect(() => {
    if (!drag) return

    const onPointerMove = (e: PointerEvent) => {
      const body = bodyRef.current
      if (!body) return
      const rect = body.getBoundingClientRect()
      const pointerMin = timeFromEvent(rect, e.clientY, dayStartMin, daySpanMin)
      const columns = body.querySelectorAll<HTMLElement>("[data-day]")
      let hoveredDay = drag.day
      for (const col of columns) {
        const r = col.getBoundingClientRect()
        if (e.clientX >= r.left && e.clientX <= r.right) {
          hoveredDay = col.dataset.day as DayOfWeek
          break
        }
      }

      setDrag((prev) => {
        if (!prev) return prev
        if (prev.mode === "move") {
          const dur = prev.originEnd - prev.originStart
          const start = pointerMin
          return { ...prev, day: hoveredDay, startMin: start, endMin: start + dur }
        }
        if (prev.mode === "resize") {
          const end = Math.max(pointerMin, prev.startMin + MIN_CREATE_MIN)
          return { ...prev, day: hoveredDay, endMin: end }
        }
        const start = prev.startMin
        const end = Math.max(pointerMin, start + MIN_CREATE_MIN)
        return { ...prev, day: hoveredDay, endMin: end }
      })
    }

    const onPointerUp = () => {
      setDrag((prev) => {
        if (!prev) return prev
        if (prev.mode === "create") {
          const duration = prev.endMin - prev.startMin
          if (duration >= MIN_CREATE_MIN) {
            const body = bodyRef.current?.getBoundingClientRect()
            const x = Math.min(Math.max((body?.right ?? 0) - 320, 12), window.innerWidth - 340)
            const y = Math.min(Math.max((body?.top ?? 0) + 40, 12), window.innerHeight - 320)
            setPopover({
              x,
              y,
              day: prev.day,
              startMin: prev.startMin,
              endMin: prev.endMin,
            })
          }
          return null
        }
        if (prev.mode === "move") {
          void commitMove(prev)
          return null
        }
        void commitResize(prev)
        return null
      })
    }

    window.addEventListener("pointermove", onPointerMove)
    window.addEventListener("pointerup", onPointerUp)
    return () => {
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerup", onPointerUp)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag !== null])

  const createMutation = useMutation({
    mutationFn: createTimetableSlot,
    onSuccess: () => {
      toast.success("Slot added")
      setPopover(null)
      refresh()
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteTimetableSlot,
    onSuccess: () => {
      toast.success("Slot deleted")
      refresh()
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const handleDelete = (e: React.MouseEvent, slotId: string) => {
    e.stopPropagation()
    e.preventDefault()
    if (!window.confirm("Delete this timetable slot?")) return
    deleteMutation.mutate(slotId)
  }

  // ── Side-by-side layout for overlapping slots ─────────────────────
  // Classic calendar-column algorithm: overlapping slots in the same day
  // share the column width (split evenly, with a small horizontal gap)
  // instead of stacking directly on top of each other.
  type ColLayout = { col: number; cols: number }
  const layoutDaySlots = (daySlots: TimetableSlotWithOffering[]): Map<string, ColLayout> => {
    const sorted = [...daySlots].sort(
      (a, b) => toMinutes(a.startTime) - toMinutes(b.startTime) || toMinutes(a.endTime) - toMinutes(b.endTime),
    )
    const result = new Map<string, ColLayout>()
    let clusterSlots: TimetableSlotWithOffering[] = []
    let clusterEnd = -Infinity
    let columnsEnd: number[] = []
    let colAssign = new Map<string, number>()

    const flushCluster = () => {
      if (clusterSlots.length === 0) return
      const cols = columnsEnd.length
      for (const s of clusterSlots) {
        result.set(s.id, { col: colAssign.get(s.id)!, cols })
      }
      clusterSlots = []
      columnsEnd = []
      colAssign = new Map()
    }

    for (const s of sorted) {
      const start = toMinutes(s.startTime)
      const end = toMinutes(s.endTime)
      if (start >= clusterEnd) {
        flushCluster()
        clusterEnd = end
      } else {
        clusterEnd = Math.max(clusterEnd, end)
      }
      let placed = false
      for (let i = 0; i < columnsEnd.length; i++) {
        if (columnsEnd[i] <= start) {
          columnsEnd[i] = end
          colAssign.set(s.id, i)
          placed = true
          break
        }
      }
      if (!placed) {
        columnsEnd.push(end)
        colAssign.set(s.id, columnsEnd.length - 1)
      }
      clusterSlots.push(s)
    }
    flushCluster()
    return result
  }

  // ── Rendering helpers ────────────────────────────────────────────
  const renderBlock = (
    slot: TimetableSlotWithOffering,
    overrides?: { startMin?: number; endMin?: number },
    ghost?: boolean,
    layout?: ColLayout,
  ) => {
    const startMin = overrides?.startMin ?? toMinutes(slot.startTime)
    const endMin = overrides?.endMin ?? toMinutes(slot.endTime)
    const top = adjustedTop(startMin)
    const slotHeight = ((endMin - startMin) / 60) * hourPx
    const color = colorForTag(slot.courseOffering.course.colorTag)
    const isConflict = ghost && conflict !== null
    // Small visual gap so back-to-back slots never look glued together.
    const GAP = 8
    const H_GAP = 6
    const rawHeight = Math.max(hourPx / 2, slotHeight)
    const horizontal: React.CSSProperties =
      layout && layout.cols > 1
        ? {
            left: `calc(${(layout.col / layout.cols) * 100}% + ${H_GAP / 2}px)`,
            width: `calc(${(1 / layout.cols) * 100}% - ${H_GAP}px)`,
          }
        : {}
    const style: React.CSSProperties = ghost
      ? {
          top: Math.max(0, top) + GAP / 2,
          minHeight: Math.max(rawHeight - GAP, HOUR_PX / 2 - GAP),
          background: isConflict ? "#ffdad6" : color.tint,
          borderColor: isConflict ? "#ef4444" : color.solid,
          color: isConflict ? "#93000a" : color.solid,
          ...horizontal,
        }
      : {
          top: top + GAP / 2,
          minHeight: Math.max(rawHeight - GAP, HOUR_PX / 2 - GAP),
          background: color.tint,
          borderColor: color.solid,
          color: color.solid,
          ...horizontal,
        }

    return (
      <div
        key={slot.id}
        ref={(el) => {
          if (ghost) return
          if (el) slotRefs.current.set(slot.id, el)
          else slotRefs.current.delete(slot.id)
        }}
        className={cn(
          "absolute rounded-md border-l-[3px] px-2.5 py-1.5 select-none z-10",
          ghost && "left-1 right-1",
          editable && !ghost && "left-1 right-1 cursor-grab active:cursor-grabbing group shadow-sm hover:shadow-md transition-shadow",
          !editable && "left-0 right-0",
        )}
        style={style}
        onPointerDown={
          editable && !ghost
            ? (e) => dragStartSlot(e, slot)
            : undefined
        }
        onMouseEnter={(e) => {
          if (editable || ghost) return
          setTooltip({
            x: e.clientX,
            y: e.clientY,
            slot,
          })
        }}
        onMouseLeave={() => setTooltip(null)}
      >
        <p className={cn(
          "font-label-sm text-[11px] font-semibold leading-[14px] break-words",
          editable && !ghost && "pr-4",
        )}>
          {slot.courseOffering.course.name}
        </p>
        <p className="font-label-sm text-[10px] opacity-80 leading-[13px] break-words mt-0.5">
          {fmtTimeRange(slot.startTime, slot.endTime)}
        </p>
        {(slot.room || showSection) && (
          <p className="font-label-sm text-[10px] opacity-70 break-words leading-[13px] mt-0.5">
            {[showSection ? slot.courseOffering.section.name : null, slot.room]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}
        {editable && !ghost && (
          <>
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => handleDelete(e, slot.id)}
              className="absolute top-1 right-1 hidden group-hover:flex items-center justify-center w-5 h-5 rounded-md hover:bg-black/10 text-[11px] leading-none"
              aria-label="Delete slot"
            >
              ✕
            </button>
            <div
              onPointerDown={(e) => dragStartSlot(e, slot, true)}
              className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize rounded-b-md bg-black/5 opacity-0 group-hover:opacity-100 hover:bg-black/15 transition-opacity"
            />
          </>
        )}
      </div>
    )
  }

  const renderGhost = () => {
    if (!drag) return null
    const base = drag.mode === "create" ? null : slotById.get(drag.slotId)
    const dummy: TimetableSlotWithOffering =
      base ??
      ({
        id: "ghost",
        courseOfferingId: drag.mode === "create" ? "pending" : drag.courseOfferingId,
        organizationId: "",
        dayOfWeek: drag.day,
        startTime: "",
        endTime: "",
        room: null,
        createdAt: "",
        courseOffering: {
          id: drag.mode === "create" ? "pending" : drag.courseOfferingId,
          courseId: "",
          sectionId: "",
          teacherId: "",
          course: { id: "", name: "New class", colorTag: null },
          section: { id: "", name: "", gradeLevelId: "" },
          teacher: { id: "", name: "" },
        },
      } satisfies TimetableSlotWithOffering)

    return renderBlock(dummy, { startMin: drag.startMin, endMin: drag.endMin }, true)
  }

  const hours = Array.from(
    { length: dayEndHour - dayStartHour },
    (_, i) => dayStartHour + i,
  )

  if (mobile) {
    return (
      <div className={cn("rounded-xl border border-border bg-surface-container-lowest", className)}>
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
          <button
            type="button"
            className="w-8 h-8 rounded-lg hover:bg-surface-container flex items-center justify-center text-on-surface-variant"
            onClick={() => {
              const idx = days.indexOf(mobileDay)
              setMobileDay(days[(idx - 1 + days.length) % days.length])
            }}
            aria-label="Previous day"
          >
            ←
          </button>
          <p className="font-label-md text-label-md text-on-surface font-medium">{mobileDay}</p>
          <button
            type="button"
            className="w-8 h-8 rounded-lg hover:bg-surface-container flex items-center justify-center text-on-surface-variant"
            onClick={() => {
              const idx = days.indexOf(mobileDay)
              setMobileDay(days[(idx + 1) % days.length])
            }}
            aria-label="Next day"
          >
            →
          </button>
        </div>
        <div className="divide-y divide-outline-variant">
          {localSlots
            .filter((s) => s.dayOfWeek === mobileDay)
            .sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime))
            .map((s) => {
              const color = colorForTag(s.courseOffering.course.colorTag)
              return (
                <div key={s.id} className="px-3 py-2.5 flex items-center gap-3">
                  <span
                    className="w-1.5 self-stretch rounded-full shrink-0"
                    style={{ background: color.solid }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-label-md text-label-md text-on-surface font-medium truncate">
                      {s.courseOffering.course.name}
                    </p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant truncate">
                      {fmtTimeRange(s.startTime, s.endTime)}
                      {s.room ? ` · ${s.room}` : ""}
                      {showSection ? ` · ${s.courseOffering.section.name}` : ""}
                    </p>
                  </div>
                  {!editable && (
                    <p className="font-label-sm text-label-sm text-on-surface-variant shrink-0">
                      {s.courseOffering.teacher.name}
                    </p>
                  )}
                </div>
              )
            })}
          {localSlots.filter((s) => s.dayOfWeek === mobileDay).length === 0 && (
            <p className="px-3 py-6 text-center font-body-md text-body-md text-on-surface-variant">
              {editable ? "No classes scheduled — switch days or use the desktop grid." : "No classes scheduled"}
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative rounded-xl border border-border bg-surface-container-lowest",
        editable && "touch-none select-none",
        fillHeight && "h-full",
        className,
      )}
    >
      <div style={{ minWidth: GRID_GUTTER + days.length * 140 }}>
        {/* Header */}
        <div
          data-grid-header
          className="grid border-b border-border sticky top-0 z-30 bg-surface-container-lowest"
          style={{ gridTemplateColumns: `${GRID_GUTTER}px repeat(${days.length}, 1fr)` }}
        >
          <div className="border-r border-border" />
          {days.map((day) => (
            <div
              key={day}
              className={cn(
                "px-2 py-3 text-center border-r border-border last:border-r-0",
                showNowIndicator && isToday(day) && "bg-primary/5",
              )}
            >
              <p className="font-label-md text-label-md text-on-surface font-medium tracking-wide">
                {day.charAt(0) + day.slice(1).toLowerCase().slice(0, 2)}
              </p>
            </div>
          ))}
        </div>

        {/* Body */}
        <div
          ref={bodyRef}
          className="relative grid"
          style={{
            gridTemplateColumns: `${GRID_GUTTER}px repeat(${days.length}, 1fr)`,
            height: columnHeight,
          }}
          onPointerDown={(e) => {
            const target = e.target as HTMLElement
            const col = target.closest<HTMLElement>("[data-day]")
            if (!col || !editable) return
            const day = col.dataset.day as DayOfWeek
            const body = bodyRef.current
            if (!body) return
            const rect = body.getBoundingClientRect()
            const startMin = timeFromEvent(rect, e.clientY, dayStartMin, daySpanMin)
            setDrag({ mode: "create", day, startMin, endMin: startMin + 60 })
          }}
        >
          {/* Time gutter */}
          <div className="relative border-r border-border sticky left-0  z-20 bg-surface-container-lowest">
            {hours.map((hour) => (
              <div
                key={hour}
                className="absolute right-2.5 pl-2 -translate-y-1/2 font-label-sm text-label-sm text-on-surface-variant"
                style={{ top: adjustedTop(hour * 60) }}
              >
                {fmtTime(`${String(hour).padStart(2, "0")}:00`)}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day) => {
            const daySlots = localSlots
              .filter((s) => s.dayOfWeek === day)
              .sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime))
            const dayLayout = layoutDaySlots(daySlots)
            return (
              <div
                key={day}
                data-day={day}
                className={cn(
                  "relative border-r border-border last:border-r-0",
                  showNowIndicator && isToday(day) && "bg-primary/5",
                )}
              >
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="absolute left-0 right-0 border-t border-outline-variant/40 pointer-events-none"
                    style={{ top: adjustedTop(hour * 60) }}
                  />
                ))}

                {daySlots.map((s) => renderBlock(s, undefined, false, dayLayout.get(s.id)))}

                {/* Ghost block during drag */}
                {drag && drag.day === day && renderGhost()}

                {/* Empty-state hint (first column only) */}
                {localSlots.length === 0 && day === days[0] && (
                  <div className="absolute inset-x-3 top-1/2 -translate-y-1/2 border border-dashed border-outline-variant/70 rounded-lg px-3 py-4 text-center">
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      {editable ? "Click and drag to add a class" : "No classes scheduled"}
                    </p>
                  </div>
                )}

                {/* Conflict message during drag */}
                {drag && drag.day === day && conflict && (
                  <div className="absolute bottom-1 left-1 right-1 z-30 bg-error-container text-on-error-container rounded-md px-2 py-1 font-label-sm text-label-sm">
                    {conflict.kind === "teacher"
                      ? `Teacher busy: ${conflict.conflictingSlot.courseName} (${fmtTimeRange(
                          conflict.conflictingSlot.startTime,
                          conflict.conflictingSlot.endTime,
                        )})`
                      : `Section busy: ${conflict.conflictingSlot.courseName} (${fmtTimeRange(
                          conflict.conflictingSlot.startTime,
                          conflict.conflictingSlot.endTime,
                        )})`}
                  </div>
                )}
              </div>
            )
          })}

          {conflictChecking && drag && (
            <div className="absolute right-2 top-1 z-40 flex items-center gap-1.5 bg-surface-container px-2 py-1 rounded-md shadow-sm font-label-sm text-label-sm text-on-surface-variant">
              <span className="w-3 h-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              Checking…
            </div>
          )}
        </div>
      </div>

      {/* Create popover */}
      {popover && editable && (
        <CreatePopover
          x={popover.x}
          y={popover.y}
          day={popover.day}
          startMin={popover.startMin}
          endMin={popover.endMin}
          offerings={offerings}
          sectionId={sectionId}
          submitting={createMutation.isPending}
          onCancel={() => setPopover(null)}
          onConfirm={(offeringId, room) => {
            createMutation.mutate({
              courseOfferingId: offeringId,
              dayOfWeek: popover.day,
              startTime: fromMinutes(popover.startMin),
              endTime: fromMinutes(popover.endMin),
              room: room.trim() || undefined,
            })
          }}
        />
      )}

      {/* Hover tooltip (read-only) */}
      {tooltip && !editable && (
        <div
          className="fixed z-50 pointer-events-none rounded-lg bg-surface-container-high text-on-surface px-3 py-2 shadow-md font-label-sm text-label-sm max-w-56"
          style={{ left: Math.min(tooltip.x + 12, window.innerWidth - 200), top: tooltip.y + 14 }}
        >
          <p className="font-semibold truncate">{tooltip.slot.courseOffering.course.name}</p>
          {tooltip.slot.courseOffering.teacher?.name && (
            <p className="text-on-surface-variant truncate">{tooltip.slot.courseOffering.teacher.name}</p>
          )}
          {tooltip.slot.room && <p className="text-on-surface-variant truncate">Room {tooltip.slot.room}</p>}
        </div>
      )}
    </div>
  )
}

// ── Create popover (anchored at the drop position) ─────────────────

function CreatePopover({
  x,
  y,
  day,
  startMin,
  endMin,
  offerings,
  sectionId,
  submitting,
  onCancel,
  onConfirm,
}: {
  x: number
  y: number
  day: DayOfWeek
  startMin: number
  endMin: number
  offerings: CourseOffering[]
  sectionId?: string
  submitting: boolean
  onCancel: () => void
  onConfirm: (offeringId: string, room: string) => void
}) {
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<string>("")
  const [room, setRoom] = useState("")

  const q = query.trim().toLowerCase()
  const filtered = offerings.filter(
    (o) =>
      (!sectionId || o.section.id === sectionId) &&
      (o.course.name.toLowerCase().includes(q) ||
        o.section.name.toLowerCase().includes(q) ||
        (o.teacher?.name ?? "").toLowerCase().includes(q)),
  )

  const effectiveSelected = selected || (filtered.length === 1 ? filtered[0].id : "")

  return (
    <div
      className="fixed z-50 w-80 rounded-xl border border-border bg-surface-container-lowest shadow-xl p-3"
      style={{ left: x, top: y }}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="font-label-md text-label-md text-on-surface font-medium">Add class</p>
        <p className="font-label-sm text-label-sm text-on-surface-variant">
          {day} · {fmtTimeRange(fromMinutes(startMin), fromMinutes(endMin))}
        </p>
      </div>

      <div className="relative mb-2">
        <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[16px] text-outline pointer-events-none">
          search
        </span>
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search courses…"
          className="w-full pl-8 pr-3 py-1.5 border border-outline-variant rounded-md text-sm font-body-md bg-surface-container-low focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="max-h-40 overflow-y-auto space-y-1 mb-2">
        {filtered.length === 0 && (
          <p className="text-sm text-on-surface-variant font-body-md py-2 text-center">
            {sectionId
              ? "No course offerings for this section — create them in Grade Management."
              : "No course offerings match"}
          </p>
        )}
        {filtered.map((o) => {
          const color = colorForTag(o.course.colorTag)
          const active = effectiveSelected === o.id
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => setSelected(o.id)}
              className={cn(
                "w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-md text-sm font-body-md transition-colors",
                active ? "bg-primary/10 ring-1 ring-primary" : "hover:bg-surface-container",
              )}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: color.solid }}
              />
              <span className="min-w-0">
                <span className="block font-medium text-on-surface truncate">{o.course.name}</span>
                <span className="block text-on-surface-variant truncate">
                  {o.section.name}
                  {o.teacher?.name ? ` · ${o.teacher.name}` : ""}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      <input
        value={room}
        onChange={(e) => setRoom(e.target.value)}
        placeholder="Room (optional)"
        className="w-full px-3 py-1.5 border border-outline-variant rounded-md text-sm font-body-md bg-surface-container-low focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary mb-3"
      />

      <div className="flex items-center gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="px-3 py-1.5 rounded-md font-label-sm text-sm text-on-surface-variant hover:bg-surface-container transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!effectiveSelected || submitting}
          onClick={() => effectiveSelected && onConfirm(effectiveSelected, room)}
          className="px-4 py-1.5 rounded-md bg-primary text-primary-foreground font-label-sm text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {submitting ? "Adding…" : "Add slot"}
        </button>
      </div>
    </div>
  )
}