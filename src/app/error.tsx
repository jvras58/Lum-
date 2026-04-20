"use client"

import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(JSON.stringify({ level: "error", source: "GlobalErrorBoundary", error: error.message, digest: error.digest }))
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <h2 className="text-xl font-semibold">Algo deu errado</h2>
      <p className="text-muted-foreground text-sm">{error.message}</p>
      <button
        className="px-4 py-2 rounded bg-primary text-primary-foreground text-sm"
        onClick={reset}
      >
        Tentar novamente
      </button>
    </div>
  )
}
