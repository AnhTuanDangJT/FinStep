"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { BrainCircuit, Sparkles, ChevronDown, ChevronUp, X, ChevronRight } from "lucide-react"

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
    const [isClosed, setIsClosed] = React.useState(false)
    const [mounted, setMounted] = React.useState(false)

    // Fix Hydration mismatch by ensuring client-only logic where necessary
    React.useEffect(() => {
        setMounted(true)
    }, [])

    const MAX_CHARS = 1200

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
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="mb-12 relative overflow-hidden rounded-3xl group isolate-layer"
        >
            {/* Animated glowing border effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/0 via-brand-primary/40 to-brand-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 blur-md z-0" />
            <div className="absolute inset-0 border border-white/10 rounded-3xl group-hover:border-white/20 transition-colors duration-500 z-10" />

            {/* Inner background with glassmorphism */}
            <div className="absolute inset-[1px] bg-black/40 backdrop-blur-2xl rounded-[23px] z-10 overflow-hidden">
                {/* Subtle corner glows */}
                <div className="absolute top-0 left-0 w-64 h-64 bg-brand-primary/10 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-brand-accent/5 rounded-full blur-[80px] translate-x-1/2 translate-y-1/2 pointer-events-none" />

                {/* Subtle noise texture */}
                <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none" style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }} />
            </div>

            <div className={`relative z-20 flex flex-col ${isClosed ? "" : "h-full"}`}>

                {/* Header */}
                <button
                    onClick={() => setIsClosed(!isClosed)}
                    className={`flex items-center justify-between gap-3 sm:gap-4 p-5 sm:p-8 text-left w-full focus:outline-none group/header transition-all ${isClosed ? "pb-5 sm:pb-8" : "pb-3 sm:pb-4"}`}
                    aria-expanded={!isClosed}
                >
                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 group/btn">
                        <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover/btn:scale-110 group-hover/btn:border-brand-primary/50 group-hover/btn:bg-brand-primary/10 transition-all duration-500 shadow-xl shadow-black/50 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500" />
                            <BrainCircuit className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 group-hover/btn:text-brand-primary group-hover/btn:drop-shadow-[0_0_8px_rgba(252,211,77,0.8)] transition-all duration-500 relative z-10" />
                        </div>
                        <div className="flex bg-transparent transition-transform duration-500 flex-col min-w-0 justify-center">
                            <h3 className="text-lg sm:text-2xl font-bold text-white flex items-center gap-1.5 sm:gap-2 tracking-tight group-hover/btn:text-brand-primary transition-colors duration-300 truncate">
                                AI Summary
                                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-brand-primary drop-shadow-[0_0_8px_rgba(252,211,77,0.8)] animate-pulse shrink-0" />
                            </h3>
                            {isClosed && <span className="text-[10px] sm:text-xs text-gray-500 font-medium tracking-wider uppercase mt-0 sm:mt-1 hidden sm:block">Click to reveal</span>}
                        </div>
                    </div>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 text-gray-400 group-hover/header:text-brand-primary group-hover/header:bg-brand-primary/10 transition-all duration-300">
                        {isClosed ? <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" /> : <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </div>
                </button>

                {/* Content */}
                <AnimatePresence>
                    {!isClosed && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                            className="px-5 sm:px-10 pt-1 sm:pt-2 pb-6 sm:pb-10 flex-1 flex flex-col"
                        >
                            <ul className="space-y-4 sm:space-y-5 relative z-10" style={{ whiteSpace: "normal", wordBreak: "break-word" }}>
                                {renderPoints.map((pt, i) => {
                                    if (!mounted) return (
                                        <li key={i} className="flex items-start gap-3 sm:gap-4 text-gray-300 leading-relaxed text-sm sm:text-lg group/item">
                                            <span className="mt-2 sm:mt-2.5 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-brand-primary/50 shrink-0 shadow-[0_0_8px_rgba(252,211,77,0.4)]" />
                                            <span className="min-w-0 flex-1">{pt.original}</span>
                                        </li>
                                    )

                                    if (!isExpanded && !pt.visible && pt.hidden) return null;

                                    return (
                                        <motion.li
                                            key={i}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.1, duration: 0.5 }}
                                            className="flex items-start gap-3 sm:gap-4 text-gray-300 leading-relaxed text-sm sm:text-lg group/item"
                                        >
                                            <div className="mt-2 sm:mt-2.5 relative flex items-center justify-center shrink-0">
                                                <span className="absolute w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-brand-primary/20 opacity-0 group-hover/item:opacity-100 transition-opacity duration-300 animate-ping" />
                                                <span className="relative w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-brand-primary/70 group-hover/item:bg-brand-primary shadow-[0_0_8px_rgba(252,211,77,0.6)] transition-colors duration-300" />
                                            </div>
                                            <span className="min-w-0 flex-1 group-hover/item:text-white transition-colors duration-300">
                                                {isExpanded ? pt.original : pt.visible}
                                                {(!isExpanded && pt.hidden) && (
                                                    <span className="text-gray-500 italic"> ...</span>
                                                )}
                                            </span>
                                        </motion.li>
                                    )
                                })}
                            </ul>

                            {/* Show More Actions */}
                            {mounted && isLong && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="mt-6 sm:mt-8 pt-5 sm:pt-6 flex justify-start relative z-10 w-full border-t border-white/5"
                                >
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                                        className="group/more flex items-center gap-1.5 sm:gap-2 px-5 sm:px-6 py-2 sm:py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-brand-primary/50 text-xs sm:text-sm font-semibold text-gray-300 hover:text-brand-primary transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                                    >
                                        {isExpanded ? (
                                            <>Show Less <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover/more:-translate-y-0.5 transition-transform" /></>
                                        ) : (
                                            <>Read Full Summary <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover/more:translate-y-0.5 transition-transform" /></>
                                        )}
                                    </button>
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    )
}
