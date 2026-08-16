import register from "@/assets/register.jpg"

export function BrandingSection() {
 return (
  <section className="hidden md:flex md:w-1/2 bg-surface border-r border-border flex-col items-center p-margin-desktop">
   <div className="z-10 text-center">
    <span className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight">
     EduAI
    </span>
   </div>

   <div className="relative flex-1 flex flex-col items-center justify-center w-full">
    <div className="relative z-10 text-center w-[85%] max-w-2xl">
     <div className="mb-4 border border-border rounded-lg overflow-hidden bg-surface-container-lowest">
      <img
       alt="3D graduation cap resting on a stack of books"
       className="w-full h-auto object-contain"
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