"use client"

import { ThemeProvider } from "@/lib/ThemeContext"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <ThemeProvider>
            {children}
        </ThemeProvider>
    )
}
