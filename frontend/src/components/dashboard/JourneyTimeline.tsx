"use client"

import { motion } from "framer-motion"
import { CheckCircle2, Circle, ArrowRight, Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

export interface JourneyStep {
    id: string
    title: string
    description: string
    status: "completed" | "current" | "locked"
    date?: string
    readTime?: string
    href: string
}

interface JourneyTimelineProps {
    steps: JourneyStep[]
}

export function JourneyTimeline({ steps }: JourneyTimelineProps) {
    return (
        <div className="relative max-w-3xl mx-auto py-12 px-4">
            {/* Vertical Line */}
            <div className="absolute left-[27px] top-12 bottom-12 w-0.5 bg-gradient-to-b from-[var(--brand-primary)]/20 via-[var(--brand-primary)]/20 to-transparent" />

            <div className="space-y-12">
                {steps.map((step, index) => (
                    <motion.div
                        key={step.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="relative flex items-start group"
                    >
                        {/* Status Icon */}
                        <div className={cn(
                            "relative z-10 flex cursor-default items-center justify-center w-14 h-14 rounded-full border-4 transition-all duration-300 bg-[var(--black-elevated)] shrink-0",
                            step.status === "completed" && "border-[var(--brand-primary)] text-[var(--brand-primary)]",
                            step.status === "current" && "border-[var(--brand-primary)] bg-[var(--brand-primary)] text-black shadow-[0_0_20px_rgba(255,183,3,0.3)] scale-110",
                            step.status === "locked" && "border-[var(--border-soft)] text-[var(--text-disabled)]"
                        )}>
                            {step.status === "completed" && <CheckCircle2 className="w-6 h-6" />}
                            {step.status === "current" && <div className="w-4 h-4 bg-white rounded-full animate-pulse" />}
                            {step.status === "locked" && <Lock className="w-5 h-5" />}
                        </div>

                        {/* Content Card */}
                        <Link
                            href={step.status !== "locked" ? step.href : "#"}
                            className={cn(
                                "ml-8 flex-1 p-6 rounded-2xl border transition-all duration-300 group-hover:-translate-y-1",
                                step.status === "current"
                                    ? "bg-[var(--black-surface)] border-[var(--brand-primary)]/30 shadow-xl shadow-[var(--brand-primary)]/5"
                                    : "bg-[var(--black-surface)] border-[var(--border-soft)] hover:border-[var(--brand-primary)]/20 hover:shadow-lg",
                                step.status === "locked" && "opacity-60 bg-[var(--black-elevated)] pointer-events-none"
                            )}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className={cn(
                                    "text-xs font-bold tracking-wider uppercase",
                                    step.status === "current" ? "text-[var(--brand-primary)]" : "text-[var(--text-secondary)]/60"
                                )}>
                                    Step {index + 1}
                                </span>
                                {step.date && <span className="text-xs text-[var(--text-secondary)]/60">{step.date}</span>}
                            </div>

                            <h3 className={cn(
                                "text-xl font-bold mb-2",
                                step.status === "current" ? "text-[var(--brand-primary)]" : "text-[var(--text-primary)]"
                            )}>
                                {step.title}
                            </h3>

                            <p className="text-[var(--text-secondary)] opacity-80 text-sm leading-relaxed mb-4">
                                {step.description}
                            </p>

                            <div className="flex items-center gap-4 text-xs font-medium text-[var(--text-secondary)]/60">
                                {step.readTime && <span>{step.readTime}</span>}
                                <ArrowRight className="w-3 h-3" />
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>

            {/* Completion Node at bottom */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: steps.length * 0.1 + 0.5 }}
                className="relative flex items-center mt-12 pl-[11px]"
            >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--brand-primary)] to-purple-500 flex items-center justify-center shadow-lg">
                    <div className="w-3 h-3 bg-white rounded-full" />
                </div>
                <span className="ml-10 text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--brand-primary)] to-purple-600 uppercase tracking-widest">
                    Financial Freedom
                </span>
            </motion.div>
        </div>
    )
}
