"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { motion, useMotionValue, useMotionTemplate } from "framer-motion"
import { LogOut, TrendingUp, Code, CheckCircle2, Facebook, ShieldCheck, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/AuthContext"
import { Logo } from "@/components/ui/logo"
import { ChatPopup } from "@/components/landing/ChatPopup"
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar"
import { apiClient, type PrimaryMentor } from "@/lib/api-client"

export default function MentorPage() {
  const { user, logout, isLoading } = useAuth()
  const router = useRouter()
  const [mentor, setMentor] = React.useState<PrimaryMentor | null>(null)
  const [loading, setLoading] = React.useState(true)

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const backgroundGradient = useMotionTemplate`radial-gradient(
    600px circle at ${mouseX}px ${mouseY}px,
    var(--brand-primary-alpha-05, rgba(255, 183, 3, 0.05)),
    transparent 80%
)`

  React.useEffect(() => {
    if (!isLoading && !user) router.replace("/login")
  }, [isLoading, user, router])

  React.useEffect(() => {
    async function load() {
      try {
        const data = await apiClient.getPrimaryMentor()
        setMentor(data)
      } catch (e) {
        console.error("Failed to load mentor", e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleMouseMove = React.useCallback(
    ({ currentTarget, clientX, clientY }: React.MouseEvent) => {
      const { left, top } = currentTarget.getBoundingClientRect()
      mouseX.set(clientX - left)
      mouseY.set(clientY - top)
    },
    [mouseX, mouseY]
  )

  const handleLogout = React.useCallback(async () => {
    await logout()
    router.replace("/login")
  }, [logout, router])

  if (isLoading || !user) return null

  return (
    <div
      className="min-h-screen relative overflow-hidden bg-[var(--bg-primary)] selection:bg-brand-primary/20 transition-colors duration-300"
      onMouseMove={handleMouseMove}
    >
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid-pattern.svg')] opacity-[0.03] dark:opacity-[0.02]" />
        <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] rounded-full bg-brand-primary/5 blur-[100px] animate-pulse" />
        <div className="absolute bottom-[20%] right-[10%] w-[600px] h-[600px] rounded-full bg-blue-500/5 blur-[120px] animate-pulse delay-700" />
        <motion.div className="absolute inset-0 opacity-100" style={{ background: backgroundGradient }} />
      </div>

      {/* Navbar */}
      <nav className="relative z-20 flex items-center justify-between px-6 py-5 border-b border-[var(--border-soft)] bg-white/40 dark:bg-[var(--bg-surface)]/80 backdrop-blur-md sticky top-0">
        <Logo className="scale-90 origin-left" />
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-[var(--text-secondary)] hidden sm:block bg-[var(--bg-elevated)] px-3 py-1.5 rounded-full border border-[var(--border-soft)]">
            {user.name}
          </span>
          <Button variant="ghost" onClick={handleLogout} className="text-[var(--text-secondary)] hover:text-brand-primary hover:bg-brand-primary/5 rounded-full">
            <LogOut className="w-4 h-4 mr-2" /> Sign Out
          </Button>
        </div>
      </nav>

      <div className="relative z-10 flex min-h-[calc(100vh-80px)] max-w-[1920px] mx-auto">
        <DashboardSidebar
          activeView="mentor"
          onViewChange={(view) => router.push(`/dashboard?view=${view}`)}
          isAdmin={user.role === "ADMIN"}
        />

        <main className="flex-1 overflow-auto p-6 md:p-12 scroll-smooth">
          <div className="max-w-5xl mx-auto w-full space-y-16 pb-20">

            {/* Header / Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mb-8">
              <span className="cursor-pointer hover:text-[var(--brand-primary)]" onClick={() => router.push("/dashboard")}>Home</span>
              <span className="opacity-30">/</span>
              <span className="text-[var(--text-primary)] font-medium">Mentor</span>
            </div>

            {/* 1. HERO SECTION */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] border border-[var(--brand-primary)]/20 text-xs font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(255,183,3,0.3)]">
                <Sparkles className="w-3 h-3" /> Premium Guidance
              </div>
              <h1 className="text-5xl md:text-7xl font-bold text-[var(--text-primary)] tracking-tight leading-tight">
                Why a Mentor <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-accent)] relative">
                  Changes Everything
                  <svg className="absolute w-full h-3 -bottom-1 left-0 text-[var(--brand-primary)] opacity-40" viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="2" fill="none" />
                  </svg>
                </span>
              </h1>
              <p className="text-xl text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
                In finance and computer science, <span className="text-[var(--text-primary)] font-semibold">guidance beats guesswork</span>.
                Stop making costly mistakes and start accelerating your career.
              </p>
            </motion.div>

            {/* 2. SPLIT VALUE PROPS */}
            <div className="grid md:grid-cols-2 gap-6 relative">
              {/* Finance Card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="group relative bg-[var(--bg-surface)] border border-[var(--border-soft)] rounded-[2.5rem] p-10 overflow-hidden hover:border-[var(--brand-primary)]/30 transition-all duration-500 shadow-xl shadow-[rgba(0,0,0,0.05)] dark:shadow-none"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-primary)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="w-14 h-14 bg-[var(--bg-elevated)] rounded-2xl flex items-center justify-center mb-8 border border-[var(--border-soft)] group-hover:scale-110 transition-transform shadow-sm dark:shadow-[0_0_20px_rgba(255,183,3,0.1)]">
                  <TrendingUp className="w-7 h-7 text-[var(--brand-primary)]" />
                </div>

                <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Finance & Investing</h3>
                <ul className="space-y-4">
                  {[
                    "Avoid emotional trading loss",
                    "Understand complex markets fast",
                    "Build a portfolio that lasts",
                    "Network with high-net-worth peers"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-[var(--text-secondary)]">
                      <CheckCircle2 className="w-5 h-5 text-[var(--brand-primary)] shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* CS Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="group relative bg-[var(--bg-surface)] border border-[var(--border-soft)] rounded-[2.5rem] p-10 overflow-hidden hover:border-[var(--neon-cyan)]/30 transition-all duration-500 shadow-xl shadow-[rgba(0,0,0,0.05)] dark:shadow-none"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--neon-cyan)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="w-14 h-14 bg-[var(--bg-elevated)] rounded-2xl flex items-center justify-center mb-8 border border-[var(--border-soft)] group-hover:scale-110 transition-transform shadow-sm dark:shadow-[0_0_20px_rgba(34,211,238,0.1)]">
                  <Code className="w-7 h-7 text-[var(--neon-cyan)]" />
                </div>

                <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Computer Science</h3>
                <ul className="space-y-4">
                  {[
                    "GPA isn't enough for FAANG",
                    "System design for real scale",
                    "Mock interviews & negotiation",
                    "Tech stack selection strategy"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-[var(--text-secondary)]">
                      <CheckCircle2 className="w-5 h-5 text-[var(--neon-cyan)] shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>

            {/* 3. MENTOR PROFILE & CTA */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative bg-gradient-to-b from-[var(--bg-elevated)] to-[var(--bg-surface)] rounded-[3rem] p-8 md:p-16 text-center border border-[var(--border-soft)] overflow-hidden shadow-2xl dark:shadow-none"
            >
              {/* Glow effect */}
              <div className="absolute top-0 inset-x-0 h-40 bg-[var(--brand-primary)]/5 blur-[80px]" />

              {loading ? (
                <div className="animate-pulse space-y-4">
                  <div className="w-32 h-32 bg-[var(--bg-surface)] rounded-full mx-auto" />
                  <div className="h-8 bg-[var(--bg-surface)] w-48 mx-auto rounded" />
                  <div className="h-4 bg-[var(--bg-surface)] w-64 mx-auto rounded" />
                </div>
              ) : mentor ? (
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-br from-[var(--brand-primary)] to-[var(--neon-cyan)] mb-6 shadow-2xl shadow-[var(--brand-primary)]/20">
                    <div className="w-full h-full rounded-full bg-[var(--bg-surface)] flex items-center justify-center overflow-hidden border-4 border-[var(--bg-surface)]">
                      {/* Placeholder for mentor image, utilizing first letter if no image */}
                      <span className="text-4xl font-bold text-[var(--text-primary)]">{mentor.name.charAt(0)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)]">{mentor.name}</h2>
                    <ShieldCheck className="w-6 h-6 text-blue-500" />
                  </div>

                  <div className="flex flex-wrap justify-center gap-2 mb-8">
                    {mentor.fields.map(field => (
                      <span key={field} className="px-4 py-1.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-soft)] text-[var(--text-primary)] text-sm backdrop-blur-md">
                        {field}
                      </span>
                    ))}
                  </div>

                  <p className="text-lg text-[var(--text-secondary)] max-w-2xl leading-relaxed mb-10">
                    "{mentor.bio}"
                  </p>

                  <Button
                    size="lg"
                    className="h-16 px-10 rounded-full text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:shadow-[0_0_50px_rgba(37,99,235,0.5)] transition-all scale-100 hover:scale-105"
                    onClick={() => window.open(mentor.ctaUrl, '_blank')}
                  >
                    <Facebook className="w-6 h-6 mr-3 fill-current" />
                    Connect on Facebook
                  </Button>
                  <p className="mt-4 text-xs text-[var(--text-secondary)] opacity-60">
                    Start a conversation. No commitment required.
                  </p>
                </div>
              ) : (
                <p className="text-red-500">Mentor data unavailable.</p>
              )}
            </motion.div>

          </div>
        </main>
      </div>
      <ChatPopup />
    </div>
  )
}
