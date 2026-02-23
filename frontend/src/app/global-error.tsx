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
    console.error("Global application error:", error)
  }, [error])

  return (
    <html lang="en">
      <body className="bg-[#0f0f0f] text-white min-h-screen flex flex-col items-center justify-center p-6 font-sans antialiased">
        <div className="max-w-md text-center space-y-6">
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <p className="text-gray-400">
            A critical error occurred. Please refresh the page to try again.
          </p>
          <button
            onClick={() => reset()}
            className="px-6 py-3 bg-[#FF7A00] text-black font-bold rounded-lg hover:opacity-90 transition-opacity"
          >
            Refresh page
          </button>
        </div>
      </body>
    </html>
  )
}
