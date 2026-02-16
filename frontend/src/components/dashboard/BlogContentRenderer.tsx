"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { parseBlogContent, ContentBlockType } from "@/lib/blog-parser"
import { cn } from "@/lib/utils"

interface BlogContentRendererProps {
    content: string
}

export function BlogContentRenderer({ content }: BlogContentRendererProps) {
    const blocks = React.useMemo(() => parseBlogContent(content), [content])

    // Highlight keywords helper
    const highlightKeywords = (text: string) => {
        const keywords = ["Key insight", "Important", "However", "Note", "Analysis"]
        const pattern = new RegExp(`\\b(${keywords.join("|")})\\b`, "gi")

        const parts = text.split(pattern)

        return parts.map((part, i) => {
            if (keywords.some(k => k.toLowerCase() === part.toLowerCase())) {
                return (
                    <span key={i} className="font-bold text-brand-primary bg-brand-primary/10 px-1 rounded">
                        {part}
                    </span>
                )
            }
            return part
        })
    }

    return (
        <div className="space-y-8 md:space-y-10">
            {blocks.map((block, index) => {
                const isFirst = index === 0;

                if (block.type === 'header') {
                    return (
                        <motion.h2
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="text-2xl md:text-3xl font-bold text-brand-text mt-12 mb-6 border-l-4 border-brand-primary pl-4"
                        >
                            {block.content}
                        </motion.h2>
                    )
                }

                if (block.type === 'list') {
                    return (
                        <motion.ul
                            key={index}
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            className="space-y-4 pl-4 md:pl-6 my-6"
                        >
                            {block.items.map((item, i) => (
                                <li key={i} className="flex items-start gap-4 text-lg text-brand-text/80 leading-relaxed font-content">
                                    <div className="mt-2.5 w-1.5 h-1.5 rounded-full bg-brand-primary shrink-0 opacity-60" />
                                    <span>{highlightKeywords(item)}</span>
                                </li>
                            ))}
                        </motion.ul>
                    )
                }

                return (
                    <motion.p
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className={cn(
                            "text-lg md:text-xl leading-loose font-content text-brand-text/90",
                            isFirst && "first-letter:text-5xl first-letter:font-bold first-letter:text-brand-primary first-letter:mr-1 first-letter:float-left"
                        )}
                    >
                        {highlightKeywords(block.content)}
                    </motion.p>
                )
            })}
        </div>
    )
}
