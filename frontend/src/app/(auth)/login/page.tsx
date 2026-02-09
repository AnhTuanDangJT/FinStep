import type { Metadata } from "next"
import { LoginForm } from "@/components/auth/LoginForm"
import { Logo } from "@/components/ui/logo"

export const metadata: Metadata = {
    title: "Sign In - FinStep",
    description: "Sign in to your FinStep account",
}

export default function LoginPage() {
    return (
        <>
            <div className="mb-6 text-center lg:text-left">
                <div className="lg:hidden flex justify-center mb-6">
                    <Logo />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-[#3a2a20] mb-1">Welcome back</h1>
                <p className="text-sm text-[#3a2a20]/60">Enter your credentials to access your workspace.</p>
            </div>
            <LoginForm />
        </>
    )
}
