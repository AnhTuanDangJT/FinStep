"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { AnimatedLogo } from "@/components/ui/AnimatedLogo"
import Link from "next/link"
import Image from "next/image"
import { GrowingNetwork } from "@/components/ui/GrowingNetwork"
import { useState, useEffect } from "react"

export function HeroSection() {
    const phrases = ["Finance Ideas", "Smart Strategies", "Career Goals", "Market Insights"]
    const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0)

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentPhraseIndex((prev) => (prev + 1) % phrases.length)
        }, 3000)
        return () => clearInterval(interval)
    }, [])

    return (
        <section className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden px-4 pt-20">
            {/* Background Pattern - STRICT Z-INDEX 0 & POINTER-EVENTS-NONE */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-30">
                <style>{`
                    @keyframes float-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
                    @keyframes pulse-smooth { 0%, 100% { transform: scale(0.98); } 50% { transform: scale(1.02); } }
                `}</style>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(204,85,0,0.08)_0%,transparent_70%)]" />
                <div className="absolute inset-0 bg-[url('/images/auth-pattern.png')] bg-cover bg-center invert opacity-[0.15]" />
            </div>

            {/* Logo bubble: transform/opacity only - no box-shadow or background-position animation for 60fps */}
            <div className="absolute top-[8%] left-[4%] w-64 h-64 rounded-full border-2 border-[rgba(255,122,0,0.25)] animate-float-slow hidden lg:flex items-center justify-center p-0 z-10 overflow-hidden pointer-events-none">
                <div className="animate-pulse-smooth w-full h-full flex items-center justify-center p-2 relative z-10 will-change-transform">
                    <Image
                        src="/FinstepLOGO.png"
                        alt="FinStep Logo"
                        width={280}
                        height={280}
                        className="object-contain scale-110"
                        priority
                    />
                </div>
            </div>

            {/* Left Side Pattern - Growing Network (Orange) */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.5 }}
                className="absolute left-0 top-[20%] w-80 h-[500px] hidden lg:block z-0 opacity-40 pointer-events-none"
            >
                <GrowingNetwork side="left" color="#FF7A00" />
            </motion.div>

            {/* Right Side Pattern - Growing Network (Dark Brown) */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.5 }}
                className="absolute right-0 top-[20%] w-80 h-[500px] hidden lg:block z-0 opacity-40 pointer-events-none"
            >
                <GrowingNetwork side="right" color="#2B1C14" />
            </motion.div>


            <div className="container relative z-10 max-w-5xl mx-auto flex flex-col items-center text-center space-y-12">

                {/* Logo Entrance */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="relative"
                >
                    <AnimatedLogo variant="hero" pulseIcon onLightBackground hideIcon />
                </motion.div>

                {/* Text Content - STRICT LIGHT MODE COLORS */}
                <div className="space-y-6 max-w-4xl">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="text-[clamp(2.5rem,5vw,4.5rem)] md:text-7xl font-bold tracking-tight text-[#2B1C14] leading-[1.1] min-h-[160px] md:min-h-[180px] flex flex-col items-center justify-center"
                    >
                        <span>Where</span>
                        <div className="relative h-[1.2em] w-full overflow-hidden flex justify-center">
                            <AnimatePresence mode="wait">
                                <motion.span
                                    key={currentPhraseIndex}
                                    initial={{ y: 40, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: -40, opacity: 0 }}
                                    transition={{ duration: 0.5, ease: "easeInOut" }}
                                    className="block text-[#FF7A00]"
                                >
                                    {phrases[currentPhraseIndex]}
                                </motion.span>
                            </AnimatePresence>
                        </div>
                        <span>Become Real Growth</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7, duration: 0.8 }}
                        className="text-xl text-[#3A2A20]/80 max-w-2xl mx-auto font-medium"
                    >
                        Join thousands of professionals climbing the career ladder with FinStep&apos;s intelligent growth tracking and expert mentorship.
                    </motion.p>
                </div>

                {/* CTAs */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9, duration: 0.8 }}
                    className="flex flex-col sm:flex-row gap-4 w-full max-w-sm"
                >
                    <Link href="/dashboard" className="w-full">
                        <Button size="lg" className="w-full h-12 text-lg font-semibold bg-[#FF7A00] hover:bg-[#FF7A00]/90 text-white shadow-lg shadow-[#FF7A00]/20 transition-all hover:scale-105 border-none">
                            Read Blogs
                        </Button>
                    </Link>
                    <Link href="/blog/write" className="w-full">
                        <Button variant="outline" size="lg" className="w-full h-12 text-lg font-semibold bg-white border-[#FFD6B0] text-[#2B1C14] hover:bg-[#FFF7ED] transition-all">
                            Write a Blog
                        </Button>
                    </Link>
                </motion.div>
            </div>

            {/* Scroll Indicator - RELATIVE POSITIONING TO PREVENT OVERLAP */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 1 }}
                className="mt-20 flex flex-col items-center gap-2 text-[#3A2A20]/50"
            >
                <span className="text-sm font-medium uppercase tracking-widest">Scroll</span>
                <motion.div
                    animate={{ y: [0, 8, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    className="w-1 h-12 rounded-full bg-gradient-to-b from-transparent via-current to-transparent"
                />
            </motion.div>
        </section>
    )
}
