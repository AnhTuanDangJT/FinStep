"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Clock, CheckCircle2, XCircle, Edit2, Trash2, Loader2, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { apiClient, getBlogCoverImageUrl, type Blog } from "@/lib/api-client"

interface MyBlogsViewProps {
  onEditClick?: (blog: Blog) => void
}

export function MyBlogsView({ onEditClick }: MyBlogsViewProps) {
  const [blogs, setBlogs] = React.useState<Blog[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)

  React.useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await apiClient.getMyBlogs(1, 50)
        if (!cancelled) setBlogs(res.blogs)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load blogs")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-500/10 text-green-500 border border-green-500/20"
      case "PENDING":
        return "bg-[var(--neon-amber)]/10 text-[var(--neon-amber)] border border-[var(--neon-amber)]/20"
      case "REJECTED":
        return "bg-[var(--neon-red)]/10 text-[var(--neon-red)] border border-[var(--neon-red)]/20"
      default:
        return "bg-[var(--black-elevated)] text-[var(--text-secondary)]"
    }
  }

  const handleDelete = React.useCallback(
    async (blog: Blog) => {
      if (!window.confirm(`Delete "${blog.title}"? This cannot be undone.`)) return
      setDeletingId(blog._id)
      try {
        await apiClient.deleteBlog(blog._id)
        toast.success("Blog deleted successfully")
        setBlogs((prev) => prev.filter((b) => b._id !== blog._id))
      } catch (e) {
        console.error("Delete failed", e)
        toast.error(e instanceof Error ? e.message : "Failed to delete blog")
      } finally {
        setDeletingId(null)
      }
    },
    []
  )

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <CheckCircle2 className="w-4 h-4 mr-1.5" />
      case "PENDING":
        return <Clock className="w-4 h-4 mr-1.5" />
      case "REJECTED":
        return <XCircle className="w-4 h-4 mr-1.5" />
      default:
        return null
    }
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const item = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-10 h-10 animate-spin text-brand-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-600">
        <p>{error}</p>
      </div>
    )
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-brand-text mb-2">My Blogs</h2>
        <p className="text-brand-text/60">Manage your submissions and track performance.</p>
      </div>

      <div className="grid gap-4">
        {blogs.map((blog) => (
          <motion.div
            key={blog._id}
            variants={item}
            className="group bg-[var(--black-surface)] backdrop-blur-md border border-[var(--border-soft)] p-6 rounded-2xl hover:bg-[var(--black-surface)]/80 hover:shadow-lg hover:shadow-[var(--brand-primary)]/5 transition-all duration-300 flex items-center justify-between"
          >
            {getBlogCoverImageUrl(blog.coverImageUrl, blog.imageUrl) ? (
              <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 mr-4 border border-brand-text/10 bg-brand-text/5">
                <img
                  src={getBlogCoverImageUrl(blog.coverImageUrl, blog.imageUrl)!}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            ) : null}
            <div className="flex-1 pr-6 min-w-0">
              <div className="flex items-center gap-3 mb-3">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center shadow-sm ${getStatusColor(blog.status || "PENDING")}`}>
                  {getStatusIcon(blog.status || "PENDING")}
                  {blog.status || "PENDING"}
                </span>
                <span className="text-xs font-medium text-[var(--text-secondary)] opacity-60">
                  {blog.createdAt
                    ? new Date(blog.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric"
                    })
                    : "—"}
                </span>
              </div>
              <h3 className="text-xl font-bold text-[var(--text-primary)] group-hover:text-[var(--brand-primary)] transition-colors">
                {blog.title}
              </h3>
              {blog.status === "REJECTED" && (
                <div className="mt-2 text-sm text-[var(--neon-red)] bg-[var(--neon-red)]/5 border border-[var(--neon-red)]/10 p-3 rounded-xl flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-xs uppercase tracking-wider mb-0.5 opacity-80">Rejection Reason:</span>
                    <p className="opacity-90 leading-relaxed">{blog.rejectionReason || "No reason provided."}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-6">
              {blog.status === "APPROVED" && (
                <div className="text-right hidden sm:block">
                  <div className="text-lg font-bold text-[var(--text-primary)]">{blog.likes ?? 0}</div>
                  <div className="text-xs text-[var(--text-secondary)] opacity-40 font-medium uppercase tracking-wide">Likes</div>
                </div>
              )}

              <div className="flex items-center gap-2 pl-6 border-l border-brand-text/5 relative z-20">
                <button
                  type="button"
                  className="p-2.5 hover:bg-[var(--brand-primary)]/10 rounded-xl text-[var(--text-secondary)] opacity-40 hover:opacity-100 hover:text-[var(--brand-primary)] transition-colors disabled:opacity-50 cursor-pointer"
                  title="Edit"
                  onClick={(e) => {
                    e.stopPropagation()
                    console.log("Edit clicked", blog._id)
                    onEditClick?.(blog)
                  }}
                  disabled={!onEditClick}
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className="p-2.5 hover:bg-[var(--neon-red)]/10 rounded-xl text-[var(--text-secondary)] opacity-40 hover:opacity-100 hover:text-[var(--neon-red)] transition-colors disabled:opacity-50 cursor-pointer"
                  title="Delete"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(blog)
                  }}
                  disabled={deletingId === blog._id}
                >
                  {deletingId === blog._id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {blogs.length === 0 && (
        <div className="text-center py-12 text-brand-text/50">
          <p>You haven&apos;t written any blogs yet.</p>
        </div>
      )}
    </motion.div>
  )
}
