import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Link } from "react-router-dom"

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-lg">
      <div>
        <p className="font-label-md text-label-md uppercase tracking-[0.2em] text-primary">Preview</p>
        <h2 className="font-headline-lg text-headline-lg">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function Swatch({ label, className, text }: { label: string; className: string; text?: string }) {
  return (
    <div className="flex flex-col items-center gap-sm">
      <div className={`h-14 w-20 rounded-xl border border-outline-variant ${className}`} />
      <p className="font-label-sm text-label-sm text-on-surface-variant">{label}</p>
      {text && <p className="font-label-sm text-label-sm text-on-surface-variant/70">{text}</p>}
    </div>
  )
}

const DATA_VIZ = ["bg-[#db2777]", "bg-[#0ea5e9]", "bg-[#f59e0b]", "bg-[#10b981]", "bg-[#8b5cf6]", "bg-[#f43f5e]", "bg-[#38bdf8]", "bg-[#f97316]"]

const CRAYONS = [
  { name: "Magenta", className: "bg-[#db2777]" },
  { name: "Sky", className: "bg-[#0ea5e9]" },
  { name: "Sunshine", className: "bg-[#f59e0b]" },
  { name: "Mint", className: "bg-[#10b981]" },
  { name: "Violet", className: "bg-[#8b5cf6]" },
  { name: "Coral", className: "bg-[#f43f5e]" },
  { name: "Light sky", className: "bg-[#38bdf8]" },
  { name: "Orange", className: "bg-[#f97316]" },
]

function Chip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${className ?? "bg-surface-container text-on-surface-variant"}`}>
      {children}
    </span>
  )
}

export function DesignPreviewPage() {
  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="mb-12 flex items-center justify-between">
          <div>
            <p className="font-label-md text-label-md uppercase tracking-[0.2em] text-primary">EduAI Playground</p>
            <h1 className="font-headline-xl text-headline-xl">Crayon Box · Design System</h1>
            <p className="mt-2 max-w-2xl text-body-md text-on-surface-variant">
              Schoolish two-tone theme — magenta primary + sky secondary, crayon accents on a clean warm page.
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/" className="gap-sm">
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Back to landing
            </Link>
          </Button>
        </div>

        <div className="space-y-16">
          <Section title="Colors">
            <div className="flex flex-wrap gap-lg">
              <Swatch label="Primary" className="bg-primary" text="#db2777" />
              <Swatch label="Primary container" className="bg-primary-container" text="#fce7f3" />
              <Swatch label="Secondary" className="bg-secondary" text="#0284c7" />
              <Swatch label="Tertiary" className="bg-tertiary" text="#d97706" />
              <Swatch label="Surface" className="bg-surface border" text="#fff8fb" />
              <Swatch label="Card" className="bg-card border" text="#ffffff" />
              <Swatch label="Container low" className="bg-surface-container-low border" text="#fdf2f8" />
              <Swatch label="Container" className="bg-surface-container border" text="#fbe7f2" />
              <Swatch label="Inverse" className="bg-inverse-surface" text="#4a0d3f" />
            </div>

            <div className="flex flex-wrap gap-lg">
              <Swatch label="Success" className="bg-success" text="#16a34a" />
              <Swatch label="Warning" className="bg-[#d97706]" text="#d97706" />
              <Swatch label="Error" className="bg-error" text="#e11d48" />
            </div>

            <p className="font-label-md text-label-md text-on-surface-variant">Crayon box</p>
            <div className="flex flex-wrap items-center gap-lg">
              {CRAYONS.map((c) => (
                <div key={c.name} className="flex flex-col items-center gap-sm">
                  <div className={`h-10 w-10 rounded-full shadow-[0_2px_8px_rgba(53,18,43,0.15)] ${c.className}`} />
                  <p className="font-label-sm text-label-sm text-on-surface-variant">{c.name}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-end gap-lg">
              {DATA_VIZ.map((c) => (
                <div key={c} className={`h-8 w-8 rounded-lg ${c}`} />
              ))}
              <p className="font-body-sm text-body-sm text-on-surface-variant">Data-viz palette (labels always shown on charts)</p>
            </div>
          </Section>

          <Section title="Typography">
            <div className="space-y-4 rounded-2xl border border-outline-variant bg-card p-8">
              <p className="font-headline-xl text-headline-xl">Headline XL — Quicksand 700</p>
              <p className="font-headline-lg text-headline-lg">Headline LG — Quicksand 700</p>
              <p className="font-headline-md text-headline-md">Headline MD — Quicksand 700</p>
              <p className="font-headline-sm text-headline-sm">Headline SM — Quicksand 700</p>
              <p className="font-body-lg text-body-lg">Body LG — Inter 400. Dense data stays scannable.</p>
              <p className="font-body-md text-body-md">Body MD — Inter 400. The default for forms and paragraphs.</p>
              <p className="font-label-md text-label-md uppercase">Label MD — Inter 600 · 0.02em tracking</p>
              <p className="font-label-sm text-label-sm">Label SM — Inter 500 · table subtitles & metadata</p>
            </div>
          </Section>

          <Section title="Buttons">
            <div className="flex flex-wrap items-center gap-md">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="link">Link</Button>
            </div>
            <div className="flex flex-wrap items-center gap-md">
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
              <Button size="icon" aria-label="icon">
                <span className="material-symbols-outlined text-[18px]">add</span>
              </Button>
            </div>
          </Section>

          <Section title="Cards">
            <div className="grid gap-lg md:grid-cols-3">
              <Card>
                <CardContent className="p-6">
                  <p className="font-label-md text-label-md text-on-surface-variant">Attendance rate</p>
                  <p className="font-headline-lg text-headline-lg">94.2%</p>
                  <Chip className="bg-[#dcfce7] text-[#14532d]">▲ 2.1% this week</Chip>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="font-label-md text-label-md text-on-surface-variant">AI insights</p>
                  <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
                    Trend suggests review for Amina — submissions dipping over 3 weeks.
                  </p>
                  <Button variant="outline" size="sm" className="mt-4">
                    Ask AI
                  </Button>
                </CardContent>
              </Card>
              <Card className="bg-primary text-primary-foreground">
                <CardContent className="p-6">
                  <p className="font-label-md text-label-md opacity-80">Highlighted card</p>
                  <p className="mt-1 font-headline-lg text-headline-lg">Magenta container</p>
                  <p className="mt-1 font-body-sm text-body-sm opacity-90">Rounded-2xl with a soft colored shadow.</p>
                </CardContent>
              </Card>
            </div>
          </Section>

          <Section title="Forms">
            <div className="grid max-w-2xl gap-lg">
              <Input placeholder="Student name" />
              <Select>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="math">Math 7A</SelectItem>
                  <SelectItem value="science">Science 8B</SelectItem>
                  <SelectItem value="lit">Literature 9C</SelectItem>
                </SelectContent>
              </Select>
              <Textarea placeholder="Add a note for the guardian…" />
            </div>
          </Section>

          <Section title="Sticker chips & badges">
            <div className="flex flex-wrap items-center gap-md">
              <Chip className="bg-primary text-on-primary">Active</Chip>
              <Chip className="bg-secondary-container text-on-secondary-container">Info</Chip>
              <Chip className="bg-[#dcfce7] text-[#14532d]">Passed</Chip>
              <Chip className="bg-tertiary-container text-on-tertiary-container">In progress</Chip>
              <Chip className="bg-error-container text-on-error-container">At risk</Chip>
              <Chip className="bg-primary-container text-on-primary-container">AI</Chip>
              <Badge>Badge</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
            </div>
          </Section>

          <Section title="Mock dashboard row">
            <div className="space-y-lg">
              <div className="grid gap-lg md:grid-cols-4">
                {[
                  { label: "Students", value: "128", icon: "groups", chip: "▲ 4", tile: "bg-primary-container text-on-primary-container" },
                  { label: "Submissions", value: "342", icon: "assignment", chip: "▲ 12%", tile: "bg-secondary-container text-on-secondary-container" },
                  { label: "Alerts", value: "6", icon: "notifications", chip: "Review", chipTone: "bg-tertiary-container text-on-tertiary-container", tile: "bg-[#fef3c7] text-[#78350f]" },
                  { label: "Avg grade", value: "87%", icon: "grade", chip: "▲ 1.5%", tile: "bg-[#dcfce7] text-[#14532d]" },
                ].map((s) => (
                  <Card key={s.label}>
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <p className="font-label-md text-label-md text-on-surface-variant">{s.label}</p>
                        <span className={`material-symbols-outlined flex h-7 w-7 items-center justify-center rounded-xl text-[16px] ${s.tile}`}>
                          {s.icon}
                        </span>
                      </div>
                      <p className="mt-2 font-headline-lg text-headline-lg">{s.value}</p>
                      <Chip className={`mt-2 ${s.chipTone ?? "bg-surface-container text-on-surface-variant"}`}>{s.chip}</Chip>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card>
                <div className="divide-y divide-outline-variant">
                  {[
                    { name: "Amina Hassan", cls: "Math 7A", status: "At risk", tone: "bg-error-container text-on-error-container" },
                    { name: "Omar Khalil", cls: "Science 8B", status: "Passed", tone: "bg-[#dcfce7] text-[#14532d]" },
                    { name: "Lina Mahmoud", cls: "Literature 9C", status: "In progress", tone: "bg-tertiary-container text-on-tertiary-container" },
                  ].map((r) => (
                    <div key={r.name} className="flex items-center justify-between gap-4 p-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-container font-label-sm text-label-sm text-on-primary-container">
                          {r.name.split(" ").map((p) => p[0]).join("")}
                        </span>
                        <div>
                          <p className="font-body-md text-body-md font-semibold">{r.name}</p>
                          <p className="font-label-sm text-label-sm text-on-surface-variant">{r.cls}</p>
                        </div>
                      </div>
                      <Chip className={r.tone}>{r.status}</Chip>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </Section>

          <Section title="Lines & separators">
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Cards are anchored with visible 1px outlines. Stacked content gets hairline dividers, section headers get a bottom rule, and connected panels get vertical separators.
            </p>

            <div className="space-y-lg">
              <Card className="overflow-hidden">
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                  <p className="font-label-md text-label-md uppercase tracking-wide text-on-surface-variant">Section header</p>
                  <Button variant="ghost" size="sm">Action</Button>
                </div>
                <div className="divide-y divide-border">
                  {[
                    { name: "Amina Hassan", value: "Math 7A", meta: "Homework · due Fri" },
                    { name: "Omar Khalil", value: "Science 8B", meta: "Quiz · graded" },
                    { name: "Lina Mahmoud", value: "Literature 9C", meta: "Essay · reviewing" },
                  ].map((r) => (
                    <div key={r.name} className="flex items-center justify-between gap-4 px-6 py-4">
                      <div>
                        <p className="font-body-md text-body-md font-semibold">{r.name}</p>
                        <p className="font-label-sm text-label-sm text-on-surface-variant">{r.meta}</p>
                      </div>
                      <Chip className="bg-surface-container text-on-surface-variant">{r.value}</Chip>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between border-t border-border bg-surface-container-low px-6 py-3">
                  <p className="font-label-sm text-label-sm text-on-surface-variant">Footer — connected by a top rule</p>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">3 items</p>
                </div>
              </Card>

              <Card className="overflow-hidden">
                <div className="grid divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                  {[
                    { label: "Attendance", value: "94.2%" },
                    { label: "Submissions", value: "342" },
                    { label: "Alerts", value: "6" },
                  ].map((s) => (
                    <div key={s.label} className="p-6">
                      <p className="font-label-md text-label-md text-on-surface-variant">{s.label}</p>
                      <p className="mt-1 font-headline-lg text-headline-lg">{s.value}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <div className="overflow-hidden rounded-2xl border border-border">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border bg-surface-container-low">
                      <th className="px-6 py-3 font-label-md text-label-md text-on-surface-variant">Student</th>
                      <th className="px-6 py-3 font-label-md text-label-md text-on-surface-variant">Grade</th>
                      <th className="px-6 py-3 font-label-md text-label-md text-on-surface-variant">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {[
                      { name: "Amina Hassan", grade: "A", status: "Passed", tone: "bg-[#dcfce7] text-[#14532d]" },
                      { name: "Omar Khalil", grade: "B+", status: "In progress", tone: "bg-tertiary-container text-on-tertiary-container" },
                      { name: "Lina Mahmoud", grade: "C", status: "At risk", tone: "bg-error-container text-on-error-container" },
                    ].map((r) => (
                      <tr key={r.name}>
                        <td className="px-6 py-3 font-body-md text-body-md">{r.name}</td>
                        <td className="px-6 py-3 font-body-md text-body-md">{r.grade}</td>
                        <td className="px-6 py-3">
                          <Chip className={r.tone}>{r.status}</Chip>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Section>

          <Section title="School supplies">
            <div className="space-y-lg">
              <div className="rounded-2xl border border-outline-variant bg-card p-8">
                <p className="font-headline-lg text-headline-lg">
                  Big wins deserve a{" "}
                  <span className="bg-[rgba(245,158,11,0.35)] px-1">highlighter</span>
                </p>
                <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
                  Key headlines get a warm 2px underline — the yellow highlighter stroke, used sparingly.
                </p>
              </div>

              <div className="grid gap-lg md:grid-cols-2">
                <Card>
                  <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
                    <span className="material-symbols-outlined flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-container text-[32px] text-on-primary-container">
                      edit_note
                    </span>
                    <p className="font-headline-md text-headline-md">No assignments yet</p>
                    <p className="max-w-xl font-body-sm text-body-sm text-on-surface-variant">
                      Doodle-style empty states with a crayon icon tile, a Quicksand title, and a quiet action.
                    </p>
                    <Button variant="outline" size="sm" className="mt-2">
                      Create assignment
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="flex items-start gap-4 p-6">
                    <span className="material-symbols-outlined flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary-container text-[20px] text-on-secondary-container">
                      school
                    </span>
                    <div>
                      <p className="font-headline-sm text-headline-sm">Notebook card</p>
                      <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
                        Icon tile + Quicksand title + Inter body — the two-tone (magenta + sky) working together.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </Section>

          <Section title="Rollback">
            <p className="max-w-2xl font-body-sm text-body-sm text-on-surface-variant">
              Don't like it? Revert with{" "}
              <code className="rounded bg-surface-container px-2 py-1 font-mono text-body-sm">
                git restore DESIGN.md src/index.css src/components/ui/
              </code>{" "}
              and delete this page + its route.
            </p>
          </Section>
        </div>
      </div>
    </div>
  )
}
