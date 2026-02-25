import type { Metadata } from "next"
import { LoginForm } from "@/components/auth/LoginForm"
import { AnimatedLogo } from "@/components/ui/AnimatedLogo"
import Link from "next/link"

export const metadata: Metadata = {
    title: "Sign In - FinStep",
    description: "Sign in to your FinStep account",
}

export default function LoginPage() {
    return (
        <>
            <div className="mb-6 text-center lg:text-left">
                <div className="lg:hidden flex justify-center mb-6">
                    <Link href="/" className="outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 rounded-xl">
                        <AnimatedLogo variant="compact" onLightBackground={true} />
                    </Link>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-[#3a2a20] mb-1">Welcome back</h1>
                <p className="text-sm text-[#3a2a20]/60">Enter your credentials to access your workspace.</p>
            </div>
            <LoginForm />
        </>
    )
}
