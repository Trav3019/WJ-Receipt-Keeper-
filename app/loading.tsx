export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-40 bg-stone-200 rounded" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card h-24 bg-stone-100" />
        ))}
      </div>
      <div className="card h-48 bg-stone-100" />
    </div>
  )
}
