export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 w-36 bg-stone-200 rounded" />
        <div className="flex gap-2">
          <div className="h-9 w-32 bg-stone-200 rounded-lg" />
          <div className="h-9 w-24 bg-stone-200 rounded-lg" />
        </div>
      </div>
      {[...Array(2)].map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-14 bg-brand-200 rounded-lg" />
          <div className="card p-0 overflow-hidden">
            {[...Array(3)].map((_, j) => (
              <div key={j} className="h-14 border-b border-stone-100 bg-stone-50" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
