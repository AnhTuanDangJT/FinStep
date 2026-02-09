"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { useRef } from "react"
import { cn } from "@/lib/utils"
import { TrendingUp, ShieldCheck, Users } from "lucide-react"
import Image from "next/image"


export function LandingBackground({ children }: { children: React.ReactNode }) {
    const containerRef = useRef<HTMLDivElement>(null)
    const { scrollY } = useScroll()

    // Parallax layers
    const layer1Y = useTransform(scrollY, [0, 5000], [0, 200])
    const layer2Y = useTransform(scrollY, [0, 5000], [0, -150])

    return (
        <div ref={containerRef} className="force-light relative min-h-screen w-full bg-brand-bg transition-colors duration-300 overflow-hidden selection:bg-brand-primary/20 selection:text-brand-text">

            {/* --- Fixed Background Layers --- */}
            <div className="fixed inset-0 z-0">
                <style>{`
                    /* Compositor-only keyframes (transform/opacity) for 60fps - no blur, box-shadow, or background-position */
                    @keyframes blob-spin {
                        0% { transform: rotate(0deg) scale(1); }
                        33% { transform: rotate(120deg) scale(1.08); }
                        66% { transform: rotate(240deg) scale(0.96); }
                        100% { transform: rotate(360deg) scale(1); }
                    }
                    @keyframes blob-spin-reverse {
                        0% { transform: rotate(360deg) scale(1); }
                        50% { transform: rotate(180deg) scale(1.1); }
                        100% { transform: rotate(0deg) scale(1); }
                    }
                    @keyframes float-slow {
                        0%, 100% { transform: translateY(0px); }
                        50% { transform: translateY(-20px); }
                    }
                    .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
                    .animate-float-slower { animation: float-slow 12s ease-in-out infinite reverse; }
                `}</style>

                {/* 1. Base Gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#FFFBF5] via-[#FFF5EB] to-[#F5F5F0]" />

                {/* 2. Ambient spots: no blur (causes paint jank) - use solid soft circles with transform only */}
                <div
                    className="absolute -top-[10%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-brand-primary/[0.06] will-change-transform"
                    style={{ animation: "blob-spin 60s linear infinite" }}
                />
                <div
                    className="absolute bottom-[10%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-brand-accent/[0.06] will-change-transform"
                    style={{ animation: "blob-spin-reverse 75s linear infinite" }}
                />

                {/* 3. Grain - static, no animation */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-multiply"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
                />

                {/* 4. Grid - static (no grid-drift to avoid background-position animation) */}
                <motion.div style={{ y: layer1Y }} className="absolute inset-0 opacity-[0.03]">
                    <div
                        className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]"
                    />
                </motion.div>

                {/* 5. Abstract "Ascent" Lines (Parallax Layer 2) */}
                <motion.div style={{ y: layer2Y }} className="absolute inset-0 pointer-events-none overflow-hidden">
                    {/* Top Right Curves - Symbolizing Growth */}
                    <svg className="absolute -top-[10%] -right-[5%] w-[60vw] h-[80vh] opacity-[0.15]" viewBox="0 0 600 800" fill="none">
                        <path d="M-100 800 C 100 600, 300 300, 700 0" stroke="currentColor" strokeWidth="1.5" className="text-brand-primary" />
                        <path d="M-50 800 C 150 620, 350 320, 700 50" stroke="currentColor" strokeWidth="1" className="text-brand-primary" />
                        <path d="M0 800 C 200 640, 400 340, 700 100" stroke="currentColor" strokeWidth="0.5" className="text-brand-primary" />
                    </svg>

                    {/* Bottom Left Curves - Foundation */}
                    <svg className="absolute -bottom-[20%] -left-[10%] w-[50vw] h-[60vh] opacity-[0.1]" viewBox="0 0 500 600" fill="none">
                        <path d="M-100 600 C 100 400, 300 200, 600 0" stroke="currentColor" strokeWidth="2" className="text-brand-accent" />
                        <path d="M-50 600 C 130 420, 330 220, 600 50" stroke="currentColor" strokeWidth="1" className="text-brand-accent" />
                    </svg>
                </motion.div>

                {/* 6. Decorative orbs - no backdrop-blur for 60fps */}
                <motion.div style={{ y: layer1Y }} className="absolute inset-0 pointer-events-none">
                    <div className="absolute bottom-[20%] right-[8%] w-32 h-32 rounded-full border border-brand-primary/10 bg-brand-primary/5 opacity-40 animate-float-slower" />
                </motion.div>

                {/* 7. Floating stats - solid bg instead of backdrop-blur for performance */}
                <motion.div style={{ y: layer2Y }} className="absolute inset-0 pointer-events-none hidden lg:block">
                    <div className="absolute top-[20%] right-[3%] animate-float-slow z-20">
                        <div className="p-3 rounded-2xl flex items-center gap-3 border border-white/60 bg-white/95 shadow-xl rotate-6">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 shadow-inner">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-[10px] text-[#2B1C14]/60 font-bold uppercase tracking-wider">Monthly Yield</div>
                                <div className="text-base font-black text-[#2B1C14]">+12.4%</div>
                            </div>
                        </div>
                    </div>

                    {/* Middle Left - Security Stat */}
                    <div className="absolute top-[55%] left-[2%] animate-float-slower z-20">
                        <div className="p-3 rounded-2xl flex items-center gap-3 border border-white/60 bg-white/95 shadow-xl -rotate-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shadow-inner">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div className="pr-2">
                                <div className="text-[10px] text-[#2B1C14]/60 font-bold uppercase tracking-wider">Bank Grade</div>
                                <div className="text-base font-black text-[#2B1C14]">Security</div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* 8. Vignette & Edge Framing (Curtains) */}
                <div className="absolute inset-y-0 left-0 w-[150px] bg-gradient-to-r from-brand-bg to-transparent pointer-events-none z-10" />
                <div className="absolute inset-y-0 right-0 w-[150px] bg-gradient-to-l from-brand-bg to-transparent pointer-events-none z-10" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.02)_100%)] pointer-events-none" />
            </div>

            {/* --- Main Content --- */}
            <div className="relative z-10 w-full">
                {children}
            </div>
        </div>
    )
}
