"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Heart, MessageSquare, Share2, User, BookOpen, Loader2, Send, X, Layers, ChevronDown, ChevronUp, Trash2 } from "lucide-react"
import { apiClient, getBlogCoverImageUrl, getBlogImageUrl, type Blog, type Comment } from "@/lib/api-client"
import { extractImagesFromContent } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import Link from "next/link"

interface PostCardProps {
    blog: Blog
    onLike: (blog: Blog) => void
    isLiked: boolean
    isLiking: boolean
    onImageClick: (images: string[], index: number) => void
    /** When true, show delete button (e.g. for admin or author). Call onDelete when user confirms. */
    canDelete?: boolean
    onDelete?: (blog: Blog) => void
}

export function PostCard({ blog, onLike, isLiked, isLiking, onImageClick, canDelete, onDelete }: PostCardProps) {
    const { user } = useAuth()
    const [showComments, setShowComments] = React.useState(false)
    const [comments, setComments] = React.useState<Comment[]>([])
    const [totalCount, setTotalCount] = React.useState(blog.commentsCount ?? 0)
    const [loadingComments, setLoadingComments] = React.useState(false)
    const [commentInput, setCommentInput] = React.useState("")
    const [sendingComment, setSendingComment] = React.useState(false)
    const [isExpanded, setIsExpanded] = React.useState(false)

    // --- Read more / Show less: full content is NEVER mutated. Preview is derived only for display. ---
    const MAX_LENGTH = 300
    const fullContent = blog.content ? blog.content.replace(/<[^>]*>/g, " ").trim() : (blog.excerpt || "")
    const isLong = fullContent.length > MAX_LENGTH
    const displayContent = isExpanded ? fullContent : fullContent.slice(0, MAX_LENGTH)



    // Memoize image extraction to avoid re-parsing on every render
    const allImages = React.useMemo(() => {
        const extracted = extractImagesFromContent(blog.content || "")
        const cover = getBlogCoverImageUrl(blog.coverImageUrl, blog.imageUrl)

        let images: string[] = []
        if (cover) images.push(cover)

        // Add blog.images (uploaded via new uploader; may be string or { url })
        if (blog.images && blog.images.length > 0) {
            blog.images.forEach(img => {
                const resolved = getBlogImageUrl(img)
                if (resolved && !images.includes(resolved)) images.push(resolved)
            })
        }

        // Add extracted images, avoiding duplicates
        extracted.forEach(img => {
            if (!images.includes(img) && img !== cover) {
                images.push(img)
            }
        })
        return images
    }, [blog.content, blog.coverImageUrl, blog.imageUrl, blog.images])

    const displayImage = allImages[0]
    const extraImagesCount = Math.max(0, allImages.length - 1)

    const loadComments = async () => {
        if (showComments) {
            setShowComments(false)
            return
        }
        setShowComments(true)
        if (comments.length > 0) return // Already loaded

        setLoadingComments(true)
        try {
            const { comments: data, totalCount: count } = await apiClient.getComments(blog._id)
            setComments(data)
            setTotalCount(count)
        } catch (e) {
            console.error(e)
            toast.error("Failed to load comments")
        } finally {
            setLoadingComments(false)
        }
    }

    const handleSendComment = async () => {
        if (!commentInput.trim()) return
        setSendingComment(true)
        try {
            const { comment: newComment, totalCount } = await apiClient.addComment(blog._id, commentInput)

            // Patch author if missing (sometimes backend might return just ID or partial data)
            const commentWithAuthor = {
                ...newComment,
                author: {
                    name: newComment.author?.name || user?.name || "Guest",
                }
            }

            setComments(prev => [commentWithAuthor, ...prev])
            setTotalCount(totalCount)
            setCommentInput("")
            toast.success("Comment added")
        } catch (e) {
            console.error(e)
            toast.error("Failed to post comment")
        } finally {
            setSendingComment(false)
        }
    }

    const handleShare = (e?: React.MouseEvent) => {
        e?.stopPropagation()
        const url = `${window.location.origin}/blog/${blog._id}`
        navigator.clipboard.writeText(url)
        toast.success("Link copied", { description: "Anyone can read this post" })
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="group bg-[var(--bg-surface)] backdrop-blur-md border border-[var(--border-soft)] rounded-[1.5rem] shadow-sm hover:shadow-[0_4px_20px_rgba(34,211,238,0.1)] hover:border-[var(--neon-cyan)]/30 transition-[border-color,box-shadow] duration-300 overflow-hidden flex flex-col isolate-layer"
        >
            {/* CONTENT SECTION */}
            <div className="p-6 md:p-8 pb-4 flex flex-col relative">

                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[var(--neon-cyan)]/10 flex items-center justify-center text-[var(--neon-cyan)] font-bold shadow-[0_0_10px_rgba(34,211,238,0.2)] border border-[var(--neon-cyan)]/20 shrink-0">
                            {blog.author?.name?.charAt(0).toUpperCase() ?? <User className="w-5 h-5" />}
                        </div>
                        <div className="min-w-0">
                            <div className="font-bold text-[var(--text-primary)] text-sm truncate">{blog.author?.name ?? "Community Member"}</div>
                            <div className="text-xs text-[var(--text-secondary)] opacity-60 font-medium flex items-center gap-1.5">
                                {blog.createdAt
                                    ? new Date(blog.createdAt).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                    })
                                    : "Recently"}
                            </div>
                        </div>
                    </div>

                    {/* Badges Logic */}
                    <div className="flex gap-2 shrink-0">
                        {/* Trending Badge */}
                        {(blog.likes ?? 0) > 5 && (
                            <span className="shrink-0 px-2 py-1 bg-orange-100/80 text-orange-600 text-[10px] font-bold uppercase tracking-widest rounded-full flex items-center gap-1">
                                <span className="text-orange-500 text-xs">🔥</span> Trending
                            </span>
                        )}

                        {/* New Badge (Logic: <24h old) */}
                        {new Date(blog.createdAt).getTime() > Date.now() - 86400000 && (
                            <span className="shrink-0 px-2 py-1 bg-blue-100/80 text-blue-600 text-[10px] font-bold uppercase tracking-widest rounded-full flex items-center gap-1">
                                New
                            </span>
                        )}

                        <span className="shrink-0 px-3 py-1 bg-brand-primary/5 text-brand-primary text-[10px] font-bold uppercase tracking-widest rounded-full">
                            {blog.category ?? "Finance"}
                        </span>
                    </div>
                </div>

                {/* Main Content */}
                <div className="mb-4">
                    <Link href={`/blog/${blog._id}`} className="group-hover:text-brand-primary transition-colors">
                        <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-3 leading-tight transition-colors cursor-pointer line-clamp-2">
                            {blog.title}
                        </h3>
                    </Link>

                    <div className="relative">
                        <div
                            className="font-content text-[var(--text-secondary)] leading-relaxed overflow-hidden whitespace-pre-wrap"
                        >
                            {displayContent}
                            {!isExpanded && isLong ? "…" : null}
                        </div>

                        {isLong && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setIsExpanded((prev) => !prev)
                                }}
                                className="mt-1 text-sm font-bold text-brand-primary flex items-center gap-1 hover:underline focus:outline-none"
                            >
                                {isExpanded ? (
                                    <>Show less <ChevronUp className="w-3 h-3" /></>
                                ) : (
                                    <>Read more <ChevronDown className="w-3 h-3" /></>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* IMAGE SECTION (Full Width - 16:9) */}
            {displayImage ? (
                <div
                    className="w-full aspect-video bg-[var(--black-elevated)] relative cursor-zoom-in group/image border-y border-[var(--border-soft)] overflow-hidden"
                    onClick={(e) => {
                        e.stopPropagation()
                        onImageClick(allImages, 0)
                    }}
                >
                    {/* Loading State */}
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse -z-10">
                        <Loader2 className="w-8 h-8 text-gray-300 animate-spin" />
                    </div>

                    <img
                        src={displayImage}
                        alt={blog.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover/image:scale-105"
                        loading="lazy"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none'; // Hide broken image or replace
                            // e.currentTarget.src = "/fallback-image.png"; // Optional fallback
                        }}
                    />

                    {/* Multi-Image Badge */}
                    {extraImagesCount > 0 && (
                        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 border border-white/10 z-10 transition-transform group-hover/image:scale-110">
                            <Layers className="w-3 h-3" />
                            <span>+{extraImagesCount} images</span>
                        </div>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover/image:opacity-100 transition-opacity duration-500 pointer-events-none" />
                </div>
            ) : (
                /* Only show partial image container if no images at all? Or hide? 
                   User rule: "No images -> text-only card". 
                   So we render nothing here. */
                null
            )}

            {/* ACTION BAR */}
            <div className="px-6 md:px-8 py-4 flex items-center gap-4 bg-[var(--bg-surface)]/40 border-t border-[var(--border-soft)]">
                <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={(e) => {
                        e.stopPropagation()
                        onLike(blog)
                    }}
                    disabled={isLiking}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all ${isLiked
                        ? "bg-red-500/10 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]"
                        : "bg-transparent text-[var(--text-secondary)] opacity-60 hover:opacity-100 hover:bg-[var(--bg-surface)] hover:text-red-500"
                        }`}
                >
                    {isLiking ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Heart className={`w-5 h-5 ${isLiked ? "text-red-500" : ""}`} fill={isLiked ? "#ef4444" : "none"} />
                    )}
                    <span>{blog.likes ?? 0}</span>
                </motion.button>

                <button
                    onClick={loadComments}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all ${showComments ? "bg-[var(--neon-cyan)]/10 text-[var(--neon-cyan)] shadow-[0_0_10px_rgba(34,211,238,0.3)]" : "text-[var(--text-secondary)] opacity-60 hover:opacity-100 hover:bg-[var(--bg-surface)] hover:text-[var(--neon-cyan)]"}`}>
                    <MessageSquare className="w-5 h-5" />
                    <span>Comments</span>
                </button>

                <button
                    onClick={handleShare}
                    className="ml-auto text-[var(--text-secondary)] opacity-60 hover:opacity-100 transition-colors flex items-center gap-2 px-4 py-2 hover:bg-[var(--bg-surface)] rounded-full font-bold text-sm">
                    <Share2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Share</span>
                </button>

                {canDelete && onDelete && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            if (window.confirm(`Delete "${blog.title}"? This cannot be undone.`)) {
                                onDelete(blog)
                            }
                        }}
                        className="text-red-500/80 hover:text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm"
                        title="Delete post"
                    >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Delete</span>
                    </button>
                )}
            </div>

            {/* Comment Drawer */}
            <AnimatePresence>
                {showComments && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-[var(--bg-surface)]/30 border-t border-[var(--border-soft)]"
                    >
                        <div className="p-6">
                            {/* Input */}
                            <div className="flex gap-4 mb-6">
                                <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary shrink-0">
                                    <User className="w-4 h-4" />
                                </div>
                                <div className="flex-1 flex gap-2">
                                    <Input
                                        placeholder="Add a comment..."
                                        className="bg-transparent border border-[var(--border-soft)] text-[var(--text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--neon-cyan)]/50 focus-visible:border-[var(--neon-cyan)]/50 placeholder:text-[var(--text-disabled)]"
                                        value={commentInput}
                                        onChange={(e) => setCommentInput(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleSendComment()}
                                    />
                                    <Button size="icon" disabled={sendingComment || !commentInput.trim()} onClick={handleSendComment} className="shrink-0 bg-brand-primary hover:bg-brand-primary/90 text-white">
                                        {sendingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    </Button>
                                </div>
                            </div>

                            {/* List */}
                            {loadingComments ? (
                                <div className="flex justify-center py-4">
                                    <Loader2 className="w-6 h-6 animate-spin text-brand-text/20" />
                                </div>
                            ) : comments.length > 0 ? (
                                <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                                    {comments.map((comment, i) => (
                                        <motion.div
                                            key={comment._id || i}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex gap-3 text-sm"
                                        >
                                            <div className="font-bold text-[var(--text-primary)] shrink-0">{comment.author?.name ?? "Guest"}</div>
                                            <div className="font-content text-[var(--text-secondary)] break-all">{comment.content}</div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-4 text-brand-text/30 text-sm">
                                    No comments yet. Be the first to share your thoughts.
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}
