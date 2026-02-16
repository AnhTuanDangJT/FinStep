"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { BookOpen, Calendar, Clock, Heart, Loader2, MessageSquare, Share2, Tag, User, AlertTriangle } from "lucide-react"
import { apiClient, getBlogCoverImageUrl, getBlogImageUrl, type Blog, type Comment } from "@/lib/api-client"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Logo } from "@/components/ui/logo"
import Link from "next/link"
import { BlogLightbox } from "@/components/dashboard/BlogLightbox"
import { ContentBlock } from "@/components/dashboard/ContentBlock"
import { AiSummaryBox } from "@/components/dashboard/AiSummaryBox"
import { BlogContentRenderer } from "@/components/dashboard/BlogContentRenderer"

export default function BlogDetailPage() {
    const { id } = useParams()
    const { user } = useAuth()
    const [blog, setBlog] = React.useState<Blog | null>(null)
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState<string | null>(null)
    const [isLiking, setIsLiking] = React.useState(false)

    // Comment state
    const [comments, setComments] = React.useState<Comment[]>([])
    const [loadingComments, setLoadingComments] = React.useState(false)
    const [commentInput, setCommentInput] = React.useState("")
    const [sendingComment, setSendingComment] = React.useState(false)

    // Lightbox state
    const [lightbox, setLightbox] = React.useState<{ isOpen: boolean; initialIndex: number }>({
        isOpen: false,
        initialIndex: 0
    })

    React.useEffect(() => {
        if (!id) return
        async function load() {
            setLoading(true)
            try {
                const data = await apiClient.getBlogById(id as string)
                setBlog(data)
                // Load comments too
                setLoadingComments(true)
                try {
                    const { comments: coms } = await apiClient.getComments(id as string)
                    setComments(coms)
                } catch { } // ignore comment error
                setLoadingComments(false)
            } catch (e) {
                setError(e instanceof Error ? e.message : "Failed to load blog")
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [id])

    const handleLike = async () => {
        if (!blog || isLiking || !user) return
        const userId = user.id
        const wasLiked = blog.likedBy?.includes(userId)

        // Optimistic
        setBlog(prev => prev ? ({
            ...prev,
            likes: (prev.likes ?? 0) + (wasLiked ? -1 : 1),
            likedBy: wasLiked ? (prev.likedBy || []).filter(u => u !== userId) : [...(prev.likedBy || []), userId]
        }) : null)

        setIsLiking(true)
        try {
            await apiClient.toggleLike(blog._id)
        } catch {
            // Revert
            setBlog(prev => prev ? ({
                ...prev,
                likes: (prev.likes ?? 0) + (wasLiked ? 1 : -1),
                likedBy: wasLiked ? [...(prev.likedBy || []), userId] : (prev.likedBy || []).filter(u => u !== userId)
            }) : null)
        } finally {
            setIsLiking(false)
        }
    }

    const handleShare = () => {
        const url = window.location.href
        navigator.clipboard.writeText(url)
        toast.success("Link copied", { description: "Anyone can read this post" })
    }

    const handleSendComment = async () => {
        if (!user) {
            toast.error("Please log in to comment")
            return
        }
        if (!blog || !commentInput.trim()) return
        setSendingComment(true)
        try {
            const { comment: newComment, totalCount } = await apiClient.addComment(blog._id, commentInput)
            setComments(prev => [newComment, ...prev])
            setCommentInput("")
            setBlog(prev => prev ? ({ ...prev, commentsCount: totalCount }) : null)
            toast.success("Comment added")
        } catch (e) {
            toast.error("Failed to post comment")
        } finally {
            setSendingComment(false)
        }
    }


    const isLiked = blog?.likedBy?.includes(user?.id ?? "") ?? false

    // Track which images failed to load so we show placeholder instead of broken icon
    const [imageLoadFailed, setImageLoadFailed] = React.useState<Record<number, boolean>>({})

    // Prepare images for gallery/lightbox
    const allImages = React.useMemo(() => {
        if (!blog) return []
        const imgs: string[] = []

        const cover = getBlogCoverImageUrl(blog.coverImageUrl, blog.imageUrl)
        if (cover) imgs.push(cover)

        if (blog.images && blog.images.length > 0) {
            blog.images.forEach(img => {
                const resolved = getBlogImageUrl(img)
                if (resolved && !imgs.includes(resolved)) imgs.push(resolved)
            })
        }
        return imgs
    }, [blog])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
                <Loader2 className="w-10 h-10 animate-spin text-brand-primary" />
            </div>
        )
    }

    if (error || !blog) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-primary)] p-4 text-center">
                <div className="bg-red-50 p-6 rounded-full mb-4">
                    <BookOpen className="w-12 h-12 text-red-500" />
                </div>
                <h1 className="text-2xl font-bold text-brand-text mb-2">Blog Not Found</h1>
                <p className="text-brand-text/60 mb-8">{error || "This blog post may have been removed or does not exist."}</p>
                <Button onClick={() => window.history.back()}>Go Back</Button>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] pb-20 pt-6">
            <BlogLightbox
                isOpen={lightbox.isOpen}
                onClose={() => setLightbox(prev => ({ ...prev, isOpen: false }))}
                images={allImages}
                initialIndex={lightbox.initialIndex}
            />

            {/* Main Container */}
            <div className="container mx-auto max-w-7xl px-4 md:px-6">

                {/* Top Bar */}
                <div className="flex items-center justify-between mb-8">
                    <Button variant="ghost" className="gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]" asChild>
                        <Link href="/dashboard?view=readBlogs">
                            <BookOpen className="w-4 h-4" />
                            <span>Back to Feed</span>
                        </Link>
                    </Button>
                    <Logo className="scale-75 origin-right" />
                </div>

                {/* Article Header */}
                <div className="mb-10 text-center md:text-left">
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-6">
                        {blog.category && (
                            <span className="bg-[var(--brand-primary)] text-black px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">{blog.category}</span>
                        )}
                        <span className="flex items-center gap-2 text-[var(--text-secondary)] text-sm">
                            <Calendar className="w-4 h-4" />
                            {new Date(blog.createdAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-2 text-[var(--text-secondary)] text-sm">
                            <Clock className="w-4 h-4" />
                            5 min read
                        </span>
                    </div>

                    <h1 className="text-3xl md:text-5xl font-bold text-[var(--text-primary)] leading-tight mb-8">
                        {blog.title}
                    </h1>

                    <div className="flex items-center justify-center md:justify-start gap-4 pb-8 border-b border-[var(--border-soft)]">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-[var(--bg-surface)] border border-[var(--border-soft)] flex items-center justify-center font-bold text-[var(--brand-primary)] shadow-sm">
                                {blog.author?.name?.charAt(0).toUpperCase() ?? <User className="w-6 h-6" />}
                            </div>
                            <div className="text-left">
                                <div className="font-bold text-[var(--text-primary)]">{blog.author?.name ?? "Unknown Author"}</div>
                                <div className="text-xs text-[var(--text-secondary)]">Author</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Featured Image Section */}
                <div className="mb-12">
                    {allImages.length > 0 ? (
                        <div className="space-y-4">
                            {/* Main Cover */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="w-full aspect-video md:aspect-[21/9] rounded-3xl overflow-hidden shadow-2xl border border-[var(--border-soft)] bg-[var(--bg-surface)] cursor-pointer group pointer-events-auto"
                                onClick={() => setLightbox({ isOpen: true, initialIndex: 0 })}
                            >
                                {imageLoadFailed[0] ? (
                                    <div className="w-full h-full flex items-center justify-center bg-[var(--bg-elevated)]">
                                        <BookOpen className="w-16 h-16 text-[var(--text-secondary)]/30" />
                                    </div>
                                ) : (
                                    <img
                                        src={allImages[0]}
                                        alt={blog.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                        onError={() => setImageLoadFailed((prev) => ({ ...prev, 0: true }))}
                                    />
                                )}
                            </motion.div>

                            {/* Thumbnails (Only if more than 1 image) */}
                            {allImages.length > 1 && (
                                <div className="grid grid-cols-4 md:grid-cols-6 gap-2 md:gap-4">
                                    {allImages.slice(1, 7).map((img, idx) => (
                                        <div
                                            key={idx}
                                            className="aspect-square rounded-xl overflow-hidden border border-[var(--border-soft)] cursor-pointer hover:opacity-80 transition-opacity bg-[var(--bg-surface)] relative"
                                            onClick={() => setLightbox({ isOpen: true, initialIndex: idx + 1 })}
                                        >
                                            {imageLoadFailed[idx + 1] ? (
                                                <div className="w-full h-full flex items-center justify-center bg-[var(--bg-elevated)]">
                                                    <BookOpen className="w-8 h-8 text-[var(--text-secondary)]/30" />
                                                </div>
                                            ) : (
                                                <img
                                                    src={img}
                                                    className="w-full h-full object-cover"
                                                    alt={`Gallery ${idx}`}
                                                    onError={() => setImageLoadFailed((prev) => ({ ...prev, [idx + 1]: true }))}
                                                />
                                            )}
                                            {idx === 5 && allImages.length > 7 && (
                                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-sm">
                                                    +{allImages.length - 7}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="w-full aspect-[3/1] rounded-3xl bg-gradient-to-br from-[var(--bg-surface)] to-[var(--bg-elevated)] border border-[var(--border-soft)] flex items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(var(--text-primary) 1px, transparent 0)", backgroundSize: "24px 24px" }}></div>
                            <BookOpen className="w-24 h-24 text-[var(--text-secondary)]/20" />
                        </div>
                    )}
                </div>

                {/* Content Grid */}
                <div className="grid lg:grid-cols-[1fr_350px] gap-12">

                    {/* Main Content Column */}
                    <div>
                        {blog.status === "REJECTED" && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 mb-8">
                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-red-500/20 rounded-full shrink-0">
                                        <AlertTriangle className="w-6 h-6 text-red-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-red-500 mb-1">Reason for Rejection</h3>
                                        <p className="text-[var(--text-secondary)] leading-relaxed">
                                            {blog.rejectionReason || "This post was rejected. Please contact admin for details."}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* AI Summary Box - use aiSummary (bullet points) or fallback to excerpt */}
                        <AiSummaryBox
                            summaryPoints={
                                blog.aiSummary
                                    ? blog.aiSummary
                                            .split(/\n+/)
                                            .map((s) => s.replace(/^[-*•]\s*/, "").trim())
                                            .filter(Boolean)
                                    : blog.excerpt
                                        ? [blog.excerpt]
                                        : undefined
                            }
                        />

                        {/* Smart Content Renderer */}
                        <div className="prose dark:prose-invert max-w-none">
                            <BlogContentRenderer content={blog.content || ""} />
                        </div>

                        {/* Engagement Bar */}
                        <div className="flex items-center gap-4 py-8 mt-12 border-t border-[var(--border-soft)]">
                            <Button
                                variant={isLiked ? "default" : "outline"}
                                onClick={() => {
                                    if (!user) {
                                        toast.error("Login Required", { description: "Create an account to join the discussion" })
                                        return
                                    }
                                    handleLike()
                                }}
                                className={`rounded-full h-12 px-6 gap-2 transition-all ${isLiked ? "bg-red-500/10 hover:bg-red-500/20 text-red-500 border-red-500/30 shadow-lg shadow-red-500/10" : "hover:text-red-500 hover:border-red-500/50 bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-soft)]"}`}
                            >
                                <Heart className="w-5 h-5" fill={isLiked ? "#ef4444" : "none"} />
                                <span className="font-bold">{blog.likes ?? 0} Likes</span>
                            </Button>

                            <Button variant="outline" className="rounded-full h-12 px-6 gap-2 bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-soft)] hover:bg-[var(--bg-elevated)]">
                                <MessageSquare className="w-5 h-5" />
                                <span className="font-bold">Comments</span>
                            </Button>

                            <Button variant="ghost" size="icon" onClick={handleShare} className="rounded-full h-12 w-12 ml-auto hover:bg-[var(--brand-primary)]/10 hover:text-[var(--brand-primary)] text-[var(--text-secondary)]">
                                <Share2 className="w-5 h-5" />
                            </Button>
                        </div>

                        {/* Comments Section */}
                        <div className="mt-12">
                            <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-8 flex items-center gap-3">
                                <MessageSquare className="w-6 h-6 text-[var(--brand-primary)]" />
                                Discussion
                            </h3>

                            {/* Comment Input */}
                            <div className="bg-[var(--bg-surface)] rounded-2xl p-6 border border-[var(--border-soft)] flex gap-4 mb-8 shadow-sm">
                                <div className="w-10 h-10 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center font-bold text-[var(--text-secondary)] shrink-0 border border-[var(--border-soft)]">
                                    {user?.name?.charAt(0) ?? "?"}
                                </div>
                                <div className="flex-1 space-y-4">
                                    {user ? (
                                        <>
                                            <Input
                                                placeholder="Share your thoughts..."
                                                className="bg-transparent border border-[var(--border-soft)] focus-visible:ring-1 focus-visible:ring-[var(--brand-primary)] text-[var(--text-primary)] min-h-[50px] placeholder:text-[var(--text-secondary)]"
                                                value={commentInput}
                                                onChange={(e) => setCommentInput(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
                                            />
                                            <div className="flex justify-end">
                                                <Button
                                                    size="sm"
                                                    onClick={handleSendComment}
                                                    disabled={sendingComment || !commentInput.trim()}
                                                    className="bg-[var(--brand-primary)] text-black font-bold rounded-full px-6 hover:opacity-90 transition-opacity"
                                                >
                                                    {sendingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : "Post Comment"}
                                                </Button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="bg-[var(--bg-elevated)] rounded-xl p-6 text-center space-y-4 border border-[var(--border-soft)]">
                                            <p className="text-[var(--text-secondary)]">Join the conversation by logging in.</p>
                                            <div className="flex justify-center gap-3">
                                                <Link href="/login">
                                                    <Button variant="outline" size="sm" className="rounded-full border-[var(--border-soft)] text-[var(--text-primary)] hover:bg-[var(--bg-surface)]">Log In</Button>
                                                </Link>
                                                <Link href="/register">
                                                    <Button size="sm" className="rounded-full bg-[var(--brand-primary)] text-black font-bold hover:opacity-90">Sign Up</Button>
                                                </Link>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Comment List */}
                            <div className="space-y-6">
                                {comments.map((comment, index) => (
                                    <div key={comment._id ?? comment.id ?? `comment-${index}`} className="group">
                                        <div className="flex gap-4">
                                            <div className="w-10 h-10 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center font-bold text-[var(--text-secondary)] shrink-0 border border-[var(--border-soft)]">
                                                {comment.author?.name?.charAt(0) ?? "?"}
                                            </div>
                                            <div className="flex-1">
                                                <div className="bg-[var(--bg-surface)] p-5 rounded-2xl rounded-tl-none border border-[var(--border-soft)] hover:border-[var(--brand-primary)]/30 transition-colors">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="font-bold text-[var(--text-primary)]">{comment.author?.name}</span>
                                                        <span className="text-xs text-[var(--text-secondary)]">{new Date(comment.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                    <p className="font-content text-[var(--text-secondary)] leading-relaxed">{comment.content}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {comments.length === 0 && (
                                    <div className="text-center py-12 text-[var(--text-secondary)] italic">
                                        No comments yet. Be the first to share your thoughts!
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Author Card */}
                        <div className="sticky top-24 space-y-6">
                            <div className="bg-[var(--bg-surface)] p-6 rounded-3xl border border-[var(--border-soft)] shadow-sm">
                                <h4 className="font-bold text-[var(--text-primary)] mb-6 text-sm uppercase tracking-wider text-center">About the Author</h4>
                                <div className="flex flex-col items-center text-center">
                                    <div className="w-24 h-24 rounded-full bg-[#0f172a] flex items-center justify-center border border-slate-800 mb-4 shadow-inner">
                                        <User className="w-12 h-12 text-slate-400" />
                                    </div>
                                    <div className="font-bold text-xl text-[var(--text-primary)] mb-1">{blog.author?.name}</div>
                                    <div className="text-sm text-[var(--text-secondary)] mb-6">Valued Contributor</div>
                                    <Link href={`/profile/${blog.author?.userId || ''}`} className="w-full">
                                        <Button variant="outline" className="w-full rounded-full border-[var(--border-soft)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--brand-primary)] transition-colors">
                                            View Profile
                                        </Button>
                                    </Link>
                                </div>
                            </div>

                            {/* Tags Card */}
                            {blog.tags && blog.tags.length > 0 && (
                                <div className="bg-[var(--bg-surface)] p-6 rounded-3xl border border-[var(--border-soft)] shadow-sm">
                                    <h4 className="font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                                        <Tag className="w-4 h-4 text-[var(--brand-primary)]" /> Related Topics
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {blog.tags.map(tag => (
                                            <span key={tag} className="text-xs bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated)]/80 text-[var(--text-secondary)] px-3 py-1.5 rounded-full transition-colors cursor-pointer border border-[var(--border-soft)] hover:border-[var(--brand-primary)]/50">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Share Card (Optional) */}
                            <div className="bg-gradient-to-br from-[var(--brand-primary)]/10 to-transparent p-6 rounded-3xl border border-[var(--brand-primary)]/20">
                                <h4 className="font-bold text-[var(--text-primary)] mb-2">Share this insight</h4>
                                <p className="text-sm text-[var(--text-secondary)] mb-4">Help spread financial literacy.</p>
                                <Button onClick={handleShare} className="w-full bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-soft)] hover:bg-[var(--bg-elevated)] rounded-full gap-2">
                                    <Share2 className="w-4 h-4" /> Copy Link
                                </Button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div >
    )
}
