"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight, UserCheck, Shield, Zap, Target, Brain, Sparkles } from "lucide-react"

export function MentorSection() {
    return (
        <section className="py-32 bg-[#0A0A0A] text-white relative overflow-hidden">
            {/* Purple glow from right edge — radial gradient only, no blur (60fps) */}
            <div
                className="absolute right-0 top-0 bottom-0 w-[60vw] max-w-[800px] pointer-events-none"
                style={{
                    background: "radial-gradient(ellipse 100% 80% at 100% 50%, rgba(168,85,247,0.12) 0%, transparent 60%)",
                }}
            />

            <div className="container mx-auto px-4 relative z-10">
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-brand-primary text-sm font-medium mb-8">
                            <UserCheck className="w-4 h-4" />
                            <span className="text-gray-200">Expert Guidance</span>
                        </div>
                        <h2 className="text-4xl md:text-6xl font-bold mb-8 leading-tight">
                            Why Do You Need a <span className="text-brand-primary">Mentor?</span>
                        </h2>
                        <p className="text-gray-400 text-xl mb-10 leading-relaxed font-light">
                            Mentors shorten learning loops, reduce costly mistakes, and provide the accountability you need to succeed.
                        </p>

                        <div className="flex flex-col gap-8 mb-12 relative">
                            {/* Subtle connecting vertical line */}
                            <div className="absolute left-7 top-7 bottom-7 w-[1px] bg-gradient-to-b from-brand-primary/30 via-white/10 to-transparent z-0 hidden sm:block"></div>

                            {[
                                { title: "Avoid Costly Mistakes", desc: "Learn from experience, not expensive errors.", icon: Shield },
                                { title: "Accelerate Growth", desc: "Reach your financial goals years faster with proven strategies.", icon: Zap },
                                { title: "Gain Absolute Clarity", desc: "Cut through the noise with a clear, personalized roadmap.", icon: Target },
                                { title: "Rewire Your Mindset", desc: "Think, operate, and make decisions like a top 1% investor.", icon: Brain }
                            ].map((item, i) => {
                                const Icon = item.icon;
                                return (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1, duration: 0.5 }}
                                        viewport={{ once: true }}
                                        className="group flex items-start gap-5 cursor-default relative z-10"
                                    >
                                        <div className="relative w-14 h-14 rounded-2xl bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:border-brand-primary/50 group-hover:bg-brand-primary/10 transition-all duration-500 shadow-xl shadow-black/50 z-10">
                                            <Icon className="w-6 h-6 text-gray-400 group-hover:text-brand-primary group-hover:drop-shadow-[0_0_8px_rgba(252,211,77,0.8)] transition-all duration-500" />
                                        </div>
                                        <div className="flex-1 pt-1.5 bg-transparent sm:group-hover:-translate-y-1 transition-transform duration-500">
                                            <h4 className="font-bold text-xl text-white mb-2 group-hover:text-brand-primary transition-colors duration-300">{item.title}</h4>
                                            <p className="text-gray-400 leading-relaxed text-sm sm:text-base">{item.desc}</p>
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            viewport={{ once: true }}
                            className="relative group p-[1px] rounded-2xl overflow-hidden w-full"
                        >
                            {/* Animated gradient border highlight on hover */}
                            <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/0 via-brand-primary/50 to-brand-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-sm" />
                            <div className="absolute inset-0 border border-white/10 rounded-2xl group-hover:border-white/20 transition-colors duration-500" />

                            <div className="relative bg-black/60 backdrop-blur-2xl rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 sm:gap-8 border border-white/5 group-hover:bg-black/40 transition-colors duration-500">
                                <div className="flex-1 text-center sm:text-left">
                                    <h3 className="text-xl sm:text-2xl font-bold text-white flex items-center justify-center sm:justify-start gap-2 mb-2">
                                        <Sparkles className="w-5 h-5 text-brand-primary drop-shadow-[0_0_8px_rgba(252,211,77,0.8)]" />
                                        Take the Next Step
                                    </h3>
                                    <p className="text-gray-400 text-sm">
                                        Book a consultation and start your journey today.
                                    </p>
                                </div>
                                <a
                                    href="https://www.facebook.com/tri.dinhbui02"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="shrink-0 w-full sm:w-auto"
                                >
                                    <Button size="lg" className="h-14 px-8 bg-brand-primary hover:bg-brand-primary/90 text-black font-bold text-lg rounded-xl w-full sm:w-auto group/btn transition-all duration-300 shadow-[0_0_20px_rgba(252,211,77,0.1)] hover:shadow-[0_0_30px_rgba(252,211,77,0.3)] hover:-translate-y-1">
                                        Connect Now <ArrowRight className="ml-2 w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                                    </Button>
                                </a>
                            </div>
                        </motion.div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
                        whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, ease: "linear" }}
                        className="relative"
                    >
                        {/* Warm light glowing inside — radial gradient only, no shapes (60fps) */}
                        <div className="relative w-full aspect-square flex items-center justify-center">
                            <motion.div
                                className="absolute inset-0 min-w-[320px] min-h-[320px] rounded-full z-0"
                                animate={{
                                    opacity: [0.6, 1, 0.6],
                                    scale: [0.95, 1.15, 0.95],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                                style={{
                                    background: "radial-gradient(circle at center, rgba(255,255,240,0.95) 0%, rgba(255,220,150,0.6) 25%, rgba(255,180,100,0.3) 50%, rgba(255,160,80,0.1) 75%, transparent 85%)",
                                    filter: "blur(25px)"
                                }}
                            />
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-4 z-10 pointer-events-none">
                                <div className="text-7xl font-black text-black/80 tracking-tighter mix-blend-overlay">GROWTH</div>
                                <div className="text-8xl font-black text-black/90 tracking-tighter mix-blend-overlay">CLARITY</div>
                                <div className="text-7xl font-black text-white/5 tracking-tighter mix-blend-overlay">SUCCESS</div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Bottom Gradient for seamless transition */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none" />
        </section>
    )
}
