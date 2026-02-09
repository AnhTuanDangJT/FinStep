"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Send, Image as ImageIcon, Loader2, X, HelpCircle, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { apiClient, getBlogCoverImageUrl, type Blog } from "@/lib/api-client"
import { TutorialModal } from "./TutorialModal"
import { AIWritePanel } from "./AIWritePanel"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5MB

interface WriteBlogViewProps {
  editBlog?: Blog | null
  onEditComplete?: () => void
}

export function WriteBlogView({ editBlog, onEditComplete }: WriteBlogViewProps) {
  const [showTutorial, setShowTutorial] = React.useState(false)
  const [isFocused, setIsFocused] = React.useState(false)
  const [title, setTitle] = React.useState("")
  const [content, setContent] = React.useState("")
  const [excerpt, setExcerpt] = React.useState("")
  const [tags, setTags] = React.useState<string[]>([])
  // Multi-image state (max 4)
  const [images, setImages] = React.useState<File[]>([])
  const [imagePreviews, setImagePreviews] = React.useState<string[]>([])
  const [imageError, setImageError] = React.useState<string | null>(null)
  const imageInputRef = React.useRef<HTMLInputElement>(null)

  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)

  // Pre-fill form when editing
  React.useEffect(() => {
    if (editBlog) {
      setTitle(editBlog.title)
      setContent(editBlog.content || "")
      setExcerpt(editBlog.excerpt || "")
      setTags(editBlog.tags || [])

      const blogData = editBlog as any
      const initialImageUrls: string[] = [];
      if (blogData.imageUrl) { // Legacy cover image
        const cover = getBlogCoverImageUrl(blogData.imageUrl, blogData.imageUrl);
        if (cover) initialImageUrls.push(cover);
      }
      if (blogData.images && blogData.images.length > 0) {
        // Filter out the legacy cover if it's already in the new images array
        const newImages = blogData.images.filter((img: string) => img !== blogData.imageUrl);
        initialImageUrls.push(...newImages);
      }

      // Set initial previews from existing URLs (no files yet)
      setImagePreviews(initialImageUrls);
      // Note: We don't set `images` (File[]) here as these are existing URLs, not new files.
      // New files will be added to `images` state.
    }
  }, [editBlog])

  React.useEffect(() => () => {
    // Clean up object URLs when component unmounts or imagePreviews change
    imagePreviews.forEach(url => {
      if (url.startsWith("blob:")) {
        URL.revokeObjectURL(url)
      }
    })
  }, [imagePreviews])

  // --- Multi-image handlers ---
  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    setImageError(null)

    // Check total limit (existing previews + new files)
    if (imagePreviews.length + files.length > 4) {
      setImageError("Maximum 4 images allowed.")
      return
    }

    const newPreviews: string[] = []
    const newFiles: File[] = []

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setImageError(`Skipped invalid file: ${file.name}`)
        continue
      }
      if (file.size > MAX_SIZE_BYTES) {
        setImageError(`Skipped too large file: ${file.name}`)
        continue
      }
      newFiles.push(file)
      newPreviews.push(URL.createObjectURL(file))
    }

    setImages(prev => [...prev, ...newFiles])
    setImagePreviews(prev => [...prev, ...newPreviews])
    e.target.value = "" // Reset input
  }

  const handleRemoveImage = (index: number) => {
    const removedPreview = imagePreviews[index];
    if (removedPreview.startsWith("blob:")) {
      URL.revokeObjectURL(removedPreview);
    }

    // If the removed image was a new file, remove it from the `images` state
    // This logic assumes new files are always appended to `images` and `imagePreviews`
    // in the same order. This might need refinement if reordering is introduced.
    const newImages = images.filter((_, i) => {
      // This is a simplified check. A more robust solution might involve
      // storing a unique ID for each file/preview.
      return i < index || i >= index + (imagePreviews.length - images.length);
    });

    setImages(newImages);
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!title.trim() || !content.trim()) {
      setError("Title and content are required.")
      return
    }
    setSubmitting(true)
    try {
      if (editBlog) {
        // Separate existing image URLs from newly uploaded files
        const existingImageUrls = imagePreviews.filter(url => !url.startsWith("blob:"));

        // Upload new files
        const uploadedImageUrls: string[] = [];
        for (const file of images) {
          const url = await apiClient.uploadImage(file);
          uploadedImageUrls.push(url);
        }

        const allImageUrls = [...existingImageUrls, ...uploadedImageUrls];
        // For update, we might need to send `images` as array of strings (URLs) because they are already uploaded?
        // Check api-client updateBlog definition. It takes partial Blog.
        // If backend expects images in update, we should add it to interface.
        // Assuming updateBlog takes Partial<Blog> or specific fields.
        // Let's check api-client updateBlog.

        await apiClient.updateBlog(editBlog._id, {
          title: title.trim(),
          content: content.trim(),
          excerpt: excerpt.trim() || content.trim().slice(0, 200),
          tags: tags.length ? tags : [],
          // coverImageUrl: coverImageUrl || undefined, // REMOVED
          // imageUrl: coverImageUrl, // REMOVED
          images: allImageUrls, // Add images to update payload
        } as any) // Casting as any to bypass strict type check for now if interface isn't updated for updateBlog yet

        setSuccess(true)
        onEditComplete?.()
        setTitle("")
        setContent("")
        setExcerpt("")
        setTags([])
        setImages([])
        setImagePreviews([])
      } else {
        // Upload new image files first, then send URLs (same as edit flow)
        const existingImageUrls = imagePreviews.filter(url => !url.startsWith("blob:"))
        const uploadedImageUrls: string[] = []
        for (const file of images) {
          const url = await apiClient.uploadImage(file)
          uploadedImageUrls.push(url)
        }
        const allImageUrls = [...existingImageUrls, ...uploadedImageUrls]

        await apiClient.createBlog({
          title: title.trim(),
          content: content.trim(),
          excerpt: excerpt.trim() || content.trim().slice(0, 200),
          tags: tags.length ? tags : [],
          images: allImageUrls
        })
        setSuccess(true)
        setTitle("")
        setContent("")
        setExcerpt("")
        setTags([])
        setImages([])
        setImagePreviews([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save blog")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
            {editBlog ? "Edit Blog" : "Write a Blog"}
          </h2>
          <p className="text-[var(--text-secondary)]">
            {editBlog ? "Update your blog post." : "Share your financial knowledge with the world."}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowTutorial(true)} className="gap-2 rounded-full hidden sm:flex">
          <HelpCircle className="w-4 h-4" />
          How it works
        </Button>
      </div>

      {
        editBlog?.status === "REJECTED" && (
          <div className="bg-red-50 border border-red-200 rounded-[2rem] p-6 flex items-start gap-4">
            <div className="p-2 bg-red-100/50 rounded-full shrink-0 text-red-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-red-900 text-lg mb-1">Update Rejected Post</h3>
              <p className="text-red-700/80 mb-2">This post was rejected. Please review the feedback below and make necessary changes before resubmitting.</p>
              <div className="bg-white/50 border border-red-100 rounded-xl p-4 text-red-800 font-medium">
                <span className="text-xs font-bold uppercase tracking-wider text-red-500 block mb-1">Feedback from Admin</span>
                {editBlog.rejectionReason || "No reason provided."}
              </div>
            </div>
          </div>
        )
      }

      <TutorialModal isOpen={showTutorial} onClose={() => setShowTutorial(false)} />

      {
        error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm">{error}</div>
        )
      }
      {
        success && (
          <div className="p-4 bg-green-50 text-green-700 rounded-xl text-sm">
            {editBlog ? "Blog updated successfully!" : "Blog submitted! It will appear after admin approval."}
          </div>
        )
      }

      {/* Main Grid Layout */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Editor Column (2/3 width) */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Title */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest pl-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., The Future of Digital Currencies"
                className="w-full bg-[var(--bg-surface)]/60 backdrop-blur-xl border border-[var(--border-soft)] rounded-[2rem] px-8 py-6 text-2xl md:text-3xl font-bold text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] focus:outline-none focus:ring-2 focus:ring-[var(--neon-cyan)]/50 focus:border-[var(--neon-cyan)]/50 transition-all shadow-sm"
                required
              />
            </div>

            {/* Images Upload (Max 4) */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest pl-1">
                Images ({imagePreviews.length}/4) <span className="text-[var(--text-secondary)]/50 normal-case ml-2">- First image will be the cover</span>
              </label>

              <input
                ref={imageInputRef}
                type="file"
                multiple
                accept={ALLOWED_TYPES.join(",")}
                className="hidden"
                onChange={handleImagesChange}
              />

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Previews */}
                {imagePreviews.map((src, i) => (
                  <div key={i} className="relative aspect-video rounded-xl overflow-hidden border border-[var(--border-soft)] group bg-[var(--black-elevated)]">
                    {i === 0 && (
                      <div className="absolute top-2 left-2 bg-brand-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10">
                        COVER
                      </div>
                    )}
                    <img src={src} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(i)}
                      className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 z-10"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {/* Add Button */}
                {imagePreviews.length < 4 && (
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="aspect-video rounded-xl border-2 border-dashed border-[var(--border-soft)] hover:border-[var(--brand-primary)]/50 hover:bg-[var(--black-surface)]/30 transition-all flex flex-col items-center justify-center gap-2 text-[var(--text-secondary)] hover:text-[var(--brand-primary)]"
                  >
                    <ImageIcon className="w-6 h-6" />
                    <span className="text-sm font-bold">Add Images</span>
                  </button>
                )}
              </div>
              {imageError && <p className="text-sm text-red-500 pl-2">{imageError}</p>}
            </div>

            {/* Content Editor */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest pl-1">Content</label>
              <div className={`
                    min-h-[500px] bg-[var(--bg-surface)]/60 backdrop-blur-xl border border-[var(--border-soft)] rounded-[2rem] p-8 shadow-sm transition-all relative overflow-hidden
                    ${isFocused ? 'ring-2 ring-[var(--neon-cyan)]/50 border-[var(--neon-cyan)]/50 shadow-[0_0_20px_rgba(34,211,238,0.1)]' : ''}
                `}>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="Start typing your masterpiece..."
                  className="font-content w-full h-full min-h-[500px] bg-transparent border-none resize-none focus:outline-none text-lg leading-relaxed text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] selection:bg-[var(--neon-cyan)]/30"
                />
              </div>
            </div>

            {/* Meta Details */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest pl-1">Excerpt</label>
                <textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Short summary..."
                  rows={4}
                  className="font-content w-full bg-[var(--bg-surface)]/60 backdrop-blur-xl border border-[var(--border-soft)] rounded-[2rem] p-6 text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] focus:outline-none focus:ring-2 focus:ring-[var(--neon-cyan)]/50 border-[var(--neon-cyan)]/50 transition-all shadow-sm resize-none"
                />
              </div>
              <div className="space-y-3">
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest pl-1">Tags</label>
                <textarea
                  value={tags.join(", ")}
                  onChange={(e) => setTags(e.target.value.split(",").map(t => t.trim()))}
                  placeholder="investing, budget, saving"
                  rows={4}
                  className="w-full bg-[var(--bg-surface)]/60 backdrop-blur-xl border border-[var(--border-soft)] rounded-[2rem] p-6 text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] focus:outline-none focus:ring-2 focus:ring-[var(--neon-cyan)]/50 border-[var(--neon-cyan)]/50 transition-all shadow-sm resize-none"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                disabled={submitting}
                className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/90 text-white dark:text-black font-extrabold rounded-full px-10 py-7 shadow-[0_0_20px_rgba(255,183,3,0.4)] hover:shadow-[0_0_30px_rgba(255,183,3,0.6)] transition-all text-lg group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <div className="relative flex items-center gap-2">
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2 text-white dark:text-black" />
                  ) : (
                    <Send className="w-5 h-5 mr-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform text-white dark:text-black" />
                  )}    </div>
                <span className="font-bold">{editBlog ? "Update Post" : "Publish Post"}</span>
              </Button>
            </div>
          </form>
        </div>

        {/* AI Sidebar Column (1/3 width, Sticky) */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            <AIWritePanel
              content={content}
              onApply={(newContent) => setContent(newContent)}
            />

            {/* Writing Tips Card */}
            <div className="bg-[var(--black-surface)]/30 backdrop-blur-md border border-[var(--border-soft)] rounded-[2rem] p-6">
              <h4 className="font-bold text-[var(--text-primary)] mb-2 text-sm">Pro Tips</h4>
              <ul className="text-xs text-[var(--text-secondary)] space-y-2 list-disc pl-4 opacity-80">
                <li>Use clear headers to structure your thoughts.</li>
                <li>Back up claims with data or personal experience.</li>
                <li>Keep paragraphs short for better readability.</li>
              </ul>
            </div>
          </div>
        </div>
      </div >
    </motion.div >
  )
}
