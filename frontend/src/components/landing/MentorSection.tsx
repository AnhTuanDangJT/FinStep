"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight, UserCheck } from "lucide-react"

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
                            Accelerate your growth with <span className="text-brand-primary">personalized mentorship.</span>
                        </h2>
                        <p className="text-gray-400 text-xl mb-10 leading-relaxed font-light">
                            Mentors shorten learning loops, reduce costly mistakes, and provide the accountability you need to succeed.
                        </p>

                        <div className="grid grid-cols-2 gap-4 mb-10">
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                                <h4 className="font-bold text-white mb-1">Career Speed</h4>
                                <p className="text-xs text-gray-400">Skip trial & error with expert paths.</p>
                            </div>
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                                <h4 className="font-bold text-white mb-1">Network</h4>
                                <p className="text-xs text-gray-400">Access exclusive industry connections.</p>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-2xl p-8 border border-white/10 shadow-2xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-brand-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                            <div className="relative z-10">
                                <h3 className="text-2xl font-semibold mb-3">Connect with Bùi Đình Trí</h3>
                                <p className="text-gray-400 mb-8">
                                    Ready to take the next step? Reach out directly for a consultation.
                                </p>
                                <a
                                    href="https://www.facebook.com/tri.dinhbui02#"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Button size="lg" className="h-14 px-8 text-lg bg-white text-black hover:bg-gray-200 font-bold w-full sm:w-auto transition-transform hover:-translate-y-1 shadow-lg shadow-white/10">
                                        Connect on Facebook <ArrowRight className="ml-2 w-5 h-5" />
                                    </Button>
                                </a>
                            </div>
                        </div>
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
