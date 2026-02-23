"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
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
    const MAX_CHARS = 400

    // Calculate total character length
    const totalChars = points.reduce((acc, p) => acc + p.length, 0)
    const isLong = totalChars > MAX_CHARS

    // Splitting logic without "slice" applied midway through text 
    let currentLength = 0;
    const renderPoints = points.map((point) => {
        if (currentLength >= MAX_CHARS) {
            return { visible: null, hidden: point, original: point }
        }

        if (currentLength + point.length <= MAX_CHARS) {
            currentLength += point.length;
            return { visible: point, hidden: null, original: point }
        }

        // We cross the 400 chars boundary in this point. 
        // We use split(" ") to break by word boundary avoiding slice(0,200).
        const words = point.split(" ");
        let visibleWords = [];
        let hiddenWords = [];
        let pointCurrentLen = 0;

        for (const word of words) {
            if (currentLength + pointCurrentLen + word.length <= MAX_CHARS) {
                visibleWords.push(word);
                pointCurrentLen += word.length + 1;
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

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-10 relative overflow-visible rounded-2xl border border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-950/10 p-6 md:p-8 ai-summary-box"
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

            <motion.ul layout className="space-y-3 relative z-10 block" style={{ whiteSpace: "normal", wordBreak: "break-word" }}>
                <AnimatePresence initial={false}>
                    {renderPoints.map((pt, i) => {
                        // If it's fully hidden and we're not expanded, skip rendering
                        if (!isExpanded && !pt.visible && pt.hidden) return null;

                        return (
                            <motion.li
                                layout
                                key={i}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3, delay: isExpanded ? i * 0.05 : 0 }}
                                className="flex items-start gap-3 text-indigo-900/80 dark:text-indigo-200/80 leading-relaxed overflow-hidden"
                            >
                                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                                <span className="min-w-0 flex-1">
                                    {isExpanded ? pt.original : pt.visible}
                                    {!isExpanded && pt.hidden && " ..."}
                                </span>
                            </motion.li>
                        )
                    })}
                </AnimatePresence>
            </motion.ul>

            {isLong && (
                <motion.div layout className="mt-6 flex justify-start relative z-10 w-full overflow-hidden">
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
                </motion.div>
            )}
        </motion.div>
    )
}
