"use client"

import { motion } from "framer-motion"
import { Shield, Lock, EyeOff } from "lucide-react"

export function TrustSection() {
    const features = [
        {
            icon: Shield,
            title: "Secure",
            description: "Industry-standard security protocols to protect your data."
        },
        {
            icon: Lock,
            title: "Encrypted",
            description: "End-to-end encryption for all sensitive communication."
        },
        {
            icon: EyeOff,
            title: "Private",
            description: "Your financial journey remains confidential and under your control."
        }
    ]

    return (
        <section className="py-24 relative z-10">
            <div className="container mx-auto px-4">
                <div className="flex flex-wrap justify-center gap-8 md:gap-12">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            whileHover={{ y: -5 }}
                            className="flex items-center gap-5 p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-brand-primary/5 transition-all duration-300 w-full md:w-auto min-w-[300px]"
                        >
                            <div className="w-12 h-12 rounded-full bg-brand-primary/5 flex items-center justify-center text-brand-primary">
                                <feature.icon className="w-6 h-6" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-lg text-[#2B1C14]">{feature.title}</span>
                                <span className="text-sm text-[#3A2A20]/80">{feature.description}</span>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5, duration: 1 }}
                    className="text-center mt-20"
                >
                    <p className="text-sm font-medium tracking-widest text-muted-foreground/50 uppercase">Trusted by financial professionals worldwide</p>
                </motion.div>
            </div>
        </section>
    )
}
