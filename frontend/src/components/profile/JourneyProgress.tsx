"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowRight, CheckCircle2, Map, Trophy } from "lucide-react"
import type { CurrentJourneySummary } from "@/lib/api-client"

interface JourneyProgressProps {
    /** Real-time current journey from GET /api/profile/me */
    currentJourney?: CurrentJourneySummary | null
}

import { JOURNEY_STEPS } from "@/lib/journeyData"
import * as React from "react"

export function JourneyProgress({ currentJourney }: JourneyProgressProps) {
    const [localStepId, setLocalStepId] = React.useState<number | null>(null)

    React.useEffect(() => {
        const checkProgress = () => {
            const stored = localStorage.getItem("finstep_journey_progress")
            if (stored) {
                setLocalStepId(parseInt(stored, 10))
            } else {
                // Default to 1 if nothing stored, to show *something* instead of "No journey"
                setLocalStepId(1)
            }
        }

        checkProgress()
        window.addEventListener("featured-journey-update", checkProgress)
        // Also listen to storage for cross-tab
        window.addEventListener("storage", checkProgress)
        return () => {
            window.removeEventListener("featured-journey-update", checkProgress)
            window.removeEventListener("storage", checkProgress)
        }
    }, [])

    // Priority: Prop > Local State > Default 1
    const rawStepId = currentJourney?.currentStep || localStepId || 1
    const totalSteps = currentJourney?.totalSteps || JOURNEY_STEPS.length

    // Check if user has completed all steps
    const isCompleted = rawStepId > totalSteps

    // Clamp for display if properly running, but if completed we show special UI
    const stepId = Math.min(rawStepId, totalSteps)

    // Safe bounds check for data access
    const nextStepIndex = Math.min(stepId, totalSteps - 1)

    const nextStepTitle = currentJourney?.nextStepTitle || JOURNEY_STEPS[nextStepIndex]?.title || "Financial Freedom"

    const progress = Math.min(100, (stepId / totalSteps) * 100)

    if (isCompleted) {
        return (
            <div className="bg-[var(--black-surface)]/60 backdrop-blur-xl border border-[var(--border-soft)] rounded-[2rem] p-8 shadow-lg space-y-6 relative overflow-hidden group">
                {/* Animated Background Glow */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-[var(--brand-primary)]/20 to-transparent blur-3xl opacity-50 pointer-events-none"
                />

                <div className="flex items-center justify-between relative z-10">
                    <div>
                        <h3 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                            Journey Complete
                            <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 200, damping: 10 }}
                            >
                                🎉
                            </motion.span>
                        </h3>
                        <p className="text-[var(--text-secondary)]">You&apos;ve mastered the basics.</p>
                    </div>
                    <div className="px-3 py-1 bg-green-500/20 text-green-500 rounded-full text-sm font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Done
                    </div>
                </div>

                <div className="relative pt-4 text-center space-y-4">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="w-20 h-20 mx-auto bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-accent)] rounded-full flex items-center justify-center shadow-2xl shadow-[var(--brand-primary)]/40"
                    >
                        <Trophy className="w-10 h-10 text-white" />
                    </motion.div>

                    <div>
                        <h4 className="text-lg font-bold text-white">Financial Freedom Unlocked</h4>
                        <p className="text-sm text-[var(--text-secondary)]">You are ready to build your empire.</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-[var(--black-elevated)]/50 p-4 rounded-2xl border border-[var(--border-soft)] relative z-10">
                    <div className="p-2 bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] rounded-full">
                        <Map className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                        <div className="text-xs font-bold text-[var(--text-secondary)]/40 uppercase tracking-widest">Status</div>
                        <div className="font-bold text-[var(--text-primary)]">Ready for Advanced</div>
                    </div>
                    <Link
                        href={`/dashboard?view=timeline`}
                        className="p-2 hover:bg-[var(--brand-primary)]/10 text-[var(--text-secondary)] rounded-full transition-colors"
                        aria-label="View journey"
                    >
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-[var(--black-surface)]/60 backdrop-blur-xl border border-[var(--border-soft)] rounded-[2rem] p-8 shadow-lg space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold text-[var(--text-primary)]">Current Journey</h3>
                    <p className="text-[var(--text-secondary)]">Keep climbing.</p>
                </div>
                <span className="px-3 py-1 bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] rounded-full text-sm font-bold">
                    Step {stepId} of {totalSteps}
                </span>
            </div>

            <div className="relative pt-4">
                <div className="h-2 w-full bg-[var(--black-elevated)] rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="h-full bg-[var(--brand-primary)] rounded-full"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4 bg-[var(--black-elevated)]/50 p-4 rounded-2xl border border-[var(--border-soft)]">
                <div className="p-2 bg-green-500/10 text-green-500 rounded-full">
                    <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="flex-1">
                    <div className="text-xs font-bold text-[var(--text-secondary)]/40 uppercase tracking-widest">Next Step</div>
                    <div className="font-bold text-[var(--text-primary)]">{nextStepTitle}</div>
                </div>
                <Link
                    href={`/dashboard?view=timeline`}
                    className="p-2 hover:bg-[var(--brand-primary)]/10 text-[var(--text-secondary)] rounded-full transition-colors"
                    aria-label="View journey"
                >
                    <ArrowRight className="w-5 h-5" />
                </Link>
            </div>
        </div>
    )
}
