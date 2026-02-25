"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { BrainCircuit, Sparkles, ChevronDown, ChevronUp } from "lucide-react"

interface AiSummaryBoxProps {
    summaryPoints?: string[]
}

export function AiSummaryBox({ summaryPoints = [] }: AiSummaryBoxProps) {
    const points = summaryPoints.length > 0 ? summaryPoints : [
        "This article explores key financial concepts.",
        "Detailed analysis of market trends and opportunities.",
        "Actionable insights for your investment portfolio."
    ]

    const [isExpanded, setIsExpanded] = React.useState(false)
    const [mounted, setMounted] = React.useState(false)

    // Fix Hydration mismatch by ensuring client-only logic where necessary
    React.useEffect(() => {
        setMounted(true)
    }, [])

    const MAX_CHARS = 400

    // Splitting logic safely by word
    let currentLength = 0;
    const renderPoints = points.map((point) => {
        if (currentLength >= MAX_CHARS) {
            return { visible: null, hidden: point, original: point }
        }

        if (currentLength + point.length <= MAX_CHARS) {
            currentLength += point.length;
            return { visible: point, hidden: null, original: point }
        }

        const words = point.split(" ");
        let visibleWords = [];
        let hiddenWords = [];
        let pointCurrentLen = 0;

        for (const word of words) {
            if (currentLength + pointCurrentLen + word.length <= MAX_CHARS) {
                visibleWords.push(word);
                pointCurrentLen += word.length + 1; // plus space
            } else {
                hiddenWords.push(word);
            }
        }

        currentLength += pointCurrentLen + hiddenWords.join(" ").length;

        return {
            visible: visibleWords.length > 0 ? visibleWords.join(" ") : null,
            hidden: hiddenWords.length > 0 ? hiddenWords.join(" ") : null,
            original: point
        }
    });

    const isLong = points.reduce((acc, p) => acc + p.length, 0) > MAX_CHARS

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-10 relative overflow-visible rounded-2xl border border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-950/10 p-6 md:p-8 ai-summary-box"
        >
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

            <ul className="space-y-3 relative z-10 block" style={{ whiteSpace: "normal", wordBreak: "break-word" }}>
                {renderPoints.map((pt, i) => {
                    // Hide <li> completely if it has no visible text and we aren't expanded
                    if (!mounted) return (
                        <li key={i} className="flex items-start gap-3 text-indigo-900/80 dark:text-indigo-200/80 leading-relaxed">
                            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                            <span className="min-w-0 flex-1">{pt.original}</span>
                        </li>
                    ) // Pre-render original to avoid mismatch

                    if (!isExpanded && !pt.visible && pt.hidden) return null;

                    return (
                        <li
                            key={i}
                            className="flex items-start gap-3 text-indigo-900/80 dark:text-indigo-200/80 leading-relaxed"
                        >
                            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                            <span className="min-w-0 flex-1">
                                {isExpanded ? pt.original : pt.visible}
                                {!isExpanded && pt.hidden && " ..."}
                            </span>
                        </li>
                    )
                })}
            </ul>

            {mounted && isLong && (
                <div className="mt-6 flex justify-start relative z-10 w-full overflow-hidden">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1 transition-colors bg-indigo-500/10 hover:bg-indigo-500/20 px-4 py-2 rounded-full cursor-pointer"
                    >
                        {isExpanded ? (
                            <>Show less <ChevronUp className="w-4 h-4 ml-1" /></>
                        ) : (
                            <>Show more <ChevronDown className="w-4 h-4 ml-1" /></>
                        )}
                    </button>
                </div>
            )}
        </motion.div>
    )
}
