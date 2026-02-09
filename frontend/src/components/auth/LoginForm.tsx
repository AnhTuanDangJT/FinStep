"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Mail, Lock, ArrowRight, Loader2, CheckCircle2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/context/AuthContext"
import { AuthError } from "./AuthError"

export function LoginForm() {
    const [isLoading, setIsLoading] = React.useState(false)
    const [isSuccess, setIsSuccess] = React.useState(false)
    const [error, setError] = React.useState("")
    const { login } = useAuth()
    const router = useRouter()

    async function onSubmit(event: React.SyntheticEvent) {
        event.preventDefault()
        setIsLoading(true)
        setError("")

        const target = event.target as typeof event.target & {
            email: { value: string }
            password: { value: string }
        }

        try {
            await login(target.email.value, target.password.value)
            setIsSuccess(true)
            // Slight delay to show success state
            setTimeout(() => router.push("/dashboard"), 500)
        } catch (err: any) {
            setError(err.message || "Invalid credentials. Please try again.")
            setIsLoading(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
        >

            <form onSubmit={onSubmit} className="space-y-3">
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
                    className="space-y-3"
                >
                    <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="space-y-2 group">
                        <Label htmlFor="email" className="text-[#2B1C14] font-semibold group-focus-within:text-brand-primary transition-colors">Email address</Label>
                        <div className="relative">
                            <Mail className="absolute left-3.5 top-3.5 h-5 w-5 text-[#3A2A20]/60 transition-colors group-focus-within:text-brand-primary" />
                            <Input
                                id="email"
                                name="email"
                                placeholder="name@example.com"
                                type="email"
                                autoCapitalize="none"
                                autoComplete="email"
                                autoCorrect="off"
                                className="pl-11 h-11 transition-all duration-300 bg-white border-[#2B1C14]/20 focus:bg-white focus:border-brand-primary/50 focus:ring-2 focus:ring-brand-primary/10 rounded-lg text-[#2B1C14] placeholder:text-[#3A2A20]/50"
                                required
                            />
                        </div>
                    </motion.div>

                    <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="space-y-2 group">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password" className="text-[#2B1C14] font-semibold group-focus-within:text-brand-primary transition-colors">Password</Label>
                            <Link
                                href="/forgot-password"
                                className="text-xs font-medium text-brand-primary/80 hover:text-brand-primary transition-colors"
                            >
                                Forgot password?
                            </Link>
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-[#3A2A20]/60 transition-colors group-focus-within:text-brand-primary" />
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                className="pl-11 h-11 transition-all duration-300 bg-white border-[#2B1C14]/20 focus:bg-white focus:border-brand-primary/50 focus:ring-2 focus:ring-brand-primary/10 rounded-lg text-[#2B1C14]"
                                required
                            />
                        </div>
                    </motion.div>
                </motion.div>

                <Button
                    className="w-full h-11 text-base group relative overflow-hidden transition-all duration-300 shadow-md shadow-brand-primary/15 hover:shadow-brand-primary/25 bg-gradient-to-r from-brand-primary to-brand-accent"
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
                                <span className="text-green-700 font-medium">Welcome Back</span>
                            </>
                        ) : (
                            <>
                                Continue Journey
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

                <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-[#2B1C14]/10" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase tracking-widest">
                        <span className="bg-white px-3 text-[#3A2A20]/60 font-medium">Or continue with Google</span>
                    </div>
                </div>

                {/* Social Buttons Polish */}
                <div className="grid grid-cols-1 gap-3">
                    <Button
                        variant="outline"
                        type="button"
                        disabled={isLoading}
                        className="h-11 bg-white/60 border-[#2B1C14]/10 hover:bg-white hover:border-brand-primary/20 transition-all shadow-sm hover:shadow-brand-primary/5 group w-full"
                        onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/auth/google`}
                    >
                        <svg className="mr-2 h-4 w-4 opacity-70 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        <span className="text-[#2B1C14] font-semibold group-hover:text-black">Sign in with Google</span>
                    </Button>
                </div>

                <p className="px-4 text-center text-sm text-[#2B1C14]/60 mt-3">
                    New to FinStep?{" "}
                    <Link
                        href="/register"
                        className="font-semibold text-brand-primary underline-offset-4 hover:underline hover:text-brand-accent transition-colors"
                    >
                        Start your ascent
                    </Link>
                </p>
            </form>
        </motion.div>
    )
}
