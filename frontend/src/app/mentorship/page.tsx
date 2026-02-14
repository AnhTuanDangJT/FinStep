"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Loader2, CheckCircle2, ChevronDown } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import { Footer } from "@/components/landing/Footer"

type MentorshipFormData = {
    name: string
    school: string
    experienceLevel: string
    major: string
    financeFocus: string
}

const EXPERIENCE_LEVELS = [
    "Freshman",
    "Sophomore",
    "Junior",
    "Senior",
    "Undergraduate",
    "New grade",
    "Master",
    "PhD"
]

export default function MentorshipPage() {
    const [submitting, setSubmitting] = useState(false)
    const [success, setSuccess] = useState(false)

    const { register, handleSubmit, formState: { errors } } = useForm<MentorshipFormData>()

    const onSubmit = async (data: MentorshipFormData) => {
        setSubmitting(true)
        try {
            await apiClient.registerMentorship(data)
            setSuccess(true)
            toast.success("Application submitted successfully!")
        } catch (error: any) {
            toast.error(error.message || "Failed to submit application")
        } finally {
            setSubmitting(false)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen bg-[#FFF7ED] flex items-center justify-center p-4 force-light relative overflow-hidden">
                {/* Background Elements */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-brand-primary/5 via-transparent to-transparent pointer-events-none" />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white/80 backdrop-blur-xl border border-brand-primary/20 p-12 rounded-[2rem] text-center max-w-md w-full shadow-[0_0_40px_rgba(255,183,3,0.1)]"
                >
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-3xl font-black text-[#2B1C14] mb-4">You're on the list!</h2>
                    <p className="text-[#6B4A3A]">
                        Thank you for your interest in the Mentorship Program. We will review your application and get back to you shortly.
                    </p>
                    <Button
                        className="mt-8 w-full bg-brand-primary hover:bg-brand-accent text-white font-bold h-12 rounded-xl"
                        onClick={() => window.location.href = "/"}
                    >
                        Back to Home
                    </Button>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#FFF7ED] p-4 md:p-8 force-light relative overflow-hidden flex flex-col">
            {/* Background Elements */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-brand-primary/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-brand-accent/5 rounded-full blur-[100px]" />
                {/* Black Pattern Overlay */}
                <div className="absolute inset-0 bg-[url('/images/auth-pattern.png')] bg-cover bg-center opacity-[0.15] mix-blend-multiply" />
            </div>

            <header className="relative z-10 flex justify-between items-center mb-8 md:mb-12 max-w-7xl mx-auto w-full">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.href = "/"}>
                    <div className="relative w-10 h-10">
                        <Image src="/finstep-logo.png" alt="FinStep" fill className="object-contain" priority />
                    </div>
                    <span className="font-black text-xl tracking-tighter text-[#2B1C14]">FINSTEP</span>
                </div>
            </header>

            <main className="flex-1 flex items-center justify-center relative z-10">
                <div className="w-full max-w-2xl">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-10"
                    >
                        <h1 className="text-4xl md:text-5xl font-black text-[#2B1C14] mb-4 tracking-tight">
                            Mentorship Program
                        </h1>
                        <p className="text-[#6B4A3A] text-lg max-w-lg mx-auto">
                            Join an exclusive network of finance professionals and accelerate your career growth.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="
              bg-white/70 backdrop-blur-2xl
              border border-brand-primary/10
              rounded-[2rem] p-6 md:p-10
              shadow-[0_20px_50px_rgba(43,28,20,0.05)]
              hover:shadow-[0_20px_50px_rgba(255,183,3,0.1)]
              transition-shadow duration-500
              relative overflow-hidden
            "
                    >
                        {/* Subtle top gradient line */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-primary/30 to-transparent" />

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                            {/* Name */}
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-[#2B1C14] font-bold text-sm uppercase tracking-wide">Full Name</Label>
                                <Input
                                    id="name"
                                    {...register("name", { required: "Name is required" })}
                                    className="
                    h-12 rounded-xl bg-white/50 border-brand-primary/10 
                    focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10
                    placeholder:text-[#6B4A3A]/40 text-[#2B1C14] font-medium
                    transition-all duration-300
                  "
                                    placeholder="e.g. Nguyen Van A"
                                />
                                {errors.name && <span className="text-red-500 text-xs font-bold">{errors.name.message}</span>}
                            </div>

                            {/* University */}
                            <div className="space-y-2">
                                <Label htmlFor="school" className="text-[#2B1C14] font-bold text-sm uppercase tracking-wide">University / School</Label>
                                <Input
                                    id="school"
                                    {...register("school", { required: "School is required" })}
                                    className="
                    h-12 rounded-xl bg-white/50 border-brand-primary/10 
                    focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10
                    placeholder:text-[#6B4A3A]/40 text-[#2B1C14] font-medium
                    transition-all duration-300
                  "
                                    placeholder="e.g. FTU, NEU, RMIT..."
                                />
                                {errors.school && <span className="text-red-500 text-xs font-bold">{errors.school.message}</span>}
                            </div>

                            {/* Experience Level (Dropdown) */}
                            <div className="space-y-2">
                                <Label htmlFor="experienceLevel" className="text-[#2B1C14] font-bold text-sm uppercase tracking-wide">Years of Experience</Label>
                                <div className="relative">
                                    <select
                                        id="experienceLevel"
                                        {...register("experienceLevel", { required: "Experience level is required" })}
                                        className="
                      w-full h-12 px-3 rounded-xl bg-white/50 border border-brand-primary/10 
                      focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 focus:outline-none
                      text-[#2B1C14] font-medium appearance-none cursor-pointer
                      transition-all duration-300
                    "
                                    >
                                        <option value="">Select Level</option>
                                        {EXPERIENCE_LEVELS.map(level => (
                                            <option key={level} value={level}>{level}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B4A3A] pointer-events-none" />
                                </div>
                                {errors.experienceLevel && <span className="text-red-500 text-xs font-bold">{errors.experienceLevel.message}</span>}
                            </div>

                            {/* Major */}
                            <div className="space-y-2">
                                <Label htmlFor="major" className="text-[#2B1C14] font-bold text-sm uppercase tracking-wide">Major</Label>
                                <Input
                                    id="major"
                                    {...register("major", { required: "Major is required" })}
                                    className="
                    h-12 rounded-xl bg-white/50 border-brand-primary/10 
                    focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10
                    placeholder:text-[#6B4A3A]/40 text-[#2B1C14] font-medium
                    transition-all duration-300
                  "
                                    placeholder="e.g. Finance, Economics, CS..."
                                />
                                {errors.major && <span className="text-red-500 text-xs font-bold">{errors.major.message}</span>}
                            </div>

                            {/* Finance Focus */}
                            <div className="space-y-2">
                                <Label htmlFor="financeFocus" className="text-[#2B1C14] font-bold text-sm uppercase tracking-wide">Focus Area</Label>
                                <Input
                                    id="financeFocus"
                                    {...register("financeFocus", { required: "Focus area is required" })}
                                    className="
                    h-12 rounded-xl bg-white/50 border-brand-primary/10 
                    focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10
                    placeholder:text-[#6B4A3A]/40 text-[#2B1C14] font-medium
                    transition-all duration-300
                  "
                                    placeholder="e.g. Investment Banking, Quantitative Finance..."
                                />
                                <p className="text-xs text-[#6B4A3A]/70">Which types of finance do you want to choose?</p>
                                {errors.financeFocus && <span className="text-red-500 text-xs font-bold">{errors.financeFocus.message}</span>}
                            </div>

                            <div className="pt-4">
                                <Button
                                    type="submit"
                                    disabled={submitting}
                                    className="
                    w-full h-14 rounded-xl bg-brand-primary hover:bg-brand-accent 
                    text-white font-black text-lg tracking-wide shadow-lg 
                    hover:shadow-brand-primary/30 transition-all duration-300
                  "
                                >
                                    {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "Submit Application"}
                                </Button>
                            </div>

                        </form>
                    </motion.div>
                </div>
            </main>
            <Footer />
        </div>
    )
}
