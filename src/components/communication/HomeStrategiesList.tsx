interface HomeStrategiesListProps {
 strategies: string[]
}

export function HomeStrategiesList({ strategies }: HomeStrategiesListProps) {
 if (strategies.length === 0) return null

 return (
  <div className="rounded-lg bg-surface-container-lowest border border-border p-md">
   <h2 className="font-headline-md text-headline-md text-primary mb-3">Things You Can Do at Home</h2>
   <ol className="space-y-3">
    {strategies.map((strategy, i) => (
     <li key={i} className="flex items-start gap-3">
      <span className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-label-sm font-bold shrink-0 mt-0.5">
       {i + 1}
      </span>
      <p className="font-body-md text-body-md text-on-surface pt-0.5 leading-relaxed">{strategy}</p>
     </li>
    ))}
   </ol>
  </div>
 )
}