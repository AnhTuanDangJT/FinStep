"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { parseBlogContent, ContentBlockType } from "@/lib/blog-parser"
import { cn } from "@/lib/utils"

interface BlogContentRendererProps {
    content: string
}

export function BlogContentRenderer({ content }: BlogContentRendererProps) {
    // 1. Clean whitespace to prevent giant gaps
    const cleanedContent = React.useMemo(() => {
        return content.replace(/\n{3,}/g, "\n\n").trim();
    }, [content]);

    // 2. Parse the cleaned content
    const blocks = React.useMemo(() => parseBlogContent(cleanedContent), [cleanedContent]);

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
        <div className="blog-content">
            {blocks.map((block, index) => {
                const isFirst = index === 0;

                if (block.type === 'header') {
                    // Level logic: user says h1, h2, h3 have margins.
                    // block.level comes from parser (defaulted to 2 in my parser for now)
                    const HeaderTag = `h${Math.min(block.level, 3)}` as React.ElementType;

                    return (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                        >
                            <HeaderTag className="text-brand-text font-bold border-l-4 border-brand-primary pl-4">
                                {block.content}
                            </HeaderTag>
                        </motion.div>
                    )
                }

                if (block.type === 'list') {
                    return (
                        <motion.ul
                            key={index}
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                        >
                            {block.items.map((item, i) => (
                                <li key={i}>
                                    {/* Custom Bullet if we want, or rely on browser list-style.
                                        Globals CSS sets padding-left: 1.5rem so standard bullets work.
                                        But let's stick to the previous custom look if possible, OR default.
                                        User asked for "Use controlled typography system" via CSS.
                                        CSS has .blog-content ul { padding-left: 1.5rem; }.
                                        If we use standard <ul>, we get bullets.
                                        Let's keep it simple and standard markup where possible to respect the CSS,
                                        but maybe add the highlighter.
                                    */}
                                    {highlightKeywords(item)}
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
                            isFirst && "first-letter:text-5xl first-letter:font-bold first-letter:text-brand-primary first-letter:mr-2 first-letter:float-left"
                        )}
                    >
                        {highlightKeywords(block.content)}
                    </motion.p>
                )
            })}
        </div>
    )
}
