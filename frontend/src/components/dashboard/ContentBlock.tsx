"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, List, AlignLeft, Bot } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ContentBlockProps {
    content: string
    index: number
    aiMeta?: {
        title?: string
        suggestedFormat?: "bullet" | "paragraph"
    }
}

export function ContentBlock({ content, index, aiMeta }: ContentBlockProps) {
    const isLead = index === 0
    const [format, setFormat] = React.useState<"paragraph" | "bullet">(
        aiMeta?.suggestedFormat === "bullet" ? "bullet" : "paragraph"
    )
    const [showAiTitle, setShowAiTitle] = React.useState(!!aiMeta?.title)

    // Split content into sentences for bullet view
    const sentences = React.useMemo(() => {
        return content.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0)
    }, [content])

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className={cn(
                "relative group mb-8 md:mb-10",
                isLead ? "mb-10 md:mb-12" : ""
            )}
        >
            {/* AI Heading (Optional) */}
            <AnimatePresence>
                {aiMeta?.title && showAiTitle && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-3 flex items-center gap-2 text-brand-primary/80 font-bold text-sm uppercase tracking-wider"
                    >
                        <Bot className="w-4 h-4" />
                        {aiMeta.title}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Content Switcher (Only if bullet format is available/suggested) */}
            {aiMeta?.suggestedFormat === "bullet" && (
                <div className="absolute -right-12 top-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
                    <button
                        onClick={() => setFormat("paragraph")}
                        className={cn(
                            "p-1.5 rounded-md transition-colors",
                            format === "paragraph" ? "bg-brand-primary text-white" : "text-gray-400 hover:bg-gray-100"
                        )}
                        title="View as paragraph"
                    >
                        <AlignLeft className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setFormat("bullet")}
                        className={cn(
                            "p-1.5 rounded-md transition-colors",
                            format === "bullet" ? "bg-brand-primary text-white" : "text-gray-400 hover:bg-gray-100"
                        )}
                        title="View as list"
                    >
                        <List className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Main Content Render */}
            <AnimatePresence mode="wait">
                {format === "paragraph" ? (
                    <motion.p
                        key="paragraph"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={cn(
                            "font-content leading-relaxed text-brand-text/80 whitespace-pre-wrap transition-all",
                            isLead
                                ? "text-xl md:text-2xl text-brand-text border-l-4 border-brand-primary pl-6 py-1"
                                : "text-lg"
                        )}
                    >
                        {content}
                    </motion.p>
                ) : (
                    <motion.ul
                        key="bullet"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-3 pl-2"
                    >
                        {sentences.map((sentence, i) => (
                            <motion.li
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="font-content flex items-start gap-3 text-lg text-brand-text/80 leading-relaxed"
                            >
                                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-brand-primary shrink-0" />
                                <span>{sentence}</span>
                            </motion.li>
                        ))}
                    </motion.ul>
                )}
            </AnimatePresence>
        </motion.div>
    )
}
