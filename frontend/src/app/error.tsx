"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Application error:", error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-primary)] p-6 text-center">
      <div className="max-w-md space-y-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          Something went wrong
        </h1>
        <p className="text-[var(--text-secondary)]">
          A client-side error occurred. Please try again.
        </p>
        <Button
          onClick={reset}
          className="bg-[var(--brand-primary)] text-black font-bold hover:opacity-90"
        >
          Try again
        </Button>
      </div>
    </div>
  )
}
