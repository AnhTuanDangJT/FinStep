/**
 * Root route (/) - explicit so Vercel always serves the landing page.
 * Uses same layout as (public): force-light, bg-primary.
 */
import LandingPageContent from "@/components/landing/LandingPageContent"

export default function RootPage() {
  return (
    <div className="force-light bg-[var(--bg-primary)] min-h-screen">
      <LandingPageContent />
    </div>
  )
}
