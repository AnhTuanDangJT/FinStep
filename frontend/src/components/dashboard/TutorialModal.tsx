"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ArrowRight, ArrowLeft, BookOpen, PenTool, CheckCircle2, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TutorialModalProps {
    isOpen: boolean
    onClose: () => void
}

const steps = [
    {
        title: "Welcome to FinStep",
        description: "FinStep is a community where people share finance ideas, lessons, and strategies.",
        icon: <div className="text-4xl">👋</div>
    },
    {
        title: "Read Ideas",
        description: "Browse ideas shared by the community and learn from different perspectives.",
        icon: <BookOpen className="w-12 h-12 text-blue-500" />
    },
    {
        title: "Write a Blog",
        description: "Click \"Write a Blog\", add your idea, and submit it for admin review.",
        icon: <PenTool className="w-12 h-12 text-brand-primary" />
    },
    {
        title: "Approval & Sharing",
        description: "Once approved, your post appears on the Community Finance Wall for everyone to see.",
        icon: <CheckCircle2 className="w-12 h-12 text-green-500" />
    },
    {
        title: "Interact",
        description: "Like, comment, and share ideas to grow together.",
        icon: <Heart className="w-12 h-12 text-red-500" />
    }
]

export function TutorialModal({ isOpen, onClose }: TutorialModalProps) {
    const [currentStep, setCurrentStep] = React.useState(0)

    // Reset step when opening
    React.useEffect(() => {
        if (isOpen) setCurrentStep(0)
    }, [isOpen])

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1)
        } else {
            onClose()
        }
    }

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1)
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 flex items-center justify-center z-[70] p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-[var(--black-surface)] border border-[var(--border-soft)] rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden pointer-events-auto relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600 z-10"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="p-8 text-center">
                                {/* Progress Indicators */}
                                <div className="flex justify-center gap-2 mb-8">
                                    {steps.map((_, i) => (
                                        <div
                                            key={i}
                                            className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? "w-8 bg-brand-primary" : "w-1.5 bg-gray-200"
                                                }`}
                                        />
                                    ))}
                                </div>

                                {/* Content */}
                                <div className="min-h-[220px] flex flex-col items-center justify-center">
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={currentStep}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ duration: 0.2 }}
                                            className="flex flex-col items-center"
                                        >
                                            <div className="w-24 h-24 bg-[var(--black-elevated)] rounded-full flex items-center justify-center mb-6 shadow-sm border border-[var(--border-soft)]">
                                                {steps[currentStep].icon}
                                            </div>
                                            <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-3">
                                                {steps[currentStep].title}
                                            </h3>
                                            <p className="text-[var(--text-secondary)] leading-relaxed">
                                                {steps[currentStep].description}
                                            </p>
                                        </motion.div>
                                    </AnimatePresence>
                                </div>

                                {/* Footer Controls */}
                                <div className="flex items-center justify-between mt-8 pt-6 border-t border-[var(--border-soft)]">
                                    <Button
                                        variant="ghost"
                                        onClick={handleBack}
                                        disabled={currentStep === 0}
                                        className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--black-elevated)]"
                                    >
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Back
                                    </Button>

                                    <Button
                                        onClick={handleNext}
                                        className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/90 text-[#070B14] font-bold rounded-full px-6"
                                    >
                                        {currentStep === steps.length - 1 ? (
                                            <>
                                                Got it <CheckCircle2 className="w-4 h-4 ml-2" />
                                            </>
                                        ) : (
                                            <>
                                                Next <ArrowRight className="w-4 h-4 ml-2" />
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    )
}
