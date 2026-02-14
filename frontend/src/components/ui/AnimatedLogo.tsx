"use client"

import * as React from "react"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"
import Image from "next/image"

interface AnimatedLogoProps {
    variant?: 'hero' | 'compact'
    className?: string
    layoutIdPrefix?: string
    light?: boolean
    pulseIcon?: boolean
    /** Use dark text so the name is visible on light backgrounds (e.g. landing hero) */
    onLightBackground?: boolean
    hideIcon?: boolean
    hideText?: boolean
}

export const AnimatedLogo = React.memo(function AnimatedLogo({
    variant = 'compact',
    className,
    layoutIdPrefix = 'brand',
    light = false,
    pulseIcon = false,
    onLightBackground = false,
    hideIcon = false,
    hideText = false
}: AnimatedLogoProps) {
    const isHero = variant === 'hero'

    return (
        <motion.div
            layoutId={`${layoutIdPrefix}-logo-container`}
            className={cn(
                "flex items-center select-none z-50 gap-4",
                isHero ? "flex-col justify-center relative min-h-[160px] min-w-[300px]" : "",
                className,
                isHero ? "text-6xl md:text-8xl" : "text-2xl"
            )}
            transition={{
                type: "spring",
                stiffness: 70,
                damping: 15,
                mass: 1
            }}
        >
            {/* ICON UNIT - The Anchor that stays centered during reveal */}
            {!hideIcon && (
                <motion.div
                    layoutId={`${layoutIdPrefix}-icon-bg`}
                    animate={{
                        scale: 1 // Keep stationary
                    }}
                    transition={{
                        duration: 0.5
                    }}
                    className={cn(
                        "flex items-center justify-center rounded-xl bg-white shadow-lg relative shrink-0",
                        isHero
                            ? "absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 md:w-80 md:h-80 rounded-full bg-white/40 shadow-[0_0_100px_40px_rgba(255,255,255,0.4)] z-0 border border-white/20"
                            : "w-16 h-16 shadow-brand-primary/20",
                        light && !isHero && "shadow-none ring-2 ring-white/20"
                    )}
                >
                    <style>{`
                        @keyframes float-lux {
                            0%, 100% { transform: translateY(3%) scale(0.98); }
                            50% { transform: translateY(-3%) scale(1.02); }
                        }
                    `}</style>
                    {/* The "Trending" Arrow Animation - CSS Keyframes for Performance */}
                    <div
                        className={cn(
                            "w-full h-full flex items-center justify-center transition-transform duration-700 will-change-transform",
                            pulseIcon && "animate-[float-lux_4s_ease-in-out_infinite]"
                        )}
                    >
                        <div className={cn("transition-all duration-700 relative", "w-full h-full")}>
                            <Image
                                src="/finstep-logo.png"
                                alt="FinStep Logo"
                                fill
                                sizes="128px"
                                className="object-contain scale-150"
                                priority
                            />
                        </div>
                    </div>
                </motion.div>
            )}

            {/* TEXT UNIT - Reveal to the right WITHOUT shifting the anchor icon */}
            {!hideText && (
                <div className={cn("relative z-10", isHero && "flex justify-center w-full")}>
                    <motion.div
                        initial={{ opacity: 0, x: isHero ? 0 : 8, y: isHero ? 20 : 0 }}
                        animate={{ opacity: 1, x: 0, y: 0 }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        className={cn(
                            "whitespace-nowrap overflow-visible pointer-events-none",
                            isHero ? "relative text-center" : "relative"
                        )}
                    >
                        <style>{`
                            @keyframes glow-pulse {
                                0%, 100% { filter: drop-shadow(0 0 2px rgba(255,140,0,0.3)) brightness(1); }
                                50% { filter: drop-shadow(0 0 8px rgba(255,140,0,0.5)) brightness(1.1); }
                            }
                        `}</style>
                        <motion.span
                            layoutId={`${layoutIdPrefix}-text`}
                            className={cn(
                                "font-bold",
                                isHero && "text-transparent bg-clip-text bg-gradient-to-r from-[#FFD700] via-[#FF8C00] to-[#FF4500] animate-[glow-pulse_3s_ease-in-out_infinite]",
                                !isHero && !onLightBackground && "text-brand-text",
                                !isHero && onLightBackground && "text-[#2B1C14]"
                            )}
                            style={{
                                color: !isHero && light && !onLightBackground ? '#ffffff' : undefined,
                            }}
                        >
                            FinStep
                        </motion.span>
                    </motion.div>
                </div>
            )}
        </motion.div >
    )
})

AnimatedLogo.displayName = 'AnimatedLogo'
