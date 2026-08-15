import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BackLink } from "@/components/shared/BackLink"

const SECTIONS = [
  {
    title: "1. Acceptance of terms",
    body: "By creating an EduAI account and using the service, you agree to these Terms of Service. If you are using EduAI on behalf of an educational institution, you confirm you have authority to accept these terms on its behalf.",
  },
  {
    title: "2. Accounts",
    body: "You are responsible for keeping your login credentials secure and for all activity under your account. You must be at least 13 years old to use EduAI. One person may hold one account.",
  },
  {
    title: "3. Acceptable use",
    body: "You agree not to misuse the service: no unauthorized access, scraping, reselling, reverse engineering, or uploading of illegal or infringing content. Teachers are responsible for obtaining consent before recording classes where required by law.",
  },
  {
    title: "4. Content you create",
    body: "You retain ownership of the classes, assignments, and materials you upload. You grant EduAI a limited license to host and process that content solely to operate the service (including transcripts and AI features).",
  },
  {
    title: "5. Subscriptions and payments",
    body: "Paid plans are billed in advance and renew automatically until cancelled. Contact sales@eduai.app for overage, trial, or cancellation questions.",
  },
  {
    title: "6. Availability and liability",
    body: "We aim for high availability but do not guarantee uninterrupted service. EduAI is not liable for indirect or consequential damages, and our total liability is limited to the amounts you paid in the prior 12 months.",
  },
  {
    title: "7. Changes to these terms",
    body: "We may update these terms from time to time. Material changes will be communicated in-app and via email at least 30 days before they take effect.",
  },
]

export function TermsPage() {
  return (
    <div className="p-xl max-w-3xl mx-auto w-full">
      <BackLink to="/" label="Back to home" className="mb-md" />
      <header className="mb-lg">
        <h1 className="font-headline-xl text-headline-xl text-on-surface mb-1">Terms of Service</h1>
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
