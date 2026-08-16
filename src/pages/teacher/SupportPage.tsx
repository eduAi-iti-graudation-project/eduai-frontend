import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const FAQS = [
 {
  question: "How do I schedule a live class meeting?",
  answer:
   "Open the Meetings page from the sidebar and click “Schedule”. Pick a class, a start and end time, and optionally enable recording — students in that class will see it in their own Meetings page.",
 },
 {
  question: "How do transcripts and recordings work?",
  answer:
   "Recordings only start when the host toggles “Record” during a live call. After the meeting ends, the recording is uploaded automatically and a transcript is generated — both appear on the meeting's detail page.",
 },
 {
  question: "How do I join a meeting?",
  answer:
   "Open the meeting from the Meetings page and click “Join”. You can pick your camera and microphone in the pre-call lobby. Make sure your browser has permission to use the microphone and camera.",
 },
 {
  question: "I forgot my password.",
  answer:
   "Click “Forgot password?” on the sign-in page, enter your email, and follow the reset link we send you.",
 },
 {
  question: "A feature I need is missing.",
  answer:
   "Report it below — include your role, what you were doing, and what you expected to happen. Screenshots help a lot.",
 },
]

export function SupportPage() {
 return (
  <div className="p-xl max-w-3xl mx-auto w-full">
   <header className="mb-lg">
    <h1 className="font-headline-xl text-headline-xl text-primary mb-1">Help Center</h1>
    <p className="font-body-md text-body-md text-on-surface-variant">
     Answers to common questions, and how to reach us.
    </p>
   </header>

   <Card className="border-border mb-lg">
    <CardHeader>
     <CardTitle className="font-label-xl text-label-xl text-on-surface">Frequently asked questions</CardTitle>
    </CardHeader>
    <CardContent className="divide-y divide-border">
     {FAQS.map((faq) => (
      <details key={faq.question} className="group py-3">
       <summary className="font-label-md text-label-md text-on-surface cursor-pointer list-none flex items-center justify-between gap-3">
        {faq.question}
        <span className="material-symbols-outlined text-on-surface-variant transition-transform group-open:rotate-180 shrink-0">
         expand_more
        </span>
       </summary>
       <p className="font-body-md text-body-md text-on-surface-variant pt-2">{faq.answer}</p>
      </details>
     ))}
    </CardContent>
   </Card>

   <Card className="border-border">
    <CardHeader>
     <CardTitle className="font-label-xl text-label-xl text-on-surface">Still stuck?</CardTitle>
    </CardHeader>
    <CardContent className="flex flex-col sm:flex-row gap-3">
     <Button asChild>
      <a href="mailto:support@eduai.app?subject=EduAI%20support%20request">
       <span className="material-symbols-outlined text-[18px] mr-1">mail</span>
       Email support
      </a>
     </Button>
     <Button variant="outline" asChild>
      <Link to="/forgot-password">
       <span className="material-symbols-outlined text-[18px] mr-1">lock_reset</span>
       Reset my password
      </Link>
     </Button>
    </CardContent>
   </Card>
  </div>
 )
}
