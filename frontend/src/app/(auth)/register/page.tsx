import type { Metadata } from "next"
import { RegisterForm } from "@/components/auth/RegisterForm"
import { Logo } from "@/components/ui/logo"

export const metadata: Metadata = {
    title: "Create Account - FinStep",
    description: "Join FinStep today",
}

export default function RegisterPage() {
    return (
        <>
            <div className="mb-8 text-center lg:text-left">
                <div className="lg:hidden flex justify-center mb-6">
                    <Logo />
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-[#3a2a20] mb-2">Create an account</h1>
                <p className="text-[#3a2a20]/60">Start your journey to career success today.</p>
            </div>
            <RegisterForm />
        </>
    )
}
