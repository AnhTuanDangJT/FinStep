"use client"

import * as React from "react"
import { motion, useScroll, useSpring } from "framer-motion"
import { ArrowLeft, Calendar, Share2, Tag, User, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { BlogPost } from "@/lib/blogData"
import { toast } from "sonner"

import { JOURNEY_STEPS } from "@/lib/journeyData"
import { sanitizeHtml } from "@/lib/security"

interface BlogReaderProps {
    post: BlogPost
}

export function BlogReader({ post }: BlogReaderProps) {
    const { scrollYProgress } = useScroll()
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    })

    const handleShare = () => {
        const url = window.location.href
        navigator.clipboard.writeText(url)
        toast.success("Link copied to clipboard")
    }

    const handleComplete = () => {
        // Find current step index
        const currentIndex = JOURNEY_STEPS.findIndex(s => s.slug === post.slug)
        if (currentIndex !== -1) {
            // Unlock next step (index + 2 because IDs are 1-based and we want next)
            const nextStepId = currentIndex + 2

            // Get current progress
            const currentStored = parseInt(localStorage.getItem("finstep_journey_progress") || "2", 10)

            // Only update if we are advancing (don't regress if re-reading old step)
            if (nextStepId > currentStored) {
                localStorage.setItem("finstep_journey_progress", nextStepId.toString())
                // Dispatch event for client-side updates
                window.dispatchEvent(new Event("featured-journey-update"))
            }
        }
        toast.success("Step marked as complete! Next step unlocked.")
    }

    return (
        <div className="min-h-screen bg-brand-bg dark:bg-background pb-20 transition-colors duration-300">
            {/* Reading Progress Bar */}
            <motion.div
                className="fixed top-0 left-0 right-0 h-1 bg-brand-primary z-50 origin-left"
                style={{ scaleX }}
            />

            {/* Header / Nav */}
            <div className="sticky top-0 z-40 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-brand-text/5 dark:border-white/10 px-6 py-4 flex items-center justify-between">
                <Link href="/dashboard?view=timeline">
                    <Button variant="ghost" size="sm" className="gap-2 text-brand-text dark:text-gray-300 hover:text-brand-primary">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Journey
                    </Button>
                </Link>
                <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={handleShare} className="rounded-full hover:bg-brand-primary/10 hover:text-brand-primary text-brand-text dark:text-gray-300">
                        <Share2 className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Hero Section */}
            <div className="relative w-full aspect-[21/9] md:h-[60vh] overflow-hidden">
                {/* Background Blur */}
                <div
                    className="absolute inset-0 bg-cover bg-center blur-2xl opacity-50 dark:opacity-20 scale-110"
                    style={{ backgroundImage: `url(${post.coverImage})` }}
                />

                <div className="relative h-full container mx-auto flex items-center justify-center p-6">
                    <motion.img
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        src={post.coverImage}
                        alt={post.title}
                        className="max-h-full max-w-full drop-shadow-2xl object-contain z-10"
                    />
                </div>

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-brand-bg dark:from-background via-transparent to-transparent" />
            </div>

            {/* Content Container */}
            <div className="container mx-auto max-w-3xl px-6 -mt-20 relative z-10">
                <div className="bg-white/80 dark:bg-[#1a1a2e]/90 backdrop-blur-xl rounded-3xl p-8 md:p-12 shadow-xl border border-white/20 dark:border-white/10">
                    {/* Metadata */}
                    <div className="flex flex-wrap gap-4 items-center mb-8 text-sm text-brand-text/60 dark:text-gray-400">
                        <div className="flex items-center gap-2 bg-brand-primary/10 dark:bg-brand-primary/20 text-brand-primary px-3 py-1 rounded-full">
                            <Tag className="w-3 h-3" />
                            <span className="font-semibold">{post.tags[0]}</span>
                        </div>

                        <div className="flex items-center gap-2 ml-auto">
                            <span>{post.readTime}</span>
                        </div>
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl md:text-5xl font-bold text-brand-text dark:text-white mb-8 leading-tight">
                        {post.title}
                    </h1>

                    {/* Content */}
                    <div
                        className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6 prose-p:leading-relaxed prose-p:mb-6 prose-li:mb-2 prose-strong:text-brand-primary break-words"
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
                    />

                    {/* Footer Actions */}
                    <div className="mt-16 pt-8 border-t border-brand-text/10 dark:border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="text-center md:text-left">
                            <h3 className="font-bold text-lg dark:text-white">Enjoyed this reading?</h3>
                            <p className="text-sm text-gray-500">Mark this step as complete in your journey.</p>
                        </div>
                        <Link href="/dashboard?view=timeline">
                            <Button
                                size="lg"
                                className="bg-brand-primary text-white hover:bg-brand-accent rounded-full px-8 shadow-lg shadow-brand-primary/20"
                                onClick={handleComplete}
                            >
                                <CheckCircle2 className="w-5 h-5 mr-2" />
                                Complete Step
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
