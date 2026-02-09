"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { useRef } from "react"
import { Lightbulb, Compass, Share2 } from "lucide-react"

export function StorySection() {
    const containerRef = useRef<HTMLDivElement>(null)
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"],
    })

    const y = useTransform(scrollYProgress, [0, 1], [100, -100])
    // Smooth fade in/out for the global background
    const bgOpacity = useTransform(scrollYProgress, [0.1, 0.3, 0.7, 0.9], [0, 1, 1, 0])

    return (
        <section ref={containerRef} className="relative py-32 bg-[#0a0a0a] text-white overflow-hidden">
            {/* Cinematic Scroll Background Fade */}
            <motion.div
                style={{ opacity: bgOpacity }}
                className="fixed inset-0 bg-[#0a0a0a] z-0 pointer-events-none"
            />

            {/* Content Container - Needs z-10 to sit above the fixed bg */}
            <div className="relative z-10">

                {/* Edge glow: yellow from left, purple from right — radial gradients only, no blur (60fps) */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div
                        className="absolute left-0 top-0 bottom-0 w-[70vw] max-w-[900px]"
                        style={{
                            background: "radial-gradient(ellipse 100% 80% at 0% 50%, rgba(255,180,0,0.22) 0%, rgba(255,120,0,0.08) 35%, transparent 65%)",
                        }}
                    />
                    <div
                        className="absolute right-0 top-0 bottom-0 w-[70vw] max-w-[900px]"
                        style={{
                            background: "radial-gradient(ellipse 100% 80% at 100% 50%, rgba(168,85,247,0.22) 0%, rgba(147,51,234,0.08) 35%, transparent 65%)",
                        }}
                    />
                </div>

                <div className="container mx-auto px-6 relative z-10">
                    {/* Intro */}
                    <div className="text-center max-w-4xl mx-auto mb-24 space-y-6">
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-5xl md:text-7xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-gray-500"
                        >
                            The Gap Between <br /> <span className="text-brand-primary drop-shadow-[0_0_15px_rgba(255,100,0,0.5)]">Knowledge</span> & <span className="text-purple-400 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">Success</span>
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="text-xl text-gray-400 leading-relaxed"
                        >
                            Finance isn't just numbers. It's a ladder. And most people are stuck on the first rung because they're climbing alone.
                        </motion.p>
                    </div>

                    {/* Story Cards */}
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        {/* Card 1: The Maze */}
                        <motion.div
                            style={{ y }}
                            initial={{ opacity: 0, x: -100 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
                            className="relative group"
                        >
                            <div className="absolute -inset-1 bg-gradient-to-r from-brand-primary to-purple-600 rounded-2xl opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200" />
                            <div className="relative p-8 bg-black/90 border border-white/10 rounded-2xl h-full space-y-6">
                                <div className="w-16 h-16 rounded-full bg-brand-primary/10 flex items-center justify-center relative">
                                    <span className="absolute w-2 h-2 rounded-full bg-brand-primary opacity-90 animate-pulse" style={{ boxShadow: "0 0 12px 2px rgba(255,120,0,0.6)" }} />
                                    <Compass className="w-8 h-8 text-brand-primary relative z-10" />
                                </div>
                                <h3 className="text-3xl font-bold text-white">Why a Mentor?</h3>
                                <p className="text-gray-400 text-lg leading-relaxed">
                                    The financial world is a maze of jargon and risk. A mentor is your map. They've already walked the path, fell into the pits, and found the shortcuts. <span className="text-white font-bold">Stop guessing. Start executing.</span>
                                </p>
                                <div className="h-1 w-20 bg-brand-primary rounded-full shadow-[0_0_10px_orange]" />
                            </div>
                        </motion.div>

                        {/* Card 2: The Collective */}
                        <motion.div
                            style={{ y: useTransform(scrollYProgress, [0, 1], [0, 50]) }}
                            initial={{ opacity: 0, x: 100 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.8, delay: 0.2, type: "spring", bounce: 0.4 }}
                            className="relative group md:mt-24"
                        >
                            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-500 rounded-2xl opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200" />
                            <div className="relative p-8 bg-black/90 border border-white/10 rounded-2xl h-full space-y-6">
                                <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center relative">
                                    <span className="absolute w-2 h-2 rounded-full bg-purple-400 opacity-90 animate-pulse" style={{ boxShadow: "0 0 12px 2px rgba(168,85,247,0.6)" }} />
                                    <Lightbulb className="w-8 h-8 text-purple-500 relative z-10" />
                                </div>
                                <h3 className="text-3xl font-bold text-white">Why Read & Write?</h3>
                                <p className="text-gray-400 text-lg leading-relaxed">
                                    One brain is limited. Thousands are limitless. Our blog isn't just content; it's <span className="text-purple-400 font-bold">collective intelligence</span>. Share your wins, learn from losses, and compound your wisdom daily.
                                </p>
                                <div className="h-1 w-20 bg-purple-500 rounded-full shadow-[0_0_10px_purple]" />
                            </div>
                        </motion.div>
                    </div>

                    {/* Closing Statement */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 50 }}
                        whileInView={{ opacity: 1, scale: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mt-40 text-center max-w-3xl mx-auto p-10 border border-white/10 rounded-3xl bg-white/10 relative"
                    >
                        <h3 className="text-4xl font-bold mb-6 text-white pt-8">Why FinStep?</h3>
                        <p className="text-2xl font-light text-gray-300">
                            Because knowledge without action is entertainment. We turn finance knowledge into <span className="text-brand-primary font-bold">real career progress</span>, one step at a time.
                        </p>
                    </motion.div>

                </div>
            </div>
        </section>
    )
}
