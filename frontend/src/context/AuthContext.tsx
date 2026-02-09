"use client"

import * as React from "react"
import { authService, type User } from "@/lib/auth"
import { apiClient } from "@/lib/api-client"

/** Delay before running auth check (ms). Keeps intro animation free of backend-induced re-renders. */
const AUTH_CHECK_DEFER_MS = 6000

interface AuthContextType {
    user: User | null
    isLoading: boolean
    login: (email: string, password: string) => Promise<void>
    register: (name: string, email: string, password: string) => Promise<void>
    logout: () => Promise<void>
    refreshUser: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = React.useState<User | null>(null)
    const [isLoading, setIsLoading] = React.useState(true)
    const checkStartedRef = React.useRef(false)

    // Defer auth check so landing intro runs without backend-triggered re-renders
    React.useEffect(() => {
        if (checkStartedRef.current) return
        checkStartedRef.current = true

        const runCheck = () => {
            async function checkAuth() {
                try {
                    const { user: u, token } = await authService.getMe()
                    setUser(u)
                    if (token) apiClient.setAccessToken(token)
                    else apiClient.setAccessToken(null)
                } catch {
                    setUser(null)
                    apiClient.setAccessToken(null)
                } finally {
                    setIsLoading(false)
                }
            }
            checkAuth()
        }

        const schedule = () => {
            if (typeof requestIdleCallback !== "undefined") {
                requestIdleCallback(runCheck, { timeout: AUTH_CHECK_DEFER_MS })
            } else {
                setTimeout(runCheck, AUTH_CHECK_DEFER_MS)
            }
        }

        const id = setTimeout(schedule, 0)
        return () => clearTimeout(id)
    }, [])

    const refreshUser = React.useCallback(async () => {
        try {
            const { user: u, token } = await authService.getMe()
            setUser(u)
            if (token) apiClient.setAccessToken(token)
            else apiClient.setAccessToken(null)
        } catch {
            setUser(null)
            apiClient.setAccessToken(null)
        }
    }, [])

    const login = async (email: string, password: string) => {
        const response = await authService.login(email, password)
        if (response.token) {
            apiClient.setAccessToken(response.token)
        }
        await refreshUser()
    }

    const register = async (name: string, email: string, password: string) => {
        const response = await authService.register(name, email, password)
        if (response.token) {
            apiClient.setAccessToken(response.token)
        }
        await refreshUser()
    }

    const logout = async () => {
        authService.logout()
        setUser(null)
        apiClient.setAccessToken(null)
    }

    React.useEffect(() => {
        const handleUnauthorized = () => {
            logout()
        }
        window.addEventListener("auth:unauthorized", handleUnauthorized)
        return () => window.removeEventListener("auth:unauthorized", handleUnauthorized)
    }, [])

    return (
        <AuthContext.Provider value={{ user, isLoading, login, register, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = React.useContext(AuthContext)
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}
