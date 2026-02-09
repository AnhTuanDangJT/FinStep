"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BlogLightboxProps {
    isOpen: boolean
    onClose: () => void
    images: string[]
    initialIndex?: number
}

import { createPortal } from "react-dom"

export function BlogLightbox({ isOpen, onClose, images, initialIndex = 0 }: BlogLightboxProps) {
    const [currentIndex, setCurrentIndex] = React.useState(initialIndex)
    const [direction, setDirection] = React.useState(0)
    const [mounted, setMounted] = React.useState(false)

    // Sync internal state when isOpen changes
    React.useEffect(() => {
        if (isOpen) {
            setCurrentIndex(initialIndex)
            setDirection(0)
        }
    }, [isOpen, initialIndex])

    React.useEffect(() => {
        setMounted(true)
        return () => setMounted(false)
    }, [])

    // Keyboard navigation
    React.useEffect(() => {
        if (!isOpen) return
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft") handlePrev()
            if (e.key === "ArrowRight") handleNext()
            if (e.key === "Escape") onClose()
        }
        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [isOpen, currentIndex])

    const handleNext = () => {
        if (currentIndex < images.length - 1) {
            setDirection(1)
            setCurrentIndex((prev) => prev + 1)
        }
    }

    const handlePrev = () => {
        if (currentIndex > 0) {
            setDirection(-1)
            setCurrentIndex((prev) => prev - 1)
        }
    }

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 1000 : -1000,
            opacity: 0,
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 1000 : -1000,
            opacity: 0,
        }),
    }

    const singleImage = images.length <= 1

    if (!mounted) return null

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-xl bg-black/80"
                    onClick={onClose}
                >
                    {/* Close Button - always visible */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-6 right-6 z-[10001] text-white/70 hover:text-white hover:bg-white/10 rounded-full w-12 h-12 transition-all hover:rotate-90"
                        onClick={(e) => {
                            e.stopPropagation()
                            onClose()
                        }}
                        aria-label="Close"
                    >
                        <X className="w-8 h-8" />
                    </Button>

                    {/* Navigation - only when multiple images */}
                    {!singleImage && (
                        <>
                            {currentIndex > 0 && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute left-6 top-1/2 -translate-y-1/2 z-[10001] text-white/50 hover:text-white hover:bg-white/10 rounded-full h-16 w-16 transition-all hover:scale-110"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handlePrev()
                                    }}
                                    aria-label="Previous image"
                                >
                                    <ChevronLeft className="w-10 h-10" />
                                </Button>
                            )}
                            {currentIndex < images.length - 1 && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-6 top-1/2 -translate-y-1/2 z-[10001] text-white/50 hover:text-white hover:bg-white/10 rounded-full h-16 w-16 transition-all hover:scale-110"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleNext()
                                    }}
                                    aria-label="Next image"
                                >
                                    <ChevronRight className="w-10 h-10" />
                                </Button>
                            )}
                        </>
                    )}

                    {/* Image counter - only when multiple images */}
                    {!singleImage && (
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[10001] px-6 py-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-full text-white/90 text-sm font-bold tracking-widest uppercase">
                            {currentIndex + 1} / {images.length}
                        </div>
                    )}

                    {/* Image Content */}
                    <div className="relative w-full h-full flex items-center justify-center overflow-hidden pointer-events-none p-4 md:p-12">
                        <div
                            className="pointer-events-auto relative w-full h-full flex items-center justify-center max-w-[90vw] max-h-[90vh]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <AnimatePresence initial={false} custom={direction} mode="popLayout">
                                <motion.img
                                    key={currentIndex}
                                    src={images[currentIndex]}
                                    custom={direction}
                                    variants={variants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{
                                        x: { type: "spring", stiffness: 300, damping: 30 },
                                        opacity: { duration: 0.2 },
                                    }}
                                    className="max-w-full max-h-full object-contain shadow-2xl rounded-xl select-none"
                                    alt=""
                                    draggable={false}
                                />
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    )
}
