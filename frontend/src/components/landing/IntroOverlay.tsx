"use client"

import * as React from "react"
import { useEffect, useState, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AnimatedLogo } from "@/components/ui/AnimatedLogo"
import { cn } from "@/lib/utils"

export const IntroOverlay = React.memo(function IntroOverlay({ onFinish }: { onFinish: () => void }) {
    const [phase, setPhase] = useState<"atmosphere" | "narrative" | "reveal" | "complete">("atmosphere")
    const [wordIndex, setWordIndex] = useState(0)
    const [isFinished, setIsFinished] = useState(false) // Track if intro finished (for pointer-events)
    const words = ["GROWTH", "CLARITY", "SUCCESS", "FINSTEP"]
    const onFinishRef = useRef(onFinish)
    const failsafeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const onFinishCalledRef = useRef(false) // Ensure onFinish is idempotent

    // Update ref when onFinish changes
    useEffect(() => {
        onFinishRef.current = onFinish
    }, [onFinish])

    // Idempotent onFinish wrapper (memoized to prevent closure issues)
    const callOnFinish = useCallback(() => {
        if (onFinishCalledRef.current) {
            return
        }
        onFinishCalledRef.current = true
        setIsFinished(true) // Disable pointer events immediately
        onFinishRef.current()
    }, []) // Empty deps - function only uses refs and stable setters

    // Check prefers-reduced-motion and start intro sequence
    useEffect(() => {

        // Check prefers-reduced-motion first - skip intro immediately if true
        const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        if (prefersReducedMotion) {
            callOnFinish()
            return
        }

        // Start sequence
        const timer1 = setTimeout(() => {
            setPhase("narrative")
        }, 2000)

        // FAILSAFE: Auto-proceed after 30 seconds (longer for loop appreciation)
        failsafeTimeoutRef.current = setTimeout(() => {
            setPhase("complete")
            callOnFinish()
        }, 30000)

        return () => {
            clearTimeout(timer1)
            if (failsafeTimeoutRef.current) {
                clearTimeout(failsafeTimeoutRef.current)
                failsafeTimeoutRef.current = null
            }
        }
    }, [callOnFinish])

    // Handle Narrative Sequence - LOOPS INFINITELY
    // Handle Narrative Sequence - PLAY ONCE THEN PROCEED
    useEffect(() => {
        if (phase === "narrative") {
            const timer = setTimeout(() => {
                if (wordIndex < words.length - 1) {
                    setWordIndex(prev => prev + 1)
                } else {
                    // Reached "FINSTEP" - wait then proceed to reveal
                    setPhase("reveal")
                    setTimeout(() => {
                        setPhase("complete")
                        setTimeout(() => {
                            callOnFinish()
                        }, 1500)
                    }, 3000)
                }
            }, 3000) // Slightly slower for better readability
            return () => clearTimeout(timer)
        }
    }, [phase, wordIndex, words.length, callOnFinish])

    // Handle Skip/Proceed
    const handleProceed = () => {
        setPhase("reveal")
        setTimeout(() => {
            setPhase("complete")
            setTimeout(() => {
                callOnFinish()
            }, 1500)
        }, 3000)
    }

    // Handle Reveal & Exit
    useEffect(() => {
        if (phase === "reveal") {
            const timer = setTimeout(() => {
                // Clear failsafe timeout if it exists
                if (failsafeTimeoutRef.current) {
                    clearTimeout(failsafeTimeoutRef.current)
                    failsafeTimeoutRef.current = null
                }
                setPhase("complete")
                setTimeout(() => {
                    callOnFinish()
                }, 1500)
            }, 4000)
            return () => clearTimeout(timer)
        }
    }, [phase, callOnFinish])

    const getWordStyle = (index: number) => {
        const isFinStep = words[index] === "FINSTEP"
        const colors = [
            "from-[#FFD700] via-[#FF8C00] to-[#FF4500]", // Growth: Gold/Orange
            "from-[#00F5FF] via-[#00E5EE] to-[#00C5CD]", // Clarity: Cyan
            "from-[#FF00FF] via-[#D02090] to-[#8B008B]", // Success: Magenta
            "from-[#FFFFFF] via-[#FFD700] to-[#FFA500]", // FINSTEP: Gold White
        ]
        const glows = [
            "0 0 40px rgba(255, 140, 0, 0.4)",
            "0 0 40px rgba(0, 245, 255, 0.4)",
            "0 0 40px rgba(255, 0, 255, 0.4)",
            "0 0 40px rgba(255, 215, 0, 0.5)", // FINSTEP: Gold White (Subtle)
        ]
        return {
            gradient: colors[index % colors.length],
            glow: glows[index % glows.length],
            isFinStep
        }
    }

    return (
        <AnimatePresence mode="wait">
            {phase !== "complete" && (
                <motion.div
                    key="intro-overlay"
                    className="fixed inset-0 z-[9999] bg-[#0A0A0A] flex items-center justify-center overflow-hidden cursor-pointer"
                    onClick={phase === "narrative" ? handleProceed : undefined}
                    style={{ pointerEvents: isFinished ? "none" : "auto" }}
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1, ease: "easeInOut" }}
                >
                    {/* Phase 1: Atmosphere - Pure Point Light Source (No Disc Object) */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                        {/* 1. OUTER ATMOSPHERE - Large, subtle ambient fill */}
                        <motion.div
                            animate={{ opacity: [0.1, 0.2, 0.1], scale: [1, 1.1, 1] }}
                            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute w-[120vw] h-[120vw] bg-[radial-gradient(circle,rgba(60,30,10,0.4)_0%,transparent_60%)] blur-3xl opacity-20"
                        />

                        {/* 2. MIDDLE GLOW - Warm Orange Aura */}
                        <motion.div
                            animate={{ opacity: [0.3, 0.5, 0.3], scale: [0.9, 1.1, 0.9] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                            className="absolute w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(255,100,0,0.15)_0%,transparent_70%)] blur-[80px]"
                        />

                        {/* 3. INNER GLOW - Intense Gold/Orange Halo */}
                        <motion.div
                            animate={{ opacity: [0.6, 0.8, 0.6], scale: [0.95, 1.05, 0.95] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute w-[300px] h-[300px] rounded-full bg-[radial-gradient(circle,rgba(255,160,60,0.3)_0%,rgba(255,100,0,0.1)_60%,transparent_80%)] blur-[40px]"
                        />


                    </div>

                    {/* Phase 2: Narrative Words - Neon / Colorful */}
                    <AnimatePresence>
                        {phase === "narrative" && wordIndex < words.length && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                                <motion.h2
                                    key={words[wordIndex]}
                                    initial={{ opacity: 0, scale: 0.8, y: 30, filter: "brightness(0.5) blur(10px)" }}
                                    animate={{ opacity: 1, scale: 1, y: 0, filter: "brightness(1.5) blur(0px)" }}
                                    exit={{ opacity: 0, scale: 1.3, y: -30, filter: "brightness(3) blur(15px)" }}
                                    transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
                                    style={{ textShadow: getWordStyle(wordIndex).glow }}
                                    className={cn(
                                        "relative font-black tracking-tighter z-20 whitespace-nowrap text-transparent bg-clip-text bg-gradient-to-br py-4 px-8",
                                        getWordStyle(wordIndex).gradient,
                                        getWordStyle(wordIndex).isFinStep ? "text-7xl md:text-9xl" : "text-6xl md:text-8xl"
                                    )}
                                >
                                    {words[wordIndex]}
                                </motion.h2>

                                {/* Instruction for loop proceed */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 0.4 }}
                                    transition={{ delay: 5 }}
                                    className="absolute bottom-12 left-1/2 -translate-x-1/2 text-white/50 text-xs tracking-widest uppercase pointer-events-none"
                                >
                                    Click anywhere to begin journey
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>

                    {/* Phase 3: Brand Reveal - Logo Only (No text) */}
                    {phase === "reveal" && (
                        <motion.div
                            key="reveal-container"
                            initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                            transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
                            className="relative z-20 flex flex-col items-center"
                        >
                            <AnimatedLogo variant="hero" pulseIcon light hideText={true} />

                            <motion.div
                                initial={{ scaleX: 0, opacity: 0 }}
                                animate={{ scaleX: 1, opacity: 0.3 }}
                                transition={{ delay: 0.8, duration: 1.2, ease: "circOut" }}
                                className="h-[1px] w-[250px] bg-gradient-to-r from-transparent via-white to-transparent mt-12 origin-center will-change-transform"
                            />
                        </motion.div>
                    )}
                </motion.div >
            )}
        </AnimatePresence >
    )
})

IntroOverlay.displayName = 'IntroOverlay'


