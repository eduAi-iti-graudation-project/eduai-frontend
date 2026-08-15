import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BackLink } from "@/components/shared/BackLink"

const SECTIONS = [
  {
    title: "What we collect",
    body: "We collect the information you provide when you create an account (name, email, role), the classes and assignments you create, and meeting recordings and transcripts that you choose to record. We never sell your personal data.",
  },
  {
    title: "How we use it",
    body: "Your data powers the features you use: scheduling and joining live classes, grading submissions, generating transcripts, and surfacing learning insights on your dashboard.",
  },
  {
    title: "AI processing",
    body: "When you record a class or submit work, our AI services may process that content to produce transcripts and feedback. You can request deletion of recordings at any time.",
  },
  {
    title: "Storage & security",
    body: "Data is stored in encrypted, access-controlled infrastructure. Passwords are handled by our authentication provider and are never stored in plain text.",
  },
  {
    title: "Your rights",
    body: "You can access, correct, export, or delete your personal data at any time by contacting us at privacy@eduai.app.",
  },
]

export function PrivacyPage() {
  return (
    <div className="p-xl max-w-3xl mx-auto w-full">
      <BackLink to="/" label="Back to home" className="mb-md" />
      <header className="mb-lg">
        <h1 className="font-headline-xl text-headline-xl text-on-surface mb-1">Privacy Policy</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">Last updated: August 2026</p>
      </header>
      <div className="space-y-md">
        {SECTIONS.map((s) => (
          <Card key={s.title} className="border-border">
            <CardHeader>
              <CardTitle className="font-label-xl text-label-xl text-on-surface">{s.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-body-md text-body-md text-on-surface-variant">{s.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
