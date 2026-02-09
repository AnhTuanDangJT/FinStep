"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { LogOut } from "lucide-react"
import type { Blog } from "@/lib/api-client"
import { motion, useMotionTemplate, useMotionValue } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/AuthContext"
import { Logo } from "@/components/ui/logo"
import { ChatPopup } from "@/components/landing/ChatPopup"
import { ThemeToggle } from "@/components/ui/ThemeToggle"
import {
  DashboardSidebar,
  type DashboardView,
} from "@/components/dashboard/DashboardSidebar"
import { ReadBlogsView } from "@/components/dashboard/ReadBlogsView"
import { WriteBlogView } from "@/components/dashboard/WriteBlogView"
import { MyBlogsView } from "@/components/dashboard/MyBlogsView"
import { ProfileView } from "@/components/dashboard/ProfileView"
import { AdminView } from "@/components/dashboard/AdminView"
import { JourneyTimelineView } from "@/components/dashboard/JourneyTimelineView"

function DashboardContent() {
  const { user, logout, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialView = (searchParams.get("view") as DashboardView) || "readBlogs"
  const [activeView, setActiveView] = React.useState<DashboardView>(initialView)
  const [editBlog, setEditBlog] = React.useState<Blog | null>(null)

  // Sync state if URL changes (optional, but good for back button)
  React.useEffect(() => {
    const view = searchParams.get("view") as DashboardView
    if (view) setActiveView(view)
  }, [searchParams])

  const containerRef = React.useRef<HTMLDivElement>(null)

  // Throttle mousemove with rAF to avoid input lag; one update per frame
  React.useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let rafId: number | null = null
    let pending: MouseEvent | null = null
    const flush = () => {
      if (pending && container) {
        const rect = container.getBoundingClientRect()
        const x = pending.clientX - rect.left
        const y = pending.clientY - rect.top
        container.style.setProperty('--mouse-x', `${x}px`)
        container.style.setProperty('--mouse-y', `${y}px`)
        pending = null
      }
      rafId = null
    }
    const handleMouseMoveGlobal = (e: MouseEvent) => {
      pending = e
      if (rafId == null) rafId = requestAnimationFrame(flush)
    }

    window.addEventListener('mousemove', handleMouseMoveGlobal, { passive: true })
    return () => {
      window.removeEventListener('mousemove', handleMouseMoveGlobal)
      if (rafId != null) cancelAnimationFrame(rafId)
    }
  }, [])

  React.useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login")
    }
  }, [authLoading, user, router])

  const handleLogout = React.useCallback(async () => {
    await logout()
    router.replace("/login")
  }, [logout, router])

  const isAdmin = user?.role === "ADMIN" || user?.email === "dganhtuan.2k5@gmail.com"

  // Route Guard: Redirect non-admins trying to access admin view
  React.useEffect(() => {
    if (activeView === "admin" && !isAdmin) {
      setActiveView("readBlogs")
    }
  }, [activeView, isAdmin])

  // Early return AFTER all hooks - maintains consistent hook order
  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070B14]">
        <Logo className="animate-pulse" />
      </div>
    )
  }

  const renderMainContent = () => {
    switch (activeView) {
      case "readBlogs":
        return <ReadBlogsView onWriteClick={() => setActiveView("writeBlog")} />
      case "writeBlog":
        return (
          <WriteBlogView
            editBlog={editBlog}
            onEditComplete={() => setEditBlog(null)}
          />
        )
      case "myBlogs":
        return (
          <MyBlogsView
            onEditClick={(blog) => {
              setEditBlog(blog)
              setActiveView("writeBlog")
            }}
          />
        )
      case "profile":
        return <ProfileView />
      case "admin":
        if (!isAdmin) return null // Double safety
        return <AdminView />
      case "timeline":
        return <JourneyTimelineView />
      default:
        return <ReadBlogsView />
    }
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen relative overflow-hidden selection:bg-brand-primary/20 isolate-layer"
      style={{
        // Define the gradient using CSS variables updated by the listener
        '--background-gradient': 'radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), rgba(255, 120, 40, 0.08), transparent 80%)'
      } as React.CSSProperties}
    >
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Softened Grid Pattern */}
        <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid-pattern.svg')] opacity-[0.02]" />

        {/* Slower, subtler background orbs - Optimized for performance */}
        <div className="absolute -top-[20%] -right-[10%] w-[1000px] h-[1000px] rounded-full bg-brand-primary/3 blur-[64px] animate-pulse duration-[15000ms] will-change-transform" />
        <div className="absolute top-[30%] -left-[20%] w-[800px] h-[800px] rounded-full bg-blue-400/3 blur-[64px] animate-pulse delay-1000 duration-[18000ms] will-change-transform" />

        {/* Mouse follow gradient - Now using CSS variable for 60fps */}
        <div
          className="absolute inset-0 opacity-100"
          style={{ background: 'var(--background-gradient)' }}
        />
      </div>

      <nav className="relative z-20 flex items-center justify-between px-6 py-5 border-b border-[var(--border-soft)] bg-[var(--bg-surface)]/80 backdrop-blur-md sticky top-0 transition-all">
        <Logo className="scale-90 origin-left" />
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <div className="h-6 w-px bg-[var(--text-secondary)]/10" />
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm font-medium text-[var(--text-secondary)] hidden sm:block bg-[var(--text-secondary)]/5 px-3 py-1.5 rounded-full border border-[var(--border-soft)]"
          >
            {user.name}
          </motion.span>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--text-primary)]/5 rounded-full px-4 h-9 text-sm transition-all hover:pr-5 group"
          >
            <LogOut className="w-4 h-4 mr-2 group-hover:-translate-x-0.5 transition-transform" />
            Sign Out
          </Button>
        </div>
      </nav>

      <div className="relative z-10 flex min-h-[calc(100vh-80px)] max-w-[1920px] mx-auto">
        <DashboardSidebar
          activeView={activeView}
          onViewChange={setActiveView}
          isAdmin={isAdmin}
        />
        <main className="flex-1 overflow-auto p-6 md:p-10 lg:p-12 scroll-smooth">
          <div className="max-w-5xl mx-auto w-full">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {renderMainContent()}
            </motion.div>
          </div>
        </main>
      </div>

      <ChatPopup />
    </div>
  )
}

export default function DashboardPage() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#070B14]">
        <Logo className="animate-pulse" />
      </div>
    }>
      <DashboardContent />
    </React.Suspense>
  )
}
