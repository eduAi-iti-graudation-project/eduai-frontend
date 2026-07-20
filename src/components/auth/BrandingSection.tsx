import register from "@/assets/register.jpg"
import { FloatingBadge } from "./FloatingBadge"

export function BrandingSection() {
  return (
    <section className="hidden md:flex md:w-1/2 bg-surface relative flex-col items-center p-margin-desktop overflow-hidden">
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary-fixed opacity-10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-secondary-fixed opacity-10 rounded-full blur-3xl pointer-events-none" />

      <div className="z-10 text-center">
        <span className="font-headline-lg text-headline-lg text-primary tracking-tight">
          EduAI
        </span>
      </div>

      <div className="relative flex-1 flex flex-col items-center justify-center w-full">
        <FloatingBadge
          icon="smart_toy"
          iconColor="text-primary-container"
          title="Assistant"
          subtitle="Ready to help"
          position="left"
        />
        <FloatingBadge
          icon="lightbulb"
          iconColor="text-tertiary-fixed-dim"
          title="Insight"
          subtitle="New suggestion"
          position="right"
        />

        <div className="relative z-10 text-center w-[85%] max-w-2xl">
          <div className="mb-4 shadow-2xl rounded-2xl overflow-hidden">
            <img
              alt="3D graduation cap resting on a stack of books"
              className="w-full h-auto object-contain drop-shadow-2xl"
              src={register}
            />
          </div>
          <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed text-balance ">
            Empowering education through artificial intelligence
          </p>
        </div>
      </div>

 
    </section>
  )
}
