"use client"

import { motion } from "framer-motion"
import { DoorOpen } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface DoorButtonProps {
    href: string
    className?: string
}

export function DoorButton({ href, className }: DoorButtonProps) {
    return (
        <Link href={href} className={cn("group relative inline-block overflow-visible", className)}>
            <motion.div
                whileHover="open"
                initial="closed"
                className="relative h-20 w-80 bg-[#2B1C14] rounded-xl overflow-hidden flex items-center justify-center shadow-2xl transition-all duration-500 group-hover:shadow-[#FF7A00]/40 group-hover:scale-[1.02]"
            >
                {/* Internal Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#FF7A00]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                {/* The "Enter" Text revealed behind the door */}
                <motion.div
                    variants={{
                        closed: { opacity: 0, scale: 0.8 },
                        open: { opacity: 1, scale: 1 }
                    }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="absolute inset-0 flex items-center justify-center text-white font-bold text-xl tracking-[0.2em] z-10"
                >
                    ENTER JOURNEY
                </motion.div>

                {/* Left Door Panel */}
                <motion.div
                    variants={{
                        closed: { x: "0%" },
                        open: { x: "-100%" }
                    }}
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                    className="absolute inset-y-0 left-0 w-1/2 bg-[#3A2A20] z-20 border-r border-[#FF7A00]/30 shadow-[5px_0_15px_rgba(0,0,0,0.3)] flex items-center justify-end pr-4"
                >
                    <div className="h-3 w-1 rounded-full bg-[#FF7A00]/40" />
                </motion.div>

                {/* Right Door Panel */}
                <motion.div
                    variants={{
                        closed: { x: "0%" },
                        open: { x: "100%" }
                    }}
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                    className="absolute inset-y-0 right-0 w-1/2 bg-[#3A2A20] z-20 border-l border-[#FF7A00]/30 shadow-[-5px_0_15px_rgba(0,0,0,0.3)] flex items-center justify-start pl-4"
                >
                    <div className="h-3 w-1 rounded-full bg-[#FF7A00]/40" />
                    <DoorOpen className="ml-auto mr-4 text-[#FF7A00]/20" size={20} />
                </motion.div>
            </motion.div>

            {/* External Shadow/Glow */}
            <div className="absolute -inset-2 bg-[#FF7A00]/10 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
        </Link>
    )
}
