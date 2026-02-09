"use client"

import * as React from "react"
import { JourneyTimeline } from "./JourneyTimeline"
import { JOURNEY_STEPS } from "@/lib/journeyData"

export function JourneyTimelineView() {
    // Default to step 2 if no history, just for demo
    const [currentStepId, setCurrentStepId] = React.useState<number>(2)

    React.useEffect(() => {
        const checkProgress = () => {
            const stored = localStorage.getItem("finstep_journey_progress")
            if (stored) {
                setCurrentStepId(parseInt(stored, 10))
            }
        }

        checkProgress()
        // Listen for storage events in case other tabs update it
        window.addEventListener("storage", checkProgress)
        // Custom event for same-tab updates
        window.addEventListener("featured-journey-update", checkProgress)

        return () => {
            window.removeEventListener("storage", checkProgress)
            window.removeEventListener("featured-journey-update", checkProgress)
        }
    }, [])

    const steps = JOURNEY_STEPS.map((step, index) => {
        const stepNum = index + 1
        let status: "completed" | "current" | "locked" = "locked"

        if (stepNum < currentStepId) {
            status = "completed"
        } else if (stepNum === currentStepId) {
            status = "current"
        }

        return {
            ...step,
            status,
            href: `/blogs/${step.slug}`,
            date: "Jan 12, 2026" // Mock date for now
        }
    })

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-2 mb-12">
                <h1 className="text-3xl font-bold text-[var(--text-primary)]">Your Financial Path</h1>
                <p className="text-[var(--text-secondary)]">
                    You are on <span className="text-[var(--brand-primary)] font-bold">Step {currentStepId}</span> of {JOURNEY_STEPS.length}. Keep climbing.
                </p>
            </div>

            <div className="relative p-8 rounded-3xl border border-[var(--border-soft)] bg-[var(--bg-surface)]/30 backdrop-blur-sm">
                <JourneyTimeline steps={steps} />
            </div>
        </div>
    )
}
