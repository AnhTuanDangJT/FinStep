"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { useRef } from "react"
import Image from "next/image"
import { ArrowUpRight } from "lucide-react"

export function BlogFeatureSection() {
    const containerRef = useRef(null)
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    })

    const yLeft = useTransform(scrollYProgress, [0, 1], [100, -100])
    const yRight = useTransform(scrollYProgress, [0, 1], [200, -200])

    return (
        <section ref={containerRef} className="py-32 relative overflow-hidden">

            <div className="container mx-auto px-4">
                <div className="grid md:grid-cols-2 gap-16 items-center">

                    {/* Left: Text Content */}
                    <motion.div
                        style={{ y: yLeft }}
                        className="space-y-8"
                    >
                        <motion.h2
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="text-4xl md:text-6xl font-bold text-[#2B1C14] leading-tight"
                        >
                            Share financial <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-accent">
                                insights with the world.
                            </span>
                        </motion.h2>

                        <div className="space-y-6 text-lg text-[#3A2A20]/80">
                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.2, duration: 0.8 }}
                            >
                                Build your reputation as a finance professional. Publish articles, case studies, and market analyses that reach thousands of peers.
                            </motion.p>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.4, duration: 0.8 }}
                                className="pl-6 border-l-4 border-brand-primary/20"
                            >
                                <p className="italic text-[#2B1C14] font-medium">
                                    "Every article is reviewed by industry experts to ensure quality and credibility. Your name travels with your content."
                                </p>
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* Right: Floating Mockups */}
                    <div className="relative h-[600px] w-full perspective-1000">
                        {/* Abstract Background Blotches behind cards */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-brand-primary/5 rounded-full" />

                        {/* Card 1 */}
                        <motion.div
                            style={{ y: yRight }}
                            className="absolute top-10 right-0 w-80 md:w-96 aspect-[4/5] bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 flex flex-col gap-4 transform rotate-6 z-10 hover:rotate-3 transition-transform duration-500 hover:shadow-brand-primary/20"
                        >
                            <div className="h-40 w-full bg-gray-100 rounded-lg overflow-hidden relative">
                                <div className="absolute inset-0 bg-gradient-to-tr from-gray-200 to-gray-100" />
                            </div>
                            <div className="space-y-3">
                                <div className="h-4 w-20 bg-brand-primary/20 rounded-full" />
                                <div className="h-8 w-full bg-gray-100 rounded-md" />
                                <div className="h-8 w-2/3 bg-gray-100 rounded-md" />
                                <div className="h-20 w-full bg-gray-50 rounded-md mt-4" />
                            </div>
                            <div className="mt-auto flex items-center justify-between border-t pt-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-gray-200" />
                                    <div className="h-3 w-20 bg-gray-200 rounded-full" />
                                </div>
                                <ArrowUpRight className="w-5 h-5 text-gray-300" />
                            </div>
                        </motion.div>

                        {/* Card 2 (Behind) */}
                        <motion.div
                            style={{ y: yLeft }}
                            className="absolute top-32 right-12 md:right-32 w-80 md:w-96 aspect-[4/5] bg-white/95 rounded-2xl shadow-xl border border-gray-100/50 p-6 transform -rotate-6 z-0"
                        >
                            {/* Simplified content for background card */}
                            <div className="h-40 w-full bg-gray-50 rounded-lg mb-4" />
                            <div className="space-y-3 opacity-50">
                                <div className="h-6 w-3/4 bg-gray-100 rounded-md" />
                                <div className="h-6 w-1/2 bg-gray-100 rounded-md" />
                            </div>
                        </motion.div>

                    </div>

                </div>
            </div>
        </section>
    )
}
