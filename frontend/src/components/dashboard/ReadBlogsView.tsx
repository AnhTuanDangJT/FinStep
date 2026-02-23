"use client"

import * as React from "react"
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion"
import { BookOpen, X, RefreshCw, TrendingUp, Users, MessageCircle, PenTool, Sparkles, ArrowRight, Heart, MessageSquare, Share2 } from "lucide-react"
import { apiClient, type Blog } from "@/lib/api-client"
import { useAuth } from "@/context/AuthContext"
import dynamic from "next/dynamic"
import { PostCardSkeleton } from "./PostCardSkeleton"
import { Button } from "@/components/ui/button"

const PostCard = dynamic(() => import('./PostCard').then(mod => mod.PostCard), {
  loading: () => <PostCardSkeleton />
})

import { toast } from "sonner"
import { TutorialModal } from "./TutorialModal"
import { FiltersBar } from "./FiltersBar"
import { BlogLightbox } from "./BlogLightbox"

interface ReadBlogsViewProps {
  onWriteClick?: () => void
}

export function ReadBlogsView({ onWriteClick }: ReadBlogsViewProps) {
  const { user } = useAuth()
  const isAdmin = user?.role === "ADMIN" || user?.email === "dganhtuan.2k5@gmail.com"
  const [blogs, setBlogs] = React.useState<Blog[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [likingId, setLikingId] = React.useState<string | null>(null)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)

  const [lightbox, setLightbox] = React.useState<{
    isOpen: boolean
    images: string[]
    initialIndex: number
  }>({
    isOpen: false,
    images: [],
    initialIndex: 0
  })

  const [showTutorial, setShowTutorial] = React.useState(false)

  const [search, setSearch] = React.useState("")
  const [category, setCategory] = React.useState("")
  const [sort, setSort] = React.useState("newest")
  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = React.useState(search)

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500)
    return () => clearTimeout(timer)
  }, [search])

  const { scrollY } = useScroll()
  const headerOpacity = useTransform(scrollY, [0, 200], [1, 0.8])
  const headerY = useTransform(scrollY, [0, 200], [0, 50])

  React.useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const res = await apiClient.getApprovedBlogs(1, 20, debouncedSearch, category, sort)
        if (!cancelled) setBlogs(res.blogs)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load blogs")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [debouncedSearch, category, sort])

  const handleLike = React.useCallback(async (blog: Blog) => {
    if (likingId) return
    const userId = user?.id ?? ""
    const wasLiked = blog.likedBy?.includes(userId)
    setLikingId(blog._id)
    // Optimistic update
    setBlogs((prev) =>
      prev.map((b) =>
        b._id === blog._id
          ? {
            ...b,
            likes: (b.likes ?? 0) + (wasLiked ? -1 : 1),
            likedBy: wasLiked
              ? (b.likedBy ?? []).filter((id) => id !== userId)
              : userId ? [...(b.likedBy ?? []), userId] : (b.likedBy ?? []),
          }
          : b
      )
    )
    try {
      const res = await apiClient.toggleLike(blog._id)
      setBlogs((prev) =>
        prev.map((b) => (b._id === blog._id ? res.blog : b))
      )
    } catch {
      // Revert on error
      setBlogs((prev) =>
        prev.map((b) => (b._id === blog._id ? blog : b))
      )
    } finally {
      setLikingId(null)
    }
  }, [likingId, user?.id])

  const handleWriteClick = React.useCallback(() => {
    onWriteClick?.()
  }, [onWriteClick])

  const handleDelete = React.useCallback(async (blog: Blog) => {
    if (deletingId) return
    setDeletingId(blog._id)
    try {
      await apiClient.deleteBlog(blog._id)
      setBlogs((prev) => prev.filter((b) => b._id !== blog._id))
      toast.success("Blog deleted")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete blog")
    } finally {
      setDeletingId(null)
    }
  }, [deletingId])

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-8 pb-20 pt-10">
        <PostCardSkeleton />
        <PostCardSkeleton />
        <PostCardSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="bg-red-50 p-4 rounded-full mb-4">
          <X className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-lg font-bold text-brand-text mb-2">Something went wrong</h3>
        <p className="text-brand-text/60 mb-6 max-w-md">{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen pb-20 isolate-layer">
      <TutorialModal isOpen={showTutorial} onClose={() => setShowTutorial(false)} />

      {/* 1. LAYERED BACKGROUND */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden isolate-layer">
        {/* Drifting Finance Symbols */}
        <motion.div
          animate={{ y: [0, -100], opacity: [0.05, 0] }}
          transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
          className="absolute top-[20%] left-[10%] text-brand-primary text-9xl font-bold opacity-5 select-none will-change-transform"
        >
          $
        </motion.div>
        <motion.div
          animate={{ y: [0, -150], opacity: [0.03, 0] }}
          transition={{ repeat: Infinity, duration: 25, ease: "linear", delay: 2 }}
          className="absolute top-[40%] right-[15%] text-brand-text text-8xl font-bold opacity-5 select-none will-change-transform"
        >
          %
        </motion.div>
        {/* Grid Lines */}
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03]" />
      </div>


      {/* 2. HERO AREA & FILTERS */}
      <motion.div
        style={{ opacity: headerOpacity, y: headerY }}
        className="relative z-30 text-center mb-8 space-y-4 pt-8"
      >
        {/* Social Signals */}
        <div className="flex justify-center gap-4 mb-4">
          <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 3 }} className="p-2 bg-[var(--black-elevated)] backdrop-blur-md rounded-full shadow-sm text-[var(--brand-primary)] border border-[var(--border-soft)]">
            <TrendingUp className="w-5 h-5" />
          </motion.div>
          <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 3, delay: 0.5 }} className="p-2 bg-[var(--black-elevated)] backdrop-blur-md rounded-full shadow-sm text-blue-500 border border-[var(--border-soft)]">
            <Users className="w-5 h-5" />
          </motion.div>
          <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 3, delay: 1 }} className="p-2 bg-[var(--black-elevated)] backdrop-blur-md rounded-full shadow-sm text-orange-500 border border-[var(--border-soft)]">
            <MessageCircle className="w-5 h-5" />
          </motion.div>
        </div>

        <h2 className="text-4xl md:text-5xl font-bold text-brand-text tracking-tight relative inline-block">
          Community Finance Wall
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ delay: 0.5, duration: 1 }}
            className="absolute -bottom-2 left-0 h-1 bg-gradient-to-r from-brand-primary/50 to-transparent rounded-full"
          />
        </h2>
        <p className="text-brand-text/60 text-lg max-w-lg mx-auto flex items-center justify-center gap-2">
          <span>Join thinkers, learners, and builders.</span>
        </p>

        {/* FILTERS BAR */}
        <FiltersBar
          search={search}
          onSearchChange={setSearch}
          category={category}
          onCategoryChange={setCategory}
          sort={sort}
          onSortChange={setSort}
        />
      </motion.div>

      {/* FEED CONTAINER */}
      <div className="relative z-10 max-w-3xl mx-auto space-y-8 px-4">
        <AnimatePresence>
          {React.useMemo(() => blogs.map((blog, index) => {
            const isLiked = blog.likedBy?.includes(user?.id ?? "")
            {/* Divider logic */ }
            const showDivider = index > 0 && index % 3 === 0;

            return (
              <React.Fragment key={`${blog._id}-${index}`}>
                {showDivider && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    className="flex items-center gap-4 py-4"
                  >
                    <div className="h-px bg-gradient-to-r from-transparent via-brand-text/10 to-transparent flex-1" />
                    <span className="text-xs font-bold text-[var(--text-secondary)] opacity-40 uppercase tracking-widest bg-[var(--black-surface)]/50 px-3 py-1 rounded-full backdrop-blur-sm">
                      Finance is better shared
                    </span>
                    <div className="h-px bg-gradient-to-r from-transparent via-brand-text/10 to-transparent flex-1" />
                  </motion.div>
                )}

                <PostCard
                  blog={blog}
                  onLike={handleLike}
                  isLiked={!!isLiked}
                  isLiking={likingId === blog._id}
                  onImageClick={(images, index) => setLightbox({
                    isOpen: true,
                    images,
                    initialIndex: index
                  })}
                  canDelete={isAdmin}
                  onDelete={isAdmin ? handleDelete : undefined}
                />
              </React.Fragment>
            )
          }), [blogs, user?.id, isAdmin, handleLike, handleDelete, likingId])}
        </AnimatePresence>

        {/* 3. EMPTY STATE - SOCIAL INVITATION */}
        {blogs.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-24 px-6 relative"
          >
            {/* Fake Card Stack */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-40 bg-[var(--black-surface)]/40 rounded-[2rem] shadow-xl rotate-3 opacity-40 blur-sm pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-40 bg-[var(--black-surface)] rounded-[2rem] shadow-lg -rotate-3 opacity-60 blur-sm pointer-events-none" />

            <div className="relative z-10 space-y-6">
              <div className="relative inline-block">
                <div className="w-20 h-20 bg-gradient-to-br from-brand-primary/20 to-orange-100 rounded-full flex items-center justify-center mb-4 mx-auto animate-pulse">
                  <PenTool className="w-8 h-8 text-brand-primary" />
                </div>
                {/* Floating Reactions */}
                <div className="absolute -top-2 -right-4 bg-[var(--black-elevated)] border border-[var(--border-soft)] p-1.5 rounded-full shadow-md animate-bounce delay-700"><Heart className="w-4 h-4 text-red-500 fill-red-500" /></div>
                <div className="absolute -bottom-1 -left-4 bg-[var(--black-elevated)] border border-[var(--border-soft)] p-1.5 rounded-full shadow-md animate-bounce delay-1000"><MessageSquare className="w-4 h-4 text-blue-500 fill-blue-500" /></div>
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-brand-text">The community is warming up</h3>
                <p className="text-brand-text/60 max-w-sm mx-auto">Be the first to share an idea and spark the conversation. Your voice matters here.</p>
              </div>

              <div className="flex gap-4 justify-center pt-2">
                <Button
                  size="lg"
                  onClick={handleWriteClick}
                  className="rounded-full shadow-xl shadow-brand-primary/20 text-white font-bold px-8 bg-brand-primary hover:bg-brand-primary/90"
                >
                  Write your first idea
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setShowTutorial(true)}
                  className="rounded-full border-brand-text/10 hover:bg-white/50"
                >
                  Explore how it works
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* 4. FLOATING ELEMENTS */}
      {/* Sticky FAB */}
      <motion.button
        initial={{ scale: 0, rotate: 180 }}
        animate={{ scale: 1, rotate: 0 }}
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleWriteClick}
        className="fixed bottom-28 right-6 z-40 bg-brand-text text-[var(--bg-primary)] p-4 rounded-full shadow-2xl shadow-brand-text/40 hover:bg-black hover:text-white transition-colors"
        aria-label="Write new blog"
      >
        <PenTool className="w-6 h-6" />
      </motion.button>


      {/* Lightbox Modal */}
      <BlogLightbox
        isOpen={lightbox.isOpen}
        images={lightbox.images}
        initialIndex={lightbox.initialIndex}
        onClose={() => setLightbox(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  )
}
