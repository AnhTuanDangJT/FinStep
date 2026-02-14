"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Check, X, ShieldAlert, Loader2, Users, FileText,
  BarChart3, Activity, TrendingUp, Search, AlertTriangle,
  MoreHorizontal, Bell, Lock, Unlock, Eye, StickyNote,
  Megaphone, ChevronRight, FileCheck, Filter, Award, Star, History, ThumbsUp, GraduationCap, RefreshCw, Trash2,
  FileSpreadsheet, ClipboardList
} from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { apiClient, getBlogCoverImageUrl, type Blog, type MentorshipRegistration } from "@/lib/api-client"
import type { UserProfile } from "@/lib/api-client"
import { toast } from "sonner"
import { maskEmail } from "@/lib/security"
import { Button } from "@/components/ui/button"

// --- Types ---

type AdminTab = "overview" | "pending" | "grading" | "users" | "mentorship"

interface StatCardProps {
  label: string
  value: string
  trend?: string
  trendUp?: boolean
  icon: React.ElementType
}

interface AdminUserProfile extends UserProfile {
  stats?: {
    blogs: { total: number; approved: number; pending: number; rejected: number }
    joinedAt: string
  }
}

// --- Components ---

function StatCard({ label, value, trend, trendUp, icon: Icon }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[var(--bg-surface)]/60 backdrop-blur-md border border-[var(--border-soft)] p-6 rounded-[1.5rem] relative overflow-hidden group"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-primary)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative z-10 flex justify-between items-start">
        <div>
          <p className="text-[var(--text-secondary)] text-xs font-bold uppercase tracking-widest mb-1">{label}</p>
          <h3 className="text-3xl font-bold text-[var(--text-primary)]">{value}</h3>
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-bold ${trendUp ? "text-green-500" : "text-red-500"}`}>
              {trendUp ? <TrendingUp className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
              {trend} this week
            </div>
          )}
        </div>
        <div className="p-3 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-soft)] text-[var(--brand-primary)]">
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </motion.div>
  )
}

function StatusChip({ status }: { status: string }) {
  const styles = {
    APPROVED: "bg-green-500/10 text-green-500 border-green-500/20",
    PENDING: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    REJECTED: "bg-red-500/10 text-red-500 border-red-500/20",
    ACTIVE: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    BANNED: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  }
  const colorClass = styles[status as keyof typeof styles] || styles.ACTIVE

  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${colorClass}`}>
      {status}
    </span>
  )
}

// --- Grade Modal ---
function GradeModal({ blog, onClose, onSubmit, saving, initialScore, initialReason }: { blog: Blog; onClose: () => void; onSubmit: (score: number, reason: string) => void; saving: boolean; initialScore?: number; initialReason?: string }) {
  const [score, setScore] = React.useState(initialScore ?? 70)
  const [reason, setReason] = React.useState(initialReason ?? "")

  const getScoreLabel = (s: number) => {
    if (s >= 90) return { label: "EXCELLENT", color: "text-emerald-500" }
    if (s >= 75) return { label: "GOOD", color: "text-blue-500" }
    if (s >= 60) return { label: "AVERAGE", color: "text-amber-500" }
    if (s >= 40) return { label: "WEAK", color: "text-orange-500" }
    return { label: "SPAM/POOR", color: "text-red-500" }
  }

  const { label, color } = getScoreLabel(score)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-[var(--bg-surface)] border border-[var(--border-soft)] rounded-2xl w-full max-w-lg p-6 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Grade Content</h3>
        <p className="text-[var(--text-secondary)] text-sm mb-6">Rate <strong>{blog.title}</strong> to impact author credibility.</p>

        <div className="space-y-8 mb-8">
          <div className="text-center">
            <div className={`text-5xl font-black mb-2 ${color}`}>{score}</div>
            <div className={`text-xs font-bold uppercase tracking-widest ${color}`}>{label}</div>
          </div>

          <input
            type="range"
            min="0"
            max="100"
            value={score}
            onChange={(e) => setScore(Number(e.target.value))}
            className="w-full h-2 bg-[var(--bg-elevated)] rounded-lg appearance-none cursor-pointer accent-[var(--brand-primary)]"
          />
          <div className="flex justify-between text-[10px] text-[var(--text-secondary)] font-mono uppercase">
            <span>0 • Spam</span>
            <span>50 • Average</span>
            <span>100 • Excellent</span>
          </div>
        </div>

        <div className="mb-6">
          <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2 block">Feedback (Optional)</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full bg-[var(--bg-elevated)] border border-[var(--border-soft)] rounded-xl p-3 text-sm focus:outline-none focus:border-[var(--brand-primary)] min-h-[80px]"
            placeholder="Why this score?"
          />
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl h-12">Cancel</Button>
          <Button
            onClick={() => onSubmit(score, reason)}
            disabled={saving}
            className="flex-1 rounded-xl h-12 bg-[var(--brand-primary)] text-black hover:bg-[var(--brand-primary)]/90 font-bold"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Grade"}
          </Button>
        </div>

      </motion.div>
    </motion.div>
  )
}

function AdjustCredibilityModal({ user, onClose, onSubmit, saving }: { user: AdminUserProfile; onClose: () => void; onSubmit: (score: number, reason: string) => void; saving: boolean }) {
  const [score, setScore] = React.useState(75)
  const [reason, setReason] = React.useState("")

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-[var(--bg-surface)] border border-[var(--border-soft)] rounded-2xl w-full max-w-md p-6 shadow-2xl relative overflow-hidden"
      >
        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Adjust Credibility</h3>
        <p className="text-[var(--text-secondary)] text-sm mb-6">Manually update score for <strong>{user.name}</strong>.</p>

        <div className="space-y-4 mb-6">
          <div>
            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2 block">New Score (0-100)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={score}
              onChange={(e) => setScore(Number(e.target.value))}
              className="w-full bg-[var(--bg-elevated)] border border-[var(--border-soft)] rounded-xl p-3 text-lg font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)]"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2 block">Reason (Required)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-[var(--bg-elevated)] border border-[var(--border-soft)] rounded-xl p-3 text-sm focus:outline-none focus:border-[var(--brand-primary)] min-h-[80px]"
              placeholder="Correction, bonus, penalty..."
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl h-12">Cancel</Button>
          <Button
            onClick={() => onSubmit(score, reason)}
            disabled={saving || !reason.trim()}
            className="flex-1 rounded-xl h-12 bg-[var(--brand-primary)] text-black hover:bg-[var(--brand-primary)]/90 font-bold"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Score"}
          </Button>
        </div>

      </motion.div>
    </motion.div>
  )
}

// --- Main View ---

function DeleteConfirmationModal({ title, message, onClose, onConfirm, loading }: { title: string; message: string; onClose: () => void; onConfirm: () => void; loading: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-[var(--bg-surface)] border border-[var(--border-soft)] rounded-2xl w-full max-w-sm p-6 shadow-2xl relative overflow-hidden"
      >
        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">{title}</h3>
        <p className="text-[var(--text-secondary)] text-sm mb-6">{message}</p>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl h-12">Cancel</Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-xl h-12 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 font-bold"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export function AdminView() {
  const { refreshUser } = useAuth()
  const [activeTab, setActiveTab] = React.useState<AdminTab>("overview")

  // Sync session token when admin panel loads so grading and other API calls have Authorization header
  React.useEffect(() => {
    refreshUser()
  }, [refreshUser])
  const [pendingBlogs, setPendingBlogs] = React.useState<Blog[]>([])
  const [approvedBlogs, setApprovedBlogs] = React.useState<Blog[]>([])
  const [users, setUsers] = React.useState<AdminUserProfile[]>([])
  const [loading, setLoading] = React.useState(true)

  // Mentorship registrations
  const [mentorshipItems, setMentorshipItems] = React.useState<MentorshipRegistration[]>([])
  const [mentorshipTotal, setMentorshipTotal] = React.useState(0)
  const [mentorshipPage, setMentorshipPage] = React.useState(1)
  const [mentorshipLimit] = React.useState(20)
  const [mentorshipLoading, setMentorshipLoading] = React.useState(false)
  const [exportingExcel, setExportingExcel] = React.useState(false)
  const [deletingRegistration, setDeletingRegistration] = React.useState<MentorshipRegistration | null>(null)
  const [isDeletingMentorship, setIsDeletingMentorship] = React.useState(false)

  // States
  const [refreshing, setRefreshing] = React.useState(false)
  const [actingId, setActingId] = React.useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = React.useState("")
  const [rejectingBlog, setRejectingBlog] = React.useState<Blog | null>(null)

  // Grading
  const [gradingBlog, setGradingBlog] = React.useState<Blog | null>(null)
  const [grading, setGrading] = React.useState(false)

  // User Actions
  const [viewingUser, setViewingUser] = React.useState<AdminUserProfile | null>(null)
  const [credibilityHistory, setCredibilityHistory] = React.useState<any[]>([])
  const [viewingUserPosts, setViewingUserPosts] = React.useState<Array<{ _id: string; title: string; status: string; grade?: number; gradeLabel?: string; gradedAt?: string; createdAt: string }>>([])
  const [adjustingUser, setAdjustingUser] = React.useState<AdminUserProfile | null>(null)

  const handleAdjustCredibilitySubmit = async (score: number, reason: string) => {
    if (!adjustingUser) return
    if (score < 0 || score > 100) return toast.error("Score must be 0-100")
    setActingId(adjustingUser.id)
    try {
      await apiClient.adjustUserCredibility(adjustingUser.id, score, reason)
      toast.success("Credibility updated")
      setAdjustingUser(null)
      loadData()
    } catch (e) {
      toast.error("Failed to update credibility")
    } finally {
      setActingId(null)
    }
  }

  const handleViewProfile = async (userId: string) => {
    setActingId(userId)
    setCredibilityHistory([])
    try {
      const [data, history] = await Promise.all([
        apiClient.getUserDetails(userId),
        apiClient.getCredibilityHistory(userId).catch(() => [])
      ])
      setViewingUser(data)
      setCredibilityHistory(history)
    } catch (e) {
      toast.error("Failed to load user profile")
    } finally {
      setActingId(null)
    }
  }

  // Load Data
  const loadData = React.useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      const [pendingRes, approvedRes, usersRes] = await Promise.all([
        apiClient.getPendingBlogs(1, 100),
        apiClient.getAdminApprovedBlogs(1, 50), // Approved list with grade/gradedAt for grading tab
        apiClient.getUsers(1, 100)
      ])
      setPendingBlogs(pendingRes.blogs)
      setApprovedBlogs(approvedRes.blogs)
      setUsers(usersRes.users as AdminUserProfile[])
    } catch (e) {
      toast.error("Failed to sync dashboard")
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshDashboard = React.useCallback(async (retryAttempt = false) => {
    setRefreshing(true)
    try {
      await apiClient.getAdminOverview()

      const [pendingRes, approvedRes, usersRes] = await Promise.allSettled([
        apiClient.getPendingBlogs(1, 100),
        apiClient.getAdminApprovedBlogs(1, 50),
        apiClient.getUsers(1, 100)
      ])

      if (pendingRes.status === "fulfilled") setPendingBlogs(pendingRes.value.blogs)
      if (approvedRes.status === "fulfilled") setApprovedBlogs(approvedRes.value.blogs)
      if (usersRes.status === "fulfilled") setUsers((usersRes.value.users ?? []) as AdminUserProfile[])

      toast.success("Dashboard refreshed")
      setRefreshing(false)
    } catch (e: any) {
      if (!retryAttempt) {
        toast("Connection unstable, retrying...", { id: "refresh-retry" })
        setTimeout(() => refreshDashboard(true), 1500)
        return
      }
      setRefreshing(false)

      const msg = e.message || "Unknown error"
      const isNetwork = msg.includes("fetch") || msg.includes("Network") || e.name === "TypeError"
      const isAuth = msg.toLowerCase().includes("unauthorized") || msg.toLowerCase().includes("forbidden") || msg.includes("401") || msg.includes("403")

      if (isNetwork) {
        toast.error("Network connection failed. Please check your internet.")
      } else if (isAuth) {
        toast.error("Session expired. Please log in again.")
      } else {
        toast.error(`Server Error: ${msg}`)
      }
    }
  }, [])

  const handleRefresh = React.useCallback(() => {
    refreshDashboard(false)
  }, [refreshDashboard])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  const loadMentorshipRegistrations = React.useCallback(async (page = 1) => {
    setMentorshipLoading(true)
    try {
      const res = await apiClient.getMentorshipRegistrations(page, mentorshipLimit)
      setMentorshipItems(res.items)
      setMentorshipTotal(res.total)
      setMentorshipPage(res.page)
    } catch {
      toast.error("Failed to load registrations")
    } finally {
      setMentorshipLoading(false)
    }
  }, [mentorshipLimit])

  React.useEffect(() => {
    if (activeTab === "mentorship") {
      loadMentorshipRegistrations(mentorshipPage)
    }
  }, [activeTab, mentorshipPage, loadMentorshipRegistrations])

  const handleDownloadExcel = React.useCallback(async () => {
    setExportingExcel(true)
    try {
      const blob = await apiClient.downloadMentorshipExcel()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "mentorship_registrations.xlsx"
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Excel downloaded")
    } catch {
      toast.error("Failed to download Excel")
    } finally {
      setExportingExcel(false)
    }
  }, [])

  // Load posts (with grades) when admin opens a user's profile
  React.useEffect(() => {
    if (!viewingUser?.id) {
      setViewingUserPosts([])
      return
    }
    apiClient.getAdminUserPosts(viewingUser.id).then((posts) => setViewingUserPosts(Array.isArray(posts) ? posts : [])).catch(() => setViewingUserPosts([]))
  }, [viewingUser?.id])

  // --- Handlers ---

  const handleDeleteMentorship = (registration: MentorshipRegistration) => {
    setDeletingRegistration(registration)
  }

  const handleDeleteMentorshipConfirm = async () => {
    if (!deletingRegistration) return
    setIsDeletingMentorship(true)
    try {
      // Optimistic UI: Remove immediately from list
      const idToDelete = deletingRegistration.id
      setMentorshipItems(prev => prev.filter(item => item.id !== idToDelete))
      setMentorshipTotal(prev => prev - 1)

      // Call API
      await apiClient.deleteMentorshipRegistration(idToDelete)
      toast.success("Registration deleted successfully")

      // Close modal
      setDeletingRegistration(null)
    } catch (e: any) {
      // Revert optimistic update if failed (optional, but good practice. For now simpler to just refetch or show error)
      toast.error("Failed to delete registration")
      loadMentorshipRegistrations(mentorshipPage) // Refetch to sync state
    } finally {
      setIsDeletingMentorship(false)
    }
  }

  const handleApprove = async (blog: Blog) => {
    setActingId(blog._id)
    try {
      await apiClient.approveBlog(blog._id)
      setPendingBlogs(prev => prev.filter(b => b._id !== blog._id))
      toast.success("Blog approved")
      // Prompt to grade immediately?
      if (window.confirm("Do you want to grade this post now to update author credibility?")) {
        setGradingBlog(blog)
      } else {
        loadData() // Refresh approved list
      }
    } catch (e) {
      toast.error("Approval failed")
    } finally {
      setActingId(null)
    }
  }

  const handleRejectConfirm = async () => {
    if (!rejectingBlog) return
    setActingId(rejectingBlog._id)
    try {
      await apiClient.rejectBlog(rejectingBlog._id, rejectionReason)
      setPendingBlogs(prev => prev.filter(b => b._id !== rejectingBlog._id))
      toast.success("Blog rejected")
      setRejectingBlog(null)
      setRejectionReason("")
    } catch (e) {
      toast.error("Rejection failed")
    } finally {
      setActingId(null)
    }
  }

  const handleGradeSubmit = async (score: number, reason: string) => {
    if (!gradingBlog) return
    setGrading(true)
    try {
      const alreadyGraded = gradingBlog.gradedAt != null || typeof gradingBlog.grade === 'number'
      const { blog: updated, regraded } = await apiClient.gradeBlog(gradingBlog._id, score, reason, alreadyGraded)
      toast.success(regraded ? "The post's grade is updated." : "Grade submitted & Credibility updated")
      setApprovedBlogs(prev =>
        prev.map(b => (b._id === gradingBlog._id ? { ...b, grade: updated.grade ?? score, gradedAt: updated.gradedAt ?? new Date().toISOString(), gradeLabel: updated.gradeLabel } : b))
      )
      setGradingBlog(null)
      loadData()
    } catch (e: any) {
      const status = e.status
      if (status === 409) {
        toast.error("This post is already graded. Open it again and submit to update the grade (regrade).")
      } else if (status === 400) {
        toast.error(e.message || "Invalid grading request")
      } else if (status === 404) {
        toast.error("Post or author no longer exists.")
      } else if (status === 500) {
        toast.error("Server error. Please try again.")
      } else {
        toast.error(e.message || "Grading failed")
      }
    } finally {
      setGrading(false)
    }
  }

  const handlePromote = async (email: string) => {
    if (!window.confirm(`Promote ${email} to Admin?`)) return
    setActingId(email)
    try {
      await apiClient.addAdmin(email)
      await loadData()
      toast.success(`${email} is now an Admin`)
    } catch (e) {
      toast.error("Promotion failed")
    } finally {
      setActingId(null)
    }
  }

  const handleDeleteBlog = async (blog: Blog) => {
    if (!window.confirm(`Permanently delete "${blog.title}"? This cannot be undone.`)) return
    setActingId(blog._id)
    try {
      await apiClient.deleteBlog(blog._id)
      setPendingBlogs((prev) => prev.filter((b) => b._id !== blog._id))
      setApprovedBlogs((prev) => prev.filter((b) => b._id !== blog._id))
      toast.success("Blog deleted")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete blog")
    } finally {
      setActingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="w-12 h-12 text-[var(--brand-primary)] animate-spin" />
        <p className="text-[var(--text-secondary)] animate-pulse">Initializing Control Center...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 min-h-screen pb-20">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20 uppercase tracking-widest">
              v2.5.0 Live
            </span>
            <div className="h-4 w-px bg-[var(--border-soft)]" />
            <span className="text-xs text-[var(--text-secondary)] font-mono">SYS-ADMIN-01</span>
          </div>
          <h1 className="text-4xl font-bold text-[var(--text-primary)] tracking-tight">Command Center</h1>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="rounded-xl border-[var(--border-soft)] text-[var(--text-secondary)] hover:text-[var(--brand-primary)] hover:border-[var(--brand-primary)]/30"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {/* Nav Tabs */}
          <div className="flex p-1 bg-[var(--black-elevated)] backdrop-blur-md rounded-2xl border border-[var(--border-soft)] overflow-x-auto">
            {(["overview", "pending", "grading", "users", "mentorship"] as AdminTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                px-6 py-2.5 rounded-xl text-sm font-bold transition-all relative whitespace-nowrap
                ${activeTab === tab ? "text-[var(--brand-primary)] bg-[var(--bg-surface)] shadow-sm" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}
              `}
              >
                <span className="capitalize flex items-center gap-2">
                  {tab === "overview" && <Activity className="w-4 h-4" />}
                  {tab === "pending" && <FileText className="w-4 h-4" />}
                  {tab === "grading" && <Star className="w-4 h-4" />}
                  {tab === "users" && <Users className="w-4 h-4" />}
                  {tab === "mentorship" && <ClipboardList className="w-4 h-4" />}
                  {tab === "mentorship" ? "Registered program" : tab}
                  {tab === "pending" && pendingBlogs.length > 0 && (
                    <span className="bg-[var(--neon-red)] text-white text-[9px] px-1.5 py-0.5 rounded-full">
                      {pendingBlogs.length}
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {/* OVERVIEW */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard label="Pending" value={pendingBlogs.length.toString()} icon={FileText} trend="+2" trendUp />
              <StatCard label="Approved" value={approvedBlogs.length.toString()} icon={Check} trend="+12%" trendUp />
              <StatCard label="Users" value={users.length.toString()} icon={Users} trend="+5%" trendUp />
            </div>
          )}

          {/* PENDING */}
          {activeTab === "pending" && (
            <div className="space-y-4">
              {pendingBlogs.length === 0 ? (
                <div className="text-center py-20 bg-[var(--bg-surface)]/30 rounded-2xl border border-[var(--border-soft)] border-dashed">
                  <Check className="w-12 h-12 text-green-500/50 mx-auto mb-4" />
                  <p className="text-[var(--text-primary)] font-bold">All caught up!</p>
                </div>
              ) : (
                pendingBlogs.map(blog => {
                  const imageUrl = getBlogCoverImageUrl(blog.coverImageUrl, blog.imageUrl)
                  return (
                    <div key={blog._id} className="bg-[var(--bg-surface)] border border-[var(--border-soft)] rounded-2xl p-6 flex flex-col md:flex-row gap-6 hover:shadow-lg transition-all">
                      {imageUrl && (
                        <div className="w-full md:w-48 h-32 rounded-xl bg-[var(--black-elevated)] overflow-hidden shrink-0">
                          <img src={imageUrl} alt={blog.title} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="text-xl font-bold text-[var(--text-primary)] mb-2">{blog.title}</h4>
                        <p className="text-[var(--text-secondary)] text-sm mb-4 line-clamp-2">{blog.excerpt}</p>
                        <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)] mb-4">
                          <span>{blog.author?.name}</span>
                          <span>•</span>
                          <span>{new Date(blog.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <Button onClick={() => handleApprove(blog)} disabled={!!actingId} className="bg-[var(--brand-primary)] text-black font-bold h-9">
                            {actingId === blog._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                            Approve
                          </Button>
                          <Button onClick={() => setRejectingBlog(blog)} variant="outline" className="text-red-500 hover:text-red-600 border-red-500/20 hover:bg-red-500/10 h-9">
                            <X className="w-4 h-4 mr-2" /> Reject
                          </Button>
                          <Button
                            onClick={() => handleDeleteBlog(blog)}
                            disabled={!!actingId}
                            variant="outline"
                            className="text-red-500 hover:text-red-600 border-red-500/20 hover:bg-red-500/10 h-9"
                          >
                            {actingId === blog._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}

          {/* GRADING */}
          {activeTab === "grading" && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Approved & Recent Content</h3>
              <div className="grid gap-4">
                {approvedBlogs.map(blog => {
                  const currentGrade = typeof blog.grade === 'number' ? blog.grade : typeof blog.gradeScore === 'number' ? blog.gradeScore : undefined;
                  const isGraded = blog.gradedAt != null || typeof blog.grade === 'number' || (typeof currentGrade === 'number' && currentGrade >= 0);
                  return (
                    <div key={blog._id} className="bg-[var(--bg-surface)] border border-[var(--border-soft)] rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-center">
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-[var(--text-primary)] transition-colors hover:text-[var(--brand-primary)] cursor-pointer" onClick={() => window.open(`/blog/${blog._id}`, '_blank')}>
                          {blog.title}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] mt-1">
                          <span>By {blog.author?.name}</span>
                          <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 font-bold border border-green-500/20">Approved</span>
                          {isGraded && (
                            <span className={`px-2 py-0.5 rounded-full font-bold border ${(currentGrade || 0) >= 75 ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                              (currentGrade || 0) >= 50 ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                                "bg-red-500/10 text-red-500 border-red-500/20"
                              }`}>
                              Grade: {currentGrade}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => setGradingBlog(blog)}
                          variant={isGraded ? "outline" : "default"}
                          className={isGraded
                            ? "border-2 border-emerald-500 bg-emerald-600/30 text-white font-semibold hover:bg-emerald-500/50 hover:border-emerald-400 shadow-sm"
                            : "bg-[var(--bg-elevated)] text-[var(--brand-primary)] border border-[var(--brand-primary)]/20 hover:bg-[var(--brand-primary)] hover:text-black"
                          }
                        >
                          <GraduationCap className="w-4 h-4 mr-2" />
                          {isGraded ? "Graded" : "Grade Content"}
                        </Button>
                        <Button
                          onClick={() => handleDeleteBlog(blog)}
                          disabled={!!actingId}
                          variant="outline"
                          className="text-red-500 hover:text-red-600 border-red-500/20 hover:bg-red-500/10"
                        >
                          {actingId === blog._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* MENTORSHIP - Registered program control panel */}
          {activeTab === "mentorship" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Registered program control panel</h3>
                <Button
                  onClick={handleDownloadExcel}
                  disabled={exportingExcel || mentorshipTotal === 0}
                  className="bg-[var(--brand-primary)] text-black font-bold rounded-xl hover:bg-[var(--brand-primary)]/90"
                >
                  {exportingExcel ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileSpreadsheet className="w-4 h-4 mr-2" />}
                  Download Excel
                </Button>
              </div>

              {mentorshipLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-10 h-10 text-[var(--brand-primary)] animate-spin" />
                </div>
              ) : mentorshipItems.length === 0 ? (
                <div className="text-center py-20 bg-[var(--bg-surface)]/30 rounded-2xl border border-[var(--border-soft)] border-dashed">
                  <ClipboardList className="w-12 h-12 text-[var(--text-secondary)]/50 mx-auto mb-4" />
                  <p className="text-[var(--text-primary)] font-bold">No registrations yet</p>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">Mentorship registrations will appear here.</p>
                </div>
              ) : <div className="bg-[var(--bg-surface)] border border-[var(--border-soft)] rounded-[2rem] overflow-hidden">
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-[var(--bg-elevated)] text-[10px] font-bold uppercase text-[var(--text-secondary)]">
                      <tr>
                        <th className="p-4">Name</th>
                        <th className="p-4">University/School</th>
                        <th className="p-4">Experience Level</th>
                        <th className="p-4">Major</th>
                        <th className="p-4">Finance Focus</th>
                        <th className="p-4">Created At</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-soft)] text-sm">
                      {mentorshipItems.map((r, i) => (
                        <tr key={`${r.id}-${i}`} className="hover:bg-[var(--bg-elevated)]/50 transition-colors">
                          <td className="p-4 font-medium text-[var(--text-primary)]">{r.name}</td>
                          <td className="p-4 text-[var(--text-secondary)]">{r.school}</td>
                          <td className="p-4 text-[var(--text-secondary)]">{r.experienceLevel}</td>
                          <td className="p-4 text-[var(--text-secondary)]">{r.major}</td>
                          <td className="p-4 text-[var(--text-secondary)]">{r.financeFocus}</td>
                          <td className="p-4 text-[var(--text-secondary)] text-xs">
                            {new Date(r.createdAt).toLocaleDateString()} {new Date(r.createdAt).toLocaleTimeString()}
                          </td>
                          <td className="p-4 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteMentorship(r)}
                              className="h-8 w-8 p-0 rounded-lg text-red-500 hover:text-red-500 hover:bg-red-500/10 hover:shadow-[0_0_10px_rgba(239,68,68,0.5)] transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4 p-4">
                  {mentorshipItems.map((r, i) => (
                    <div key={`${r.id}-mobile-${i}`} className="bg-[var(--bg-elevated)]/30 rounded-xl p-5 border border-[var(--border-soft)] space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-[var(--text-primary)] text-lg">{r.name}</h4>
                          <p className="text-sm text-[var(--text-secondary)]">{r.school}</p>
                        </div>
                        <span className="text-[10px] font-mono text-[var(--text-secondary)] bg-[var(--bg-surface)] px-2 py-1 rounded">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="bg-[var(--bg-surface)] p-2 rounded-lg">
                          <span className="block text-[10px] uppercase text-[var(--text-secondary)] font-bold">Experience</span>
                          {r.experienceLevel}
                        </div>
                        <div className="bg-[var(--bg-surface)] p-2 rounded-lg">
                          <span className="block text-[10px] uppercase text-[var(--text-secondary)] font-bold">Major</span>
                          {r.major}
                        </div>
                      </div>

                      <div className="bg-[var(--bg-surface)] p-2 rounded-lg">
                        <span className="block text-[10px] uppercase text-[var(--text-secondary)] font-bold">Finance Focus</span>
                        {r.financeFocus}
                      </div>

                      <Button
                        onClick={() => handleDeleteMentorship(r)}
                        className="w-full bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 font-bold mt-2"
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> Delete Registration
                      </Button>
                    </div>
                  ))}
                </div>

                {mentorshipTotal > mentorshipLimit && (
                  <div className="flex items-center justify-between px-4 py-3 bg-[var(--bg-elevated)]/50 border-t border-[var(--border-soft)]">
                    <span className="text-xs text-[var(--text-secondary)]">
                      Showing {(mentorshipPage - 1) * mentorshipLimit + 1}–{Math.min(mentorshipPage * mentorshipLimit, mentorshipTotal)} of {mentorshipTotal}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={mentorshipPage <= 1}
                        onClick={() => setMentorshipPage((p) => Math.max(1, p - 1))}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={mentorshipPage * mentorshipLimit >= mentorshipTotal}
                        onClick={() => setMentorshipPage((p) => p + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              }
            </div>
          )}

          {/* USERS */}
          {activeTab === "users" && (
            <div className="bg-[var(--bg-surface)] border border-[var(--border-soft)] rounded-[2rem] overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-[var(--bg-elevated)] text-[10px] font-bold uppercase text-[var(--text-secondary)]">
                  <tr>
                    <th className="p-4">User</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Credibility</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-soft)] text-sm">
                  {users.map((u, i) => (
                    <tr key={u.id || u.email || `user-${i}`} className="hover:bg-[var(--bg-elevated)]/50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-[var(--text-primary)]">{u.name}</div>
                        <div className="text-xs text-[var(--text-secondary)]">{maskEmail(u.email)}</div>
                      </td>
                      <td className="p-4"><StatusChip status={u.role || "USER"} /></td>
                      <td className="p-4">
                        <div className="w-24 h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden" title={`Score: ${u.credibilityScore ?? 0}`}>
                          <div
                            className={`h-full transition-all duration-500 ${(u.credibilityScore ?? 0) >= 90 ? "bg-emerald-500" :
                              (u.credibilityScore ?? 0) >= 75 ? "bg-blue-500" :
                                (u.credibilityScore ?? 0) >= 60 ? "bg-amber-500" :
                                  (u.credibilityScore ?? 0) >= 40 ? "bg-orange-500" : "bg-red-500"
                              }`}
                            style={{ width: `${Math.min(100, Math.max(0, u.credibilityScore ?? 0))}%` }}
                          />
                        </div>
                      </td>
                      <td className="p-4 text-right flex justify-end gap-2">
                        {u.role !== "ADMIN" && (
                          <>
                            <button onClick={() => setAdjustingUser(u)} className="p-2 hover:bg-[var(--brand-primary)]/10 text-[var(--text-secondary)] hover:text-[var(--brand-primary)] rounded-lg" title="Adjust Credibility">
                              <Award className="w-4 h-4" />
                            </button>
                            <button onClick={() => handlePromote(u.email)} className="p-2 hover:bg-[var(--brand-primary)]/10 text-[var(--text-secondary)] hover:text-[var(--brand-primary)] rounded-lg">
                              <ShieldAlert className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button onClick={() => setViewingUser(u)} className="p-2 hover:bg-[var(--bg-elevated)] rounded-lg text-[var(--text-secondary)]">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* MODALS */}
      {gradingBlog && (
        <GradeModal
          blog={gradingBlog}
          onClose={() => setGradingBlog(null)}
          onSubmit={handleGradeSubmit}
          saving={grading}
          initialScore={gradingBlog.gradeScore ?? gradingBlog.grade ?? undefined}
          initialReason={gradingBlog.gradeReason || gradingBlog.reason || ""}
        />
      )}

      {adjustingUser && (
        <AdjustCredibilityModal
          user={adjustingUser}
          onClose={() => setAdjustingUser(null)}
          onSubmit={handleAdjustCredibilitySubmit}
          saving={!!actingId}
        />
      )}

      {/* Rejection Modal Reuse logic from previous step, inserted below if needed */}
      {
        rejectingBlog && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[var(--bg-surface)] border border-[var(--border-soft)] rounded-2xl w-full max-w-md p-6 shadow-2xl"
            >
              <h3 className="text-lg font-bold text-[var(--neon-red)] mb-4">Reject Submission</h3>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full bg-[var(--bg-elevated)] border border-[var(--border-soft)] rounded-xl p-3 text-sm min-h-[100px] mb-4 text-[var(--text-primary)]"
                placeholder="Reason..."
              />
              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setRejectingBlog(null)}>Cancel</Button>
                <Button onClick={handleRejectConfirm} className="bg-[var(--neon-red)] text-white hover:bg-red-600">Confirm Reject</Button>
              </div>
            </motion.div>
          </div>
        )
      }

      {/* User Profile Modal */}
      {viewingUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-end" onClick={() => setViewingUser(null)}>
          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            className="w-full max-w-md h-full bg-[var(--bg-surface)] border-l border-[var(--border-soft)] p-6 shadow-2xl overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">{viewingUser.name}</h2>
              <Button variant="ghost" size="icon" onClick={() => setViewingUser(null)}><X className="w-5 h-5" /></Button>
            </div>

            <div className="mb-8 text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-3xl font-bold text-[var(--text-primary)] mb-3">
                {viewingUser.name.charAt(0)}
              </div>
              <div className="text-[var(--text-secondary)] font-mono text-sm">{maskEmail(viewingUser.email)}</div>
              <div className="mt-2"><StatusChip status={viewingUser.role || "USER"} /></div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-3">Credibility History</h3>
                {credibilityHistory.length === 0 ? (
                  <div className="text-center py-8 border border-[var(--border-soft)] rounded-xl border-dashed">
                    <History className="w-8 h-8 text-[var(--text-secondary)]/30 mx-auto mb-2" />
                    <p className="text-xs text-[var(--text-secondary)]">No recorded activity</p>
                  </div>
                ) : (
                  <div className="space-y-3 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-[var(--border-soft)]">
                    {credibilityHistory.map((event, i) => (
                      <div key={i} className="pl-6 relative">
                        <div className={`absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 border-[var(--bg-surface)] ${event.scoreDelta > 0 ? "bg-green-500" : "bg-red-500"}`} />
                        <div className="bg-[var(--bg-elevated)]/50 p-3 rounded-xl border border-[var(--border-soft)]">
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-xs font-bold text-[var(--text-primary)]">{event.event.replace(/_/g, " ")}</span>
                            <span className={`text-xs font-bold ${event.scoreDelta > 0 ? "text-green-500" : "text-red-500"}`}>
                              {event.scoreDelta > 0 ? "+" : ""}{event.scoreDelta}
                            </span>
                          </div>
                          <p className="text-xs text-[var(--text-secondary)] mb-2">{event.reason}</p>
                          <div className="text-[10px] text-[var(--text-secondary)]/50">
                            {new Date(event.createdAt).toLocaleDateString()} • {new Date(event.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-3">Posts & grades</h3>
                {(!Array.isArray(viewingUserPosts) || viewingUserPosts.length === 0) ? (
                  <div className="text-center py-6 border border-[var(--border-soft)] rounded-xl border-dashed">
                    <FileText className="w-8 h-8 text-[var(--text-secondary)]/30 mx-auto mb-2" />
                    <p className="text-xs text-[var(--text-secondary)]">No posts yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {viewingUserPosts.map((post) => (
                      <div
                        key={post._id}
                        className="bg-[var(--bg-elevated)]/50 p-3 rounded-xl border border-[var(--border-soft)] flex flex-col gap-1"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-sm font-bold text-[var(--text-primary)] line-clamp-2">{post.title}</span>
                          <StatusChip status={post.status} />
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          {post.gradedAt != null && typeof post.grade === "number" ? (
                            <span className="px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              Grade: {post.grade}
                              {post.gradeLabel ? ` (${post.gradeLabel})` : ""}
                            </span>
                          ) : (
                            <span className="text-[var(--text-secondary)]">Not graded</span>
                          )}
                          {post.gradedAt && (
                            <span className="text-[10px] text-[var(--text-secondary)]/70">
                              {new Date(post.gradedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {deletingRegistration && (
        <DeleteConfirmationModal
          title="Delete Registration"
          message="Are you sure you want to delete this registration? This action cannot be undone."
          onClose={() => setDeletingRegistration(null)}
          onConfirm={handleDeleteMentorshipConfirm}
          loading={isDeletingMentorship}
        />
      )}

    </div>
  )
}
