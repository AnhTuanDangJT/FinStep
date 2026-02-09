"use client"

import { useEffect, useRef, useState } from "react"

export function MouseSpotlight() {
    const containerRef = useRef<HTMLDivElement>(null)
    const [opacity, setOpacity] = useState(0)
    const rafRef = useRef<number>(0)
    const posRef = useRef({ x: -1000, y: -1000 })

    useEffect(() => {
        const updatePosition = (e: MouseEvent) => {
            posRef.current = { x: e.clientX, y: e.clientY }
            if (rafRef.current === 0) {
                rafRef.current = requestAnimationFrame(() => {
                    if (!containerRef.current) return
                    containerRef.current.style.setProperty("--mouse-x", `${posRef.current.x}px`)
                    containerRef.current.style.setProperty("--mouse-y", `${posRef.current.y}px`)
                    rafRef.current = 0
                })
            }
        }

        const flushOpacity = () => setOpacity(1)
        const handleMouseLeave = () => setOpacity(0)
        const handleMouseEnter = () => setOpacity(1)

        window.addEventListener("mousemove", updatePosition, { passive: true })
        window.addEventListener("mousemove", flushOpacity, { once: true })
        document.body.addEventListener("mouseleave", handleMouseLeave)
        document.body.addEventListener("mouseenter", handleMouseEnter)

        return () => {
            window.removeEventListener("mousemove", updatePosition)
            window.removeEventListener("mousemove", flushOpacity)
            document.body.removeEventListener("mouseleave", handleMouseLeave)
            document.body.removeEventListener("mouseenter", handleMouseEnter)
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
        }
    }, [])

    return (
        <div
            ref={containerRef}
            className="pointer-events-none fixed inset-0 z-50 overflow-hidden mix-blend-soft-light hidden md:block transition-opacity duration-300"
            style={{ opacity }}
        >
            {/* No blur: filter causes repaint every frame and kills 60fps. Use soft gradient only. */}
            <div
                className="absolute w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-brand-primary/25 via-brand-accent/5 to-transparent will-change-transform"
                style={{
                    transform: "translate(calc(var(--mouse-x, -100px) - 50%), calc(var(--mouse-y, -100px) - 50%))",
                }}
            />
        </div>
    )
}
