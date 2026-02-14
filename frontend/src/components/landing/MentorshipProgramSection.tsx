"use client"

import { motion, useScroll, useTransform, useMotionTemplate, useMotionValue } from "framer-motion"
import Link from "next/link"
import { ArrowRight, Sparkles, Trophy, Zap, TrendingUp, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRef, MouseEvent } from "react"
import { cn } from "@/lib/utils"

export function MentorshipProgramSection() {
    const sectionRef = useRef<HTMLElement>(null)
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start end", "end start"]
    })

    const y = useTransform(scrollYProgress, [0, 1], [100, -100])
    const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0])

    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)

    function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
        const { left, top } = currentTarget.getBoundingClientRect()
        mouseX.set(clientX - left)
        mouseY.set(clientY - top)
    }

    return (
        <section ref={sectionRef} className="py-32 relative overflow-hidden bg-[#050505] selection:bg-brand-primary/30">
            {/* Dynamic Background Grid */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-brand-primary/10 blur-[120px] rounded-full mix-blend-screen" />
            </div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">

                        {/* Text Content */}
                        <div className="space-y-10">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8 }}
                            >
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-brand-primary/20 to-brand-accent/20 border border-brand-primary/20 text-brand-primary text-xs font-bold tracking-widest uppercase mb-8">
                                    <Zap className="w-3 h-3 fill-current" />
                                    <span>Fast-Track Your Career</span>
                                </div>
                                <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-[0.9] mb-6">
                                    UNLOCK <br />
                                    <span className="relative inline-block">
                                        <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-[#FFB703] via-[#FB8500] to-[#FFB703] bg-[200%_auto] animate-gradient">
                                            ELITE STATUS.
                                        </span>
                                        <span className="absolute -inset-1 bg-brand-primary/20 blur-xl -z-10" />
                                    </span>
                                </h2>
                                <p className="text-xl text-white/60 leading-relaxed max-w-lg">
                                    Don't just learn finance. Live it. Get paired with mentors from top-tier firms and gain the insights that textbooks can't teach.
                                </p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.2, duration: 0.8 }}
                                className="flex flex-col sm:flex-row gap-5"
                            >
                                <Link href="/mentorship" className="w-full sm:w-auto">
                                    <Button className="w-full sm:w-auto h-16 px-10 rounded-2xl bg-brand-primary hover:bg-brand-accent text-[#050505] font-black text-lg tracking-wide transition-all hover:scale-105 hover:shadow-[0_0_50px_rgba(255,183,3,0.5)] group relative overflow-hidden">
                                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 transform skew-y-12 origin-bottom" />
                                        <span className="relative flex items-center gap-2">
                                            Apply Now
                                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </span>
                                    </Button>
                                </Link>
                                <div className="flex items-center gap-4 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                                    <div className="flex -space-x-3">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="w-10 h-10 rounded-full bg-zinc-800 border-2 border-[#050505] flex items-center justify-center overflow-hidden">
                                                <div className="w-full h-full bg-gradient-to-br from-zinc-700 to-zinc-900" />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-white font-bold leading-none">500+</span>
                                        <span className="text-xs text-brand-primary uppercase font-bold tracking-wider">Mentors</span>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Visual Card - 3D Tilt Effect */}
                        <motion.div
                            style={{ y }}
                            onMouseMove={handleMouseMove}
                            className="relative group perspective-1000"
                        >
                            <motion.div
                                className="relative z-10 bg-zinc-900/90 backdrop-blur-xl border border-white/10 p-10 rounded-[2.5rem] shadow-2xl overflow-hidden"
                                style={{
                                    background: useMotionTemplate`
                                        radial-gradient(
                                            650px circle at ${mouseX}px ${mouseY}px,
                                            rgba(255,183,3,0.1),
                                            transparent 80%
                                        )
                                    `
                                }}
                            >
                                {/* Card Border Glow */}
                                <div className="absolute inset-0 rounded-[2.5rem] ring-1 ring-inset ring-white/10 group-hover:ring-brand-primary/50 transition-all duration-500" />

                                <div className="space-y-10 relative z-10">
                                    <div className="flex justify-between items-start">
                                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-primary to-brand-accent flex items-center justify-center text-white shadow-lg shadow-brand-primary/20">
                                            <Trophy className="w-10 h-10" strokeWidth={1.5} />
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-xs text-white/40 font-bold uppercase tracking-widest mb-1">Status</span>
                                            <div className="px-3 py-1 rounded-full bg-brand-primary/20 text-brand-primary text-xs font-bold border border-brand-primary/20 animate-pulse">
                                                OPEN FOR APPLICATIONS
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <h3 className="text-3xl font-bold text-white">The Mentorship Edge</h3>
                                        <div className="grid gap-4">
                                            {[
                                                { icon: TrendingUp, text: "Personalized Career Roadmap" },
                                                { icon: Zap, text: "Inside Access to Top Firms" },
                                                { icon: Sparkles, text: "Resume & Interview Prep" },
                                                { icon: CheckCircle2, text: "Lifetime Network Value" }
                                            ].map((item, i) => (
                                                <motion.div
                                                    key={i}
                                                    initial={{ opacity: 0, x: 20 }}
                                                    whileInView={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.1 * i }}
                                                    className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-brand-primary/30 transition-colors group/item"
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-primary group-hover/item:scale-110 transition-transform">
                                                        <item.icon className="w-4 h-4" />
                                                    </div>
                                                    <span className="text-white/80 font-medium">{item.text}</span>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-8 border-t border-white/10 flex items-center justify-between">
                                        <div>
                                            <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Average Salary Bump</div>
                                            <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">+45%</div>
                                        </div>
                                        <div className="h-10 w-px bg-white/10" />
                                        <div>
                                            <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Placement Rate</div>
                                            <div className="text-3xl font-black text-white">94%</div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Background Globs */}
                            <div className="absolute -top-20 -right-20 w-64 h-64 bg-brand-primary/20 rounded-full blur-[80px] animate-pulse-slow" />
                            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-brand-accent/20 rounded-full blur-[80px] animate-pulse-slow delay-1000" />
                        </motion.div>

                    </div>
                </div>
            </div>
        </section>
    )
}
