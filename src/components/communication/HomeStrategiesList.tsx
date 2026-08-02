interface HomeStrategiesListProps {
  strategies: string[]
}

export function HomeStrategiesList({ strategies }: HomeStrategiesListProps) {
  if (strategies.length === 0) return null

  return (
    <div className="rounded-[24px] bg-white border border-outline-variant/10 shadow-sm p-md">
      <h2 className="font-headline-md text-headline-md text-primary mb-3">Things You Can Do at Home</h2>
      <ol className="space-y-3">
        {strategies.map((strategy, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-primary-container text-white flex items-center justify-center text-label-sm font-bold shrink-0 mt-0.5">
              {i + 1}
            </span>
            <p className="font-body-md text-body-md text-on-surface pt-0.5">{strategy}</p>
          </li>
        ))}
      </ol>
    </div>
  )
}
