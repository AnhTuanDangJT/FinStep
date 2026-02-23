"use client"

import { motion } from "framer-motion"
import { BookOpen, PenTool, CheckCircle, UserCheck, Users } from "lucide-react"

export function HowItWorksSection() {
    const steps = [
        {
            icon: BookOpen,
            title: "Verified Blogs",
            description: "Curated financial knowledge from experts."
        },
        {
            icon: CheckCircle,
            title: "Admin Moderation",
            description: "High-quality content filtered by our team."
        },
        {
            icon: UserCheck,
            title: "Mentor Connection",
            description: "Direct access to industry professionals."
        },
        {
            icon: PenTool,
            title: "AI Career Guidance",
            description: "Intelligent tools to plan your finance career."
        },
        {
            icon: Users,
            title: "Community Driven Finance Learning",
            description: "Grow together in a supportive environment."
        }
    ]

    return (
        <section className="py-32 relative z-10">
            <div className="container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-24"
                >
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 text-[#2B1C14]">How It Works</h2>
                    <p className="text-[#3A2A20]/80 text-xl max-w-2xl mx-auto font-light">
                        A structured path to financial literacy and community contribution.
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-8 relative">
                    {/* Animated Connector Line (Desktop) */}
                    <div className="hidden md:block absolute top-[60px] left-[10%] right-[10%] h-[2px] bg-[#FF7A00]/10 -z-0 overflow-hidden">
                        <motion.div
                            initial={{ x: "-100%" }}
                            whileInView={{ x: "100%" }}
                            transition={{ duration: 2, ease: "linear", repeat: Infinity }}
                            className="w-full h-full bg-gradient-to-r from-transparent via-[#FF7A00]/50 to-transparent"
                        />
                    </div>

                    {steps.map((step, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: index * 0.3 }}
                            className="relative z-10 flex flex-col items-center text-center group"
                        >
                            <div className="w-24 h-24 mb-8 relative">
                                <div className="absolute inset-0 bg-white rounded-full shadow-xl shadow-brand-primary/5 flex items-center justify-center text-[#FF7A00] border border-[#FF7A00]/10 group-hover:scale-110 transition-transform duration-500">
                                    <step.icon className="w-10 h-10 transition-transform duration-500 group-hover:rotate-12" />
                                </div>
                                {/* Glow Effect behind icon */}
                                <div className="absolute inset-0 bg-[#FF7A00]/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
                            </div>

                            <h3 className="text-2xl font-bold mb-4 text-[#2B1C14]">{step.title}</h3>
                            <p className="text-[#3A2A20]/80 text-lg leading-relaxed max-w-xs">{step.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}
