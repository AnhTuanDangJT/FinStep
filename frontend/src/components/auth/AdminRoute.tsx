"use client"

import { useAuth } from "@/context/AuthContext"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Loader2, ShieldAlert } from "lucide-react"

export function AdminRoute({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!isLoading) {
            if (!user) {
                router.push("/login")
            }
            // Add actual role check logic here when User interface has roles
            // For now, assuming if they are logged in and navigating here they are checking access
        }
    }, [user, isLoading, router])

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
            </div>
        )
    }

    if (!user) {
        return null
    }

    const isAdmin = user.role === "ADMIN"

    if (!isAdmin) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
                <ShieldAlert className="h-16 w-16 text-red-500 mb-4" />
                <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
                <p className="text-muted-foreground mb-6">You do not have permission to view this page.</p>
                <button
                    onClick={() => router.push("/dashboard")}
                    className="text-brand-primary hover:underline font-medium"
                >
                    Return to Dashboard
                </button>
            </div>
        )
    }

    return <>{children}</>
}
