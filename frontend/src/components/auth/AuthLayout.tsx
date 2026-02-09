"use client"

import * as React from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { AnimatedLogo } from "@/components/ui/AnimatedLogo"
import Image from "next/image"

export function AuthLayout({ children }: { children: React.ReactNode }) {
    // 'initial' | 'hero' | 'settled'
    const [animationState, setAnimationState] = React.useState<'initial' | 'hero' | 'settled'>('initial')
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)

        // Stage 1: Trending Arrow Movement (increasing)
        const timer1 = setTimeout(() => {
            setAnimationState('hero')
        }, 2000)

        // Stage 2: Reveal Text next to it (without moving yet)
        const timer2 = setTimeout(() => {
            setAnimationState('settled')
        }, 4000)

        return () => {
            clearTimeout(timer1)
            clearTimeout(timer2)
        }
    }, [])

    return (
        <div className="min-h-screen w-full flex overflow-hidden relative selection:bg-brand-primary/20 force-light bg-[var(--bg-primary)]">
            {/* 
                FULL PAGE LUXURY POLISH 
                Noise Overlay + Vignette for that premium cinematic feel
            */}
            <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.03] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
            <div className="fixed inset-0 pointer-events-none z-[99] bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.1)_100%)]" />

            {/* Harmonized Background (Right Side Base) */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#FFF7ED] to-[#FFE8D6] -z-10" />

            {/* 
        PERSISTENT LOGO LAYER 
        Instead of conditionally rendering two different logos, we render ONE that moves.
        This guarantees it never disappears.
      */}
            <motion.div
                className="fixed z-50 flex items-center justify-center font-bold top-0 left-0"
                initial={false}
                animate={animationState === 'settled' ? "settled" : "hero"}
                variants={{
                    hero: {
                        x: "50vw",
                        y: "50vh",
                        translateX: "-50%",
                        translateY: "-50%",
                        scale: 1.5,
                        transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
                    },
                    settled: {
                        x: "3rem",
                        y: "3rem",
                        translateX: "0%",
                        translateY: "0%",
                        scale: 1,
                        transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
                    }
                }}
            >
                <Link href="/" className="flex items-center justify-center outline-none rounded-xl focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2" aria-label="FinStep - Go to home">
                    {/* UNIQUE layoutIdPrefix to avoid conflict with mobile logo */}
                    <AnimatedLogo
                        variant="compact"
                        light={true}
                        layoutIdPrefix="auth-hero"
                        pulseIcon={animationState === 'initial'}
                    />
                </Link>
            </motion.div>


            {/* Left Panel - Branding (Desktop) - Parallax Entrance */}
            <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "0%" }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0 }}
                className="hidden lg:flex w-5/12 relative bg-gradient-to-br from-[#3a2a20] to-[#2a1a10] text-white overflow-hidden flex-col justify-between p-8 z-20 shadow-2xl"
            >
                {/* Static Background Image - Removed Ken Burns for Performance */}
                <div className="absolute inset-0 z-0">
                    <Image
                        src="/images/auth-bg.png"
                        alt="Finance Background"
                        fill
                        sizes="(min-width: 1024px) 42vw, 0px"
                        className="object-cover opacity-50 mix-blend-soft-light"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#3a2a20]/90 via-[#3a2a20]/50 to-[#1a120e]/90" />
                </div>

                {/* Content Placeholder */}
                <div className="relative z-20 h-10 w-10" />

                <div className="relative z-20 max-w-md mt-auto mb-12">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={animationState === 'settled' ? { opacity: 1, y: 0 } : {}}
                        transition={{ delay: 0.6, duration: 1, ease: "easeOut" }}
                    >
                        <h2 className="text-3xl lg:text-4xl font-bold leading-tight tracking-tight mb-6 text-white drop-shadow-2xl">
                            Your path to <span className="text-[#FFB703]">financial confidence</span> starts here.
                        </h2>
                    </motion.div>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={animationState === 'settled' ? { opacity: 1, y: 0 } : {}}
                        transition={{ delay: 0.9, duration: 0.8 }}
                        className="text-white/70 text-lg leading-relaxed font-light tracking-wide italic"
                    >
                        Join thousands of professionals climbing the career ladder with FinStep&apos;s intelligent growth tracking.
                    </motion.p>
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    className="relative z-20 text-[10px] text-white/30 font-medium tracking-[0.2em] uppercase"
                >
                    Premium Financial Intelligence • © 2026
                </motion.div>
            </motion.div>

            {/* Right Panel - Form Area */}
            <div className="flex-1 flex flex-col justify-center items-center p-4 lg:p-8 relative z-10 overflow-hidden">
                {/* STATIC BACKGROUND LAYERING - Removed all live motion */}
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <div className="absolute inset-x-0 inset-y-0 z-0 mix-blend-multiply opacity-70">
                        <Image
                            src="/images/auth-pattern.png"
                            alt="Geometric Pattern"
                            fill
                            sizes="100vw"
                            loading="eager"
                            className="object-cover contrast-[200%] saturate-[150%] brightness-[85%]"
                        />
                    </div>

                    <div className="absolute -top-[10%] -right-[10%] w-[600px] h-[600px] bg-brand-primary/10 rounded-full blur-[100px] mix-blend-multiply opacity-40" />
                    <div className="absolute bottom-[20%] -left-[10%] w-[500px] h-[500px] bg-brand-soft/20 rounded-full blur-[80px] mix-blend-multiply opacity-30" />
                </div>

                {animationState === 'settled' && (
                    <SpotlightCard>
                        {children}
                    </SpotlightCard>
                )}
            </div>
        </div>
    )
}

function SpotlightCard({ children }: { children: React.ReactNode }) {
    const divRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
        const div = divRef.current
        if (!div) return

        const handleMouseMove = (e: MouseEvent) => {
            const rect = div.getBoundingClientRect()
            const x = e.clientX - rect.left
            const y = e.clientY - rect.top
            div.style.setProperty('--mouse-x', `${x}px`)
            div.style.setProperty('--mouse-y', `${y}px`)
        }

        const handleMouseEnter = () => div.style.setProperty('--spotlight-opacity', '1')
        const handleMouseLeave = () => div.style.setProperty('--spotlight-opacity', '0')

        div.addEventListener('mousemove', handleMouseMove)
        div.addEventListener('mouseenter', handleMouseEnter)
        div.addEventListener('mouseleave', handleMouseLeave)

        return () => {
            div.removeEventListener('mousemove', handleMouseMove)
            div.removeEventListener('mouseenter', handleMouseEnter)
            div.removeEventListener('mouseleave', handleMouseLeave)
        }
    }, [])

    return (
        <motion.div
            ref={divRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            className="w-full max-w-md relative z-10 isolate-layer"
        >
            {/* Mobile Logo Fallback */}
            <div className="lg:hidden flex justify-center mb-8">
                <Link href="/" className="outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 rounded-xl" aria-label="FinStep - Go to home">
                    <AnimatedLogo variant="compact" />
                </Link>
            </div>

            {/* Premium True Glass Card */}
            <div className="relative bg-white/90 backdrop-blur-md border border-[#2B1C14]/10 shadow-xl shadow-black/5 rounded-2xl p-6 lg:p-8 overflow-hidden ring-1 ring-white/80 group interactive-spotlight">

                {/* Top Edge Glow */}
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-50" />
                <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-brand-primary/20 to-transparent blur-sm rotate-180" />



                {children}
            </div>

            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="text-center text-xs text-[#3A2A20]/70 mt-8 font-medium tracking-wide uppercase"
            >
                Secure • Encrypted • Private
            </motion.p>
        </motion.div >
    )
}
