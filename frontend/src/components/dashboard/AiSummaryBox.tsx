"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { BrainCircuit, Sparkles } from "lucide-react"

interface AiSummaryBoxProps {
    summaryPoints?: string[]
}

export function AiSummaryBox({ summaryPoints = [] }: AiSummaryBoxProps) {
    // If no summary points provided, we can show a default "Processing..." or hide it.
    // For now, let's show a default skeletal structure if empty, or just return null?
    // User request implies it should always be there ("Card: Title: 'AI Summary'").
    // Let's use some placeholder text if empty to demonstrate the UI.

    const points = summaryPoints.length > 0 ? summaryPoints : [
        "This article explores key financial concepts.",
        "Detailed analysis of market trends and opportunities.",
        "Actionable insights for your investment portfolio."
    ]

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-10 relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-950/10 p-6 md:p-8"
        >
            {/* Background Glow */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl" />

            <div className="relative flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                    <BrainCircuit className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-100 flex items-center gap-2">
                    AI Summary
                    <Sparkles className="w-4 h-4 text-amber-400" />
                </h3>
            </div>

            <ul className="space-y-3">
                {points.map((point, i) => (
                    <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + (i * 0.1) }}
                        className="flex items-start gap-3 text-indigo-900/80 dark:text-indigo-200/80 leading-relaxed"
                    >
                        <span className="mt-2 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                        <span>{point}</span>
                    </motion.li>
                ))}
            </ul>
        </motion.div>
    )
}
