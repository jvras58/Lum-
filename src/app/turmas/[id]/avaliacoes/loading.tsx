export default function AvaliacoesLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-4 bg-muted rounded w-32" />
      <div>
        <div className="h-8 bg-muted rounded w-64 mb-2" />
        <div className="h-4 bg-muted rounded w-40" />
      </div>
      <div className="flex justify-end">
        <div className="h-9 bg-muted rounded w-20" />
      </div>
      <div className="border rounded-md overflow-hidden">
        <div className="h-12 bg-muted/50 border-b" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-14 border-b flex gap-3 items-center px-4">
            <div className="h-4 bg-muted rounded w-32" />
            {[1, 2, 3].map((j) => (
              <div key={j} className="h-8 bg-muted rounded w-24" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
