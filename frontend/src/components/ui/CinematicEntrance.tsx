"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"

export const CinematicEntrance = React.memo(function CinematicEntrance() {
    const [isVisible, setIsVisible] = React.useState(false)
    const [isMounted, setIsMounted] = React.useState(false)

    React.useEffect(() => {
        try {
            // Check session storage to only run once per session (may throw in private/restricted contexts)
            const hasVisited = typeof sessionStorage !== "undefined"
                ? sessionStorage.getItem("finstep_entrance_played")
                : null

            // Respect prefers-reduced-motion
            const prefersReducedMotion = typeof window !== "undefined" && window.matchMedia
                ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
                : false

            if (!hasVisited && !prefersReducedMotion) {
                setIsVisible(true)
            }
        } catch {
            // Fallback: skip entrance if storage/media unavailable
        } finally {
            setIsMounted(true)
        }
    }, [])

    const handleAnimationComplete = () => {
        setIsVisible(false)
        try {
            if (typeof sessionStorage !== "undefined") {
                sessionStorage.setItem("finstep_entrance_played", "true")
            }
        } catch {
            // Ignore storage errors
        }
    }

    if (!isMounted || !isVisible) return null

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className="fixed inset-0 z-[9999] pointer-events-none flex isolate-layer"
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1, delay: 0.5 }}
                >
                    {/* LEFT DOOR */}
                    <motion.div
                        initial={{ x: 0 }}
                        animate={{ x: "-100%" }}
                        transition={{
                            duration: 2.5,
                            ease: [0.77, 0, 0.175, 1], // Heavy, premium easing
                            delay: 1.5, // Tension delay
                        }}
                        onAnimationComplete={handleAnimationComplete}
                        className="h-full w-1/2 bg-[#1a120e] relative flex items-center justify-end overflow-hidden border-r border-white/5 active-door"
                    >
                        {/* THE BRAND PATTERN ON LEFT DOOR */}
                        <div className="absolute inset-0 opacity-15 transform scale-110">
                            <Image
                                src="/images/auth-pattern.png"
                                alt="Pattern"
                                fill
                                sizes="50vw"
                                className="object-cover contrast-[150%] saturate-[50%] brightness-[40%] mix-blend-screen"
                                priority
                            />
                        </div>
                        {/* Texture/Grain Overlay */}
                        <div className="absolute inset-0 opacity-[0.05] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
                        {/* Depth Shadow near seam */}
                        <div className="absolute inset-y-0 right-0 w-64 bg-gradient-to-l from-black/60 to-transparent" />
                    </motion.div>

                    {/* RIGHT DOOR */}
                    <motion.div
                        initial={{ x: 0 }}
                        animate={{ x: "100%" }}
                        transition={{
                            duration: 2.5,
                            ease: [0.77, 0, 0.175, 1],
                            delay: 1.5,
                        }}
                        className="h-full w-1/2 bg-[#1a120e] relative flex items-center justify-start overflow-hidden border-l border-white/5 active-door"
                    >
                        {/* THE BRAND PATTERN ON RIGHT DOOR */}
                        <div className="absolute inset-0 opacity-15 transform scale-110">
                            <Image
                                src="/images/auth-pattern.png"
                                alt="Pattern"
                                fill
                                sizes="50vw"
                                className="object-cover contrast-[150%] saturate-[50%] brightness-[40%] mix-blend-screen"
                                priority
                            />
                        </div>
                        {/* Texture/Grain Overlay */}
                        <div className="absolute inset-0 opacity-[0.05] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
                        {/* Depth Shadow near seam */}
                        <div className="absolute inset-y-0 left-0 w-64 bg-gradient-to-r from-black/60 to-transparent" />
                    </motion.div>

                    {/* AGGRESSIVE SIMPLIFICATION: Removed Journey Light Flare and complex scales */}

                    {/* CENTRAL SEAM GLOW (Anticipation Pulse) - Fastened for responsiveness */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{
                            opacity: [0, 0.4, 0],
                        }}
                        transition={{
                            duration: 1,
                            delay: 1.2,
                        }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1px] h-[40vh] bg-brand-primary z-20"
                    />

                    {/* CORE LIGHT STREAK (The 'Path') - Simplified to Opacity Only */}
                    <motion.div
                        initial={{ opacity: 0, x: "-50%", y: "-50%" }}
                        animate={{
                            opacity: [0, 0.8, 0],
                        }}
                        transition={{
                            duration: 1.5,
                            delay: 1.4
                        }}
                        className="absolute top-1/2 left-1/2 bg-white z-30 w-[1px] h-screen will-change-transform"
                    />
                </motion.div>
            )}
        </AnimatePresence>
    )
})

CinematicEntrance.displayName = 'CinematicEntrance'
