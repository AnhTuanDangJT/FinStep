"use client"

import * as React from "react"
import { useEffect, useState, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AnimatedLogo } from "@/components/ui/AnimatedLogo"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"

export const IntroOverlay = React.memo(function IntroOverlay({ onFinish }: { onFinish: () => void }) {
    const [phase, setPhase] = useState<"atmosphere" | "narrative" | "reveal" | "complete">("atmosphere")
    const [wordIndex, setWordIndex] = useState(0)
    const [isFinished, setIsFinished] = useState(false)
    const words = ["GROWTH", "CLARITY", "SUCCESS", "FINSTEP"]
    const onFinishRef = useRef(onFinish)
    const failsafeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const onFinishCalledRef = useRef(false)

    useEffect(() => {
        onFinishRef.current = onFinish
    }, [onFinish])

    const callOnFinish = useCallback(() => {
        if (onFinishCalledRef.current) return
        onFinishCalledRef.current = true
        setIsFinished(true)
        if (failsafeTimeoutRef.current) {
            clearTimeout(failsafeTimeoutRef.current)
        }
        onFinishRef.current()
    }, [])

    useEffect(() => {
        const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        if (prefersReducedMotion) {
            callOnFinish()
            return
        }

        // FASTER: Initial delay 600ms (was 2000ms)
        const timer1 = setTimeout(() => {
            setPhase("narrative")
        }, 600)

        // FASTER: Failsafe 10s (was 30s)
        failsafeTimeoutRef.current = setTimeout(() => {
            setPhase("complete")
            callOnFinish()
        }, 10000)

        return () => {
            clearTimeout(timer1)
            if (failsafeTimeoutRef.current) clearTimeout(failsafeTimeoutRef.current)
        }
    }, [callOnFinish])

    // Narrative Sequence
    useEffect(() => {
        if (phase === "narrative") {
            // FASTER: Word interval 900ms (was 3000ms)
            const timer = setTimeout(() => {
                if (wordIndex < words.length - 1) {
                    setWordIndex(prev => prev + 1)
                } else {
                    // Reached "FINSTEP"
                    setPhase("reveal")
                    // FASTER: Wait before complete 1200ms (was 3000ms)
                    setTimeout(() => {
                        setPhase("complete")
                        // FASTER: Exit delay 500ms (was 1500ms)
                        setTimeout(callOnFinish, 500)
                    }, 1200)
                }
            }, 900)
            return () => clearTimeout(timer)
        }
    }, [phase, wordIndex, words.length, callOnFinish])

    // Skip / Proceed Immediate
    const handleSkip = (e?: React.MouseEvent) => {
        e?.stopPropagation()
        callOnFinish()
    }

    // Handle Reveal Phase
    useEffect(() => {
        if (phase === "reveal") {
            // FASTER: Reveal duration 2000ms max (was 4000ms) mechanism cleanup
            const timer = setTimeout(() => {
                setPhase("complete")
                setTimeout(callOnFinish, 500)
            }, 2000)
            return () => clearTimeout(timer)
        }
    }, [phase, callOnFinish])

    const getWordStyle = (index: number) => {
        const isFinStep = words[index] === "FINSTEP"
        const colors = [
            "from-[#FFD700] via-[#FF8C00] to-[#FF4500]", // Growth
            "from-[#00F5FF] via-[#00E5EE] to-[#00C5CD]", // Clarity
            "from-[#FF00FF] via-[#D02090] to-[#8B008B]", // Success
            "from-[#FFFFFF] via-[#FFD700] to-[#FFA500]", // FINSTEP
        ]
        const glows = [
            "0 0 40px rgba(255, 140, 0, 0.4)",
            "0 0 40px rgba(0, 245, 255, 0.4)",
            "0 0 40px rgba(255, 0, 255, 0.4)",
            "0 0 40px rgba(255, 215, 0, 0.5)",
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
                    className="fixed inset-0 z-[9999] bg-[#0A0A0A] flex items-center justify-center overflow-hidden cursor-pointer touch-none"
                    onClick={handleSkip}
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                >
                    {/* Skip Button */}
                    <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute top-6 right-6 z-[10000] text-white/50 hover:text-white hover:bg-white/10 px-4 py-2 rounded-full text-xs font-bold tracking-widest uppercase transition-all flex items-center gap-2"
                        onClick={handleSkip}
                    >
                        Skip <ChevronRight className="w-3 h-3" />
                    </motion.button>

                    {/* Atmosphere */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                        <motion.div
                            animate={{ opacity: [0.1, 0.2, 0.1], scale: [1, 1.1, 1] }}
                            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute w-[120vw] h-[120vw] bg-[radial-gradient(circle,rgba(60,30,10,0.4)_0%,transparent_60%)] blur-3xl opacity-20"
                        />
                        <motion.div
                            animate={{ opacity: [0.3, 0.5, 0.3], scale: [0.9, 1.1, 0.9] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                            className="absolute w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(255,100,0,0.15)_0%,transparent_70%)] blur-[80px]"
                        />
                    </div>

                    {/* Narrative Words */}
                    <AnimatePresence mode="popLayout">
                        {phase === "narrative" && wordIndex < words.length && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                                <motion.h2
                                    key={words[wordIndex]}
                                    initial={{ opacity: 0, scale: 0.8, y: 30, filter: "brightness(0.5) blur(10px)" }}
                                    animate={{ opacity: 1, scale: 1, y: 0, filter: "brightness(1.5) blur(0px)" }}
                                    exit={{ opacity: 0, scale: 1.3, y: -30, filter: "brightness(3) blur(15px)" }}
                                    transition={{ duration: 0.8, ease: "backOut" }} // Faster transition
                                    style={{ textShadow: getWordStyle(wordIndex).glow }}
                                    className={cn(
                                        "relative font-black tracking-tighter z-20 whitespace-nowrap text-transparent bg-clip-text bg-gradient-to-br py-4 px-8 text-center",
                                        getWordStyle(wordIndex).gradient,
                                        getWordStyle(wordIndex).isFinStep ? "text-6xl md:text-9xl" : "text-5xl md:text-8xl"
                                    )}
                                >
                                    {words[wordIndex]}
                                </motion.h2>

                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 0.4 }}
                                    transition={{ delay: 2 }}
                                    className="absolute bottom-12 left-1/2 -translate-x-1/2 text-white/50 text-[10px] tracking-[0.2em] uppercase pointer-events-none whitespace-nowrap"
                                >
                                    Tap to skip
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>

                    {/* Brand Reveal */}
                    {phase === "reveal" && (
                        <motion.div
                            key="reveal-container"
                            initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                            transition={{ duration: 1, ease: "circOut" }}
                            className="relative z-20 flex flex-col items-center"
                        >
                            <AnimatedLogo variant="hero" pulseIcon light hideText={true} />
                            <motion.div
                                initial={{ scaleX: 0, opacity: 0 }}
                                animate={{ scaleX: 1, opacity: 0.3 }}
                                transition={{ delay: 0.2, duration: 0.8 }}
                                className="h-[1px] w-[200px] bg-gradient-to-r from-transparent via-white to-transparent mt-8"
                            />
                        </motion.div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    )
})

IntroOverlay.displayName = 'IntroOverlay'


