"use client"

import { useEffect, useState, useRef } from "react"
import { motion, useScroll, useSpring } from "framer-motion"
import { cn } from "@/lib/utils"

const SECTIONS = [
    { id: "hero", label: "Start" },
    { id: "trust", label: "Trust" },
    { id: "features", label: "Features" },
    { id: "mentors", label: "Mentors" },
    { id: "join", label: "Join" },
]

export function ScrollProgressSidebar() {
    const [activeSection, setActiveSection] = useState("hero")
    const { scrollYProgress } = useScroll()
    const scaleY = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    })
    const rafRef = useRef<number>(0)
    const tickingRef = useRef(false)

    useEffect(() => {
        const updateActive = () => {
            const viewportMid = window.scrollY + window.innerHeight / 2
            for (let i = SECTIONS.length - 1; i >= 0; i--) {
                const el = document.getElementById(SECTIONS[i].id)
                if (el) {
                    const { top, height } = el.getBoundingClientRect()
                    const sectionTop = top + window.scrollY
                    if (viewportMid >= sectionTop && viewportMid < sectionTop + height) {
                        setActiveSection(SECTIONS[i].id)
                        break
                    }
                }
            }
            tickingRef.current = false
        }

        const handleScroll = () => {
            if (tickingRef.current) return
            tickingRef.current = true
            rafRef.current = requestAnimationFrame(updateActive)
        }

        window.addEventListener("scroll", handleScroll, { passive: true })
        return () => {
            window.removeEventListener("scroll", handleScroll)
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
        }
    }, [])

    const scrollTo = (id: string) => {
        const el = document.getElementById(id)
        if (el) {
            window.scrollTo({
                top: el.offsetTop,
                behavior: "smooth"
            })
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1, duration: 1 }}
            className="fixed left-6 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col items-center gap-6"
        >
            {/* The Line */}
            <div className="absolute top-0 bottom-0 left-[11px] w-[1px] bg-brand-text/10 -z-10 overflow-hidden rounded-full">
                <motion.div
                    className="w-full bg-brand-primary origin-top"
                    style={{ scaleY, height: "100%" }}
                />
            </div>

            {SECTIONS.map((section, idx) => (
                <div key={section.id} className="relative group">
                    <button
                        onClick={() => scrollTo(section.id)}
                        className={cn(
                            "relative flex items-center justify-center w-6 h-6 rounded-full border border-transparent transition-all duration-300",
                            activeSection === section.id
                                ? "bg-white border-brand-primary scale-110 shadow-lg shadow-brand-primary/20"
                                : "bg-white/50 hover:bg-white border-gray-200 hover:border-brand-primary/50"
                        )}
                    >
                        <div className={cn(
                            "w-1.5 h-1.5 rounded-full transition-colors duration-300",
                            activeSection === section.id ? "bg-brand-primary" : "bg-gray-300 group-hover:bg-brand-primary/50"
                        )} />
                    </button>

                    {/* Hover Label */}
                    <span className={cn(
                        "absolute left-8 top-1/2 -translate-y-1/2 px-2 py-1 bg-brand-text/90 text-[10px] text-white rounded opacity-0 transition-all duration-300 pointer-events-none translate-x-2 whitespace-nowrap uppercase tracking-widest font-medium",
                        "group-hover:opacity-100 group-hover:translate-x-0"
                    )}>
                        {section.label}
                    </span>
                </div>
            ))}
        </motion.div>
    )
}
