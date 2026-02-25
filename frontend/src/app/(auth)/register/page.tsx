import type { Metadata } from "next"
import { RegisterForm } from "@/components/auth/RegisterForm"
import { AnimatedLogo } from "@/components/ui/AnimatedLogo"
import Link from "next/link"

export const metadata: Metadata = {
    title: "Create Account - FinStep",
    description: "Join FinStep today",
}

export default function RegisterPage() {
    return (
        <>
            <div className="mb-8 text-center lg:text-left">
                <div className="lg:hidden flex justify-center mb-6">
                    <Link href="/" className="outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 rounded-xl">
                        <AnimatedLogo variant="compact" onLightBackground={true} />
                    </Link>
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-[#3a2a20] mb-2">Create an account</h1>
                <p className="text-[#3a2a20]/60">Start your journey to career success today.</p>
            </div>
            <RegisterForm />
        </>
    )
}
