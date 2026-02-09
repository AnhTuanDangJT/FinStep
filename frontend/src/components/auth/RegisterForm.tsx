"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Mail, Lock, User, ArrowRight, Loader2, CheckCircle2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/context/AuthContext"
import { AuthError } from "./AuthError"

export function RegisterForm() {
    const [isLoading, setIsLoading] = React.useState(false)
    const [isSuccess, setIsSuccess] = React.useState(false)
    const [error, setError] = React.useState("")
    const { register } = useAuth()
    const router = useRouter()

    async function onSubmit(event: React.SyntheticEvent) {
        event.preventDefault()
        setIsLoading(true)
        setError("")

        const target = event.target as typeof event.target & {
            name: { value: string }
            email: { value: string }
            password: { value: string }
        }

        try {
            await register(target.name.value, target.email.value, target.password.value)
            setIsSuccess(true)
            setTimeout(() => router.push("/dashboard"), 500)
        } catch (err: any) {
            setError(err.message || "Registration failed. Please try again.")
            setIsLoading(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
        >

            <form onSubmit={onSubmit} className="space-y-4">
                <AnimatePresence mode="wait">
                    <AuthError key={error} message={error} />
                </AnimatePresence>

                <motion.div
                    variants={{
                        hidden: { opacity: 0, y: 20 },
                        show: {
                            opacity: 1,
                            y: 0,
                            transition: {
                                staggerChildren: 0.1
                            }
                        }
                    }}
                    initial="hidden"
                    animate="show"
                    className="space-y-4"
                >
                    <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="space-y-2 group">
                        <Label htmlFor="name" className="text-[#2B1C14] font-semibold group-focus-within:text-brand-primary transition-colors">Full Name</Label>
                        <div className="relative">
                            <User className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground/60 transition-colors group-focus-within:text-brand-primary" />
                            <Input
                                id="name"
                                name="name"
                                placeholder="John Doe"
                                type="text"
                                autoCapitalize="words"
                                autoCorrect="off"
                                className="pl-11 h-12 transition-all duration-300 focus:scale-[1.01] bg-white border-[#2B1C14]/20 focus:bg-white focus:border-brand-primary/50 focus:ring-4 focus:ring-brand-primary/10 rounded-lg shadow-inner shadow-black/5 text-[#2B1C14] placeholder:text-[#3A2A20]/50"
                                required
                            />
                        </div>
                    </motion.div>

                    <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="space-y-2 group">
                        <Label htmlFor="email" className="text-[#2B1C14] font-semibold group-focus-within:text-brand-primary transition-colors">Email address</Label>
                        <div className="relative">
                            <Mail className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground/60 transition-colors group-focus-within:text-brand-primary" />
                            <Input
                                id="email"
                                name="email"
                                placeholder="name@example.com"
                                type="email"
                                autoCapitalize="none"
                                autoComplete="email"
                                autoCorrect="off"
                                className="pl-11 h-12 transition-all duration-300 focus:scale-[1.01] bg-white border-[#2B1C14]/20 focus:bg-white focus:border-brand-primary/50 focus:ring-4 focus:ring-brand-primary/10 rounded-lg shadow-inner shadow-black/5 text-[#2B1C14] placeholder:text-[#3A2A20]/50"
                                required
                            />
                        </div>
                    </motion.div>

                    <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="space-y-2 group">
                        <Label htmlFor="password" className="text-[#2B1C14] font-semibold group-focus-within:text-brand-primary transition-colors">Password</Label>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground/60 transition-colors group-focus-within:text-brand-primary" />
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                className="pl-11 h-12 transition-all duration-300 focus:scale-[1.01] bg-white border-[#2B1C14]/20 focus:bg-white focus:border-brand-primary/50 focus:ring-4 focus:ring-brand-primary/10 rounded-lg shadow-inner shadow-black/5 text-[#2B1C14]"
                                required
                            />
                        </div>
                        <p className="text-xs text-[#2B1C14]/50">
                            Must be at least 8 characters long.
                        </p>
                    </motion.div>
                </motion.div>

                <Button
                    className="w-full h-12 text-base group mt-2 relative overflow-hidden transition-all duration-300 shadow-lg shadow-brand-primary/20 hover:shadow-brand-primary/30 hover:translate-y-[-1px] bg-gradient-to-r from-brand-primary to-brand-accent"
                    type="submit"
                    disabled={isLoading || isSuccess}
                    variant={isSuccess ? "outline" : "default"}
                >
                    {/* Button Shimmer Effect */}
                    <motion.div
                        className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        style={{ skewX: '-20deg' }}
                    />

                    <div className="relative z-10 flex items-center justify-center">
                        {isLoading && !isSuccess ? (
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : isSuccess ? (
                            <>
                                <CheckCircle2 className="mr-2 h-5 w-5 text-green-600" />
                                <span className="text-green-700 font-medium">Account Created</span>
                            </>
                        ) : (
                            <>
                                Start Ascent
                                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </>
                        )}
                    </div>
                    {isSuccess && (
                        <motion.div
                            layoutId="success-fill"
                            className="absolute inset-0 bg-green-50"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        />
                    )}
                </Button>

                <p className="text-center text-xs text-[#2B1C14]/50 mt-4 px-4">
                    By clicking continue, you agree to our{" "}
                    <Link href="/terms" className="underline underline-offset-4 hover:text-brand-primary transition-colors">Terms of Service</Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="underline underline-offset-4 hover:text-brand-primary transition-colors">Privacy Policy</Link>.
                </p>

                <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-[#2B1C14]/10" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase tracking-widest">
                        <span className="bg-white px-3 text-[#3A2A20]/60 font-medium">Or</span>
                    </div>
                </div>

                <p className="px-8 text-center text-sm text-[#2B1C14]/60 mt-4">
                    Already climbing?{" "}
                    <Link
                        href="/login"
                        className="font-semibold text-brand-primary underline-offset-4 hover:underline hover:text-brand-accent transition-colors"
                    >
                        Continue journey
                    </Link>
                </p>
            </form>
        </motion.div>
    )
}
