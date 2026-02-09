"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/context/AuthContext"
import { User, Mail, Shield, Camera, X, Loader2, MapPin, Trash2, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiClient, type ProfileMe, type UpdateProfileBody } from "@/lib/api-client"
import { getBlogCoverImageUrl } from "@/lib/api-client"
import { ProfileStats } from "@/components/profile/ProfileStats"
import { JourneyProgress } from "@/components/profile/JourneyProgress"

const EXPERIENCE_LEVELS = ["Beginner", "Intermediate", "Advanced"] as const
const FOCUS_AREAS = [
  { value: "PersonalFinance", label: "Personal Finance" },
  { value: "Investing", label: "Investing" },
  { value: "Career", label: "Career" },
  { value: "SideHustle", label: "Side Hustle" },
] as const

export function ProfileView() {
  const router = useRouter()
  const { user, refreshUser, logout } = useAuth()
  const [profile, setProfile] = React.useState<ProfileMe | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [editOpen, setEditOpen] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = React.useState("")
  const [deleting, setDeleting] = React.useState(false)

  const loadProfile = React.useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const p = await apiClient.getProfileMe()
      setProfile(p)
    } catch {
      setError("Failed to load profile")
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }, [user])

  React.useEffect(() => {
    loadProfile()
  }, [loadProfile])

  if (!user) return null

  const displayName = profile?.displayName || user.name
  const avatarUrl = profile?.avatarUrl

  // Real-time stats from GET /api/profile/me
  const stats = {
    postsWritten: profile?.postCount ?? 0,
    journeysStarted: profile?.journeyCount ?? 0,
    totalLikes: profile?.totalLikes ?? 0,
    joinedAt: profile?.joinedAt ?? new Date().toISOString(),
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-8 pb-12"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-brand-text mb-2">My Profile</h2>
          <p className="text-brand-text/60">Manage your persona and track your growth.</p>
        </div>
        <Button
          onClick={() => setEditOpen(true)}
          className="bg-brand-primary text-white hover:bg-brand-primary/90 shadow-lg shadow-brand-primary/20"
        >
          Edit Profile
        </Button>
      </div>

      {loading && !profile ? (
        <div className="flex items-center justify-center py-20 text-brand-text/50">
          <Loader2 className="w-10 h-10 animate-spin" />
        </div>
      ) : error ? (
        <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3">
          {error}
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column: Stats & Journey */}
          <div className="lg:col-span-2 space-y-8">
            {/* Stats Row */}
            <ProfileStats stats={stats} />

            {/* Journey Section (real-time from profile.currentJourney) */}
            <JourneyProgress currentJourney={profile?.currentJourney} />

            {/* Bio & Details Card */}
            <div className="bg-[var(--bg-surface)]/60 backdrop-blur-xl border border-[var(--border-soft)] rounded-[2rem] p-8 shadow-lg">
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-6">About Me</h3>
              <div className="space-y-6">
                {profile?.bio ? (
                  <p className="text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
                ) : (
                  <p className="text-[var(--text-secondary)]/40 italic">No bio yet. Tell the world who you are.</p>
                )}

                <div className="flex flex-wrap gap-3">
                  {profile?.focusAreas?.map(area => (
                    <span key={area} className="px-4 py-2 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-soft)] text-sm font-medium text-[var(--text-secondary)] shadow-sm">
                      {FOCUS_AREAS.find(f => f.value === area)?.label || area}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Identity Card */}
          <div className="space-y-6">
            <div className="bg-[var(--bg-surface)]/80 backdrop-blur-xl border border-[var(--border-soft)] rounded-[2rem] p-6 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-[var(--brand-primary)]/20 via-purple-500/10 to-transparent" />

              <div className="relative z-10 flex flex-col items-center mt-8">
                <div className="w-32 h-32 rounded-full p-1 bg-[var(--bg-surface)] shadow-2xl mb-4">
                  {avatarUrl ? (
                    <img src={getBlogCoverImageUrl(avatarUrl)} alt={displayName} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <div className="w-full h-full rounded-full bg-[var(--bg-elevated)] flex items-center justify-center text-[var(--text-secondary)]">
                      <User className="w-12 h-12" />
                    </div>
                  )}
                </div>
                <h3 className="text-2xl font-bold text-[var(--text-primary)]">{displayName}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-3 py-1 bg-[var(--brand-primary)] text-black text-xs font-bold rounded-full uppercase tracking-wider">
                    {profile?.role || "User"}
                  </span>
                  {profile?.experienceLevel && (
                    <span className="px-3 py-1 bg-[var(--bg-elevated)] text-[var(--text-secondary)] text-xs font-bold rounded-full border border-[var(--border-soft)]">
                      {profile.experienceLevel}
                    </span>
                  )}
                </div>

                {profile?.location && (
                  <div className="flex items-center gap-1 mt-4 text-[var(--text-secondary)] text-sm">
                    <MapPin className="w-4 h-4" />
                    {profile.location}
                  </div>
                )}

                <div className="w-full border-t border-[var(--border-soft)] my-6" />

                <div className="grid w-full gap-4">
                  <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                    <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="truncate">{user.email}</span>
                      <span className="text-[10px] text-[var(--text-disabled)] uppercase tracking-wider font-bold flex items-center gap-1">
                        <Shield className="w-3 h-3" /> Private
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                      <Shield className="w-4 h-4" />
                    </div>
                    <span>Verified Member</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Danger zone: Delete account */}
            <div className="mt-10 pt-8 border-t border-red-500/20">
              <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-red-400 flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5" />
                  Danger zone
                </h3>
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                  Permanently delete your account. Your blog posts will remain but will show as by &quot;Deleted User&quot;.
                </p>
                <Button
                  variant="outline"
                  onClick={() => setDeleteOpen(true)}
                  className="border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete my account
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <DeleteAccountModal
        isOpen={deleteOpen}
        onClose={() => { setDeleteOpen(false); setDeleteConfirmText(""); }}
        confirmText={deleteConfirmText}
        onConfirmTextChange={setDeleteConfirmText}
        deleting={deleting}
        onConfirm={async () => {
          setDeleting(true)
          try {
            await apiClient.deleteAccount()
            toast.success("Account deleted")
            await logout()
            router.push("/")
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to delete account")
          } finally {
            setDeleting(false)
          }
        }}
      />

      {/* Explicitly mounting modal outside of loading state constraints if needed, but here structure is fine */}
      <EditProfileModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        profile={profile}
        onSaved={(p) => {
          setProfile(p)
          setEditOpen(false)
          refreshUser()
        }}
        saving={saving}
        setSaving={setSaving}
      />
    </motion.div>
  )
}

function DeleteAccountModal({
  isOpen,
  onClose,
  confirmText,
  onConfirmTextChange,
  deleting,
  onConfirm,
}: {
  isOpen: boolean
  onClose: () => void
  confirmText: string
  onConfirmTextChange: (v: string) => void
  deleting: boolean
  onConfirm: () => Promise<void>
}) {
  const canConfirm = confirmText.trim() === "DELETE"
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-[var(--bg-surface)] border border-red-500/30 rounded-2xl shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-red-400 flex items-center gap-2 mb-4">
              <AlertTriangle className="w-6 h-6" />
              Delete account
            </h3>
            <p className="text-[var(--text-secondary)] text-sm mb-4">
              This action cannot be undone. Your account will be permanently removed. Your blog posts will remain but will show as by &quot;Deleted User&quot;.
            </p>
            <Label className="text-[var(--text-secondary)]">Type DELETE to confirm</Label>
            <Input
              value={confirmText}
              onChange={(e) => onConfirmTextChange(e.target.value)}
              placeholder="DELETE"
              className="mt-2 mb-6 border-red-500/30 focus-visible:ring-red-500/50"
              autoComplete="off"
            />
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={onClose} disabled={deleting}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => onConfirm()}
                disabled={!canConfirm || deleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                {deleting ? "Deleting…" : "Delete my account"}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
  profile: ProfileMe | null
  onSaved: (profile: ProfileMe) => void
  saving: boolean
  setSaving: (v: boolean) => void
}

function EditProfileModal({ isOpen, onClose, profile, onSaved, saving, setSaving }: EditProfileModalProps) {
  const [displayName, setDisplayName] = React.useState(profile?.displayName ?? "")
  const [avatarUrl, setAvatarUrl] = React.useState(profile?.avatarUrl ?? "")
  const [bio, setBio] = React.useState(profile?.bio ?? "")
  const [experienceLevel, setExperienceLevel] = React.useState<UpdateProfileBody["experienceLevel"]>(profile?.experienceLevel ?? undefined)
  const [focusAreas, setFocusAreas] = React.useState<UpdateProfileBody["focusAreas"]>(profile?.focusAreas ?? [])
  const [location, setLocation] = React.useState(profile?.location ?? "")

  const [formError, setFormError] = React.useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = React.useState(false)

  // Use a ref to track if we need to reset form data when opening
  React.useEffect(() => {
    if (isOpen && profile) {
      setDisplayName(profile.displayName)
      setAvatarUrl(profile.avatarUrl || "")
      setBio(profile.bio || "")
      setExperienceLevel(profile.experienceLevel)
      setFocusAreas(profile.focusAreas || [])
      setLocation(profile.location || "")
      setFormError(null)
    }
  }, [isOpen, profile])

  const toggleFocus = (value: (typeof FOCUS_AREAS)[number]["value"]) => {
    setFocusAreas((prev) => {
      const next = prev?.includes(value) ? prev.filter((a) => a !== value) : [...(prev ?? []), value]
      return next.slice(0, 3)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setSaving(true)
    try {
      const body: UpdateProfileBody = {
        displayName: displayName.trim() || undefined,
        avatarUrl: avatarUrl.trim(), // Send empty string if cleared
        bio: bio.trim().length > 0 ? bio.trim().slice(0, 300) : undefined,
        experienceLevel: experienceLevel || undefined,
        focusAreas: focusAreas?.length ? focusAreas : undefined,
        location: location.trim() || undefined,
      }
      const updated = await apiClient.updateProfile(body)
      onSaved(updated)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save profile")
    } finally {
      setSaving(false)
    }
  }

  // Helper: Client-side resize
  const resizeImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = document.createElement("img")
      img.src = URL.createObjectURL(file)
      img.onload = () => {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("Canvas context not available"))
          return
        }

        const MAX_WIDTH = 512
        const MAX_HEIGHT = 512
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width
            width = MAX_WIDTH
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height
            height = MAX_HEIGHT
          }
        }

        canvas.width = width
        canvas.height = height
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error("Canvas to Blob failed"))
            return
          }
          resolve(blob)
        }, file.type, 0.9)
      }
      img.onerror = () => reject(new Error("Image load failed"))
    })
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 1. Validate File Type
    const validTypes = ["image/png", "image/jpeg", "image/webp"]
    if (!validTypes.includes(file.type)) {
      setFormError("Invalid file type. Please use PNG, JPG, or WEBP.")
      e.target.value = "" // Reset
      return
    }

    // 2. Validate File Size (Max 2MB)
    const MAX_SIZE = 2 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      setFormError(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Max 2MB allowed.`)
      e.target.value = "" // Reset input
      return
    }

    // 3. Immediate Preview (for UX)
    const previewUrl = URL.createObjectURL(file)
    const previousUrl = avatarUrl // Backup
    setAvatarUrl(previewUrl) // Show local immediately
    setFormError(null)
    setUploadingAvatar(true)

    try {
      // 4. Resize Client-Side
      const resizedBlob = await resizeImage(file)
      const resizedFile = new File([resizedBlob], file.name, { type: file.type })

      // 5. Upload Resized Image to Server
      const { avatarUrl: serverAvatarUrl } = await apiClient.uploadAvatar(resizedFile)

      // 6. Update with Server URL
      setAvatarUrl(serverAvatarUrl)
      toast.success("Avatar updated successfully")
    } catch (err) {
      console.error("Avatar upload failed", err)
      // 7. Revert on failure
      setAvatarUrl(previousUrl)
      setFormError(err instanceof Error ? err.message : "Avatar upload failed. Please try again.")
    } finally {
      // Cleanup
      URL.revokeObjectURL(previewUrl)
      setUploadingAvatar(false)
      // Clear input so same file can be selected again if needed
      e.target.value = ""
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-[var(--bg-surface)] rounded-[2rem] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto relative z-10 flex flex-col border border-[var(--border-soft)]"
        >
          <div className="sticky top-0 bg-[var(--bg-surface)]/95 backdrop-blur border-b border-[var(--border-soft)] px-6 py-4 flex items-center justify-between z-20">
            <h3 className="text-xl font-bold text-[var(--text-primary)]">Edit Profile</h3>
            <button onClick={onClose} className="p-2 hover:bg-[var(--bg-elevated)] rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
            {formError && (
              <div className="p-4 bg-red-500/10 text-red-500 rounded-xl text-sm font-medium border border-red-500/20">
                {formError}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[var(--text-secondary)]">Avatar Image</Label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-[var(--bg-elevated)] flex-shrink-0 overflow-hidden border border-[var(--border-soft)]">
                    {avatarUrl ? (
                      <img src={getBlogCoverImageUrl(avatarUrl)} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-[var(--text-secondary)]"><User className="w-8 h-8" /></div>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <label className={`
                        text-xs bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] px-3 py-1.5 rounded-lg 
                        cursor-pointer hover:bg-[var(--brand-primary)]/20 transition-colors font-medium flex items-center gap-2
                        ${uploadingAvatar ? 'opacity-50 pointer-events-none' : ''}
                      `}>
                        {uploadingAvatar ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
                        {uploadingAvatar ? "Uploading..." : "Upload New Image"}
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          disabled={uploadingAvatar}
                        />
                      </label>

                      {avatarUrl && (
                        <button
                          type="button"
                          onClick={() => setAvatarUrl("")}
                          disabled={uploadingAvatar}
                          className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Remove photo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[var(--text-secondary)]">Display Name <span className="text-red-500">*</span></Label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  maxLength={50}
                  className="bg-[var(--bg-elevated)] border-[var(--border-soft)] text-[var(--text-primary)]"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[var(--text-secondary)]">Bio <span className="text-[var(--text-disabled)] text-xs font-normal">({bio.length}/300)</span></Label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value.slice(0, 300))}
                  className="w-full rounded-xl border border-[var(--border-soft)] p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 min-h-[100px] bg-[var(--bg-elevated)] text-[var(--text-primary)]"
                  placeholder="Tell us about your financial journey..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[var(--text-secondary)]">Experience</Label>
                  <select
                    value={experienceLevel || ""}
                    onChange={(e) => setExperienceLevel((e.target.value || undefined) as any)}
                    className="w-full rounded-xl border border-[var(--border-soft)] p-2.5 text-sm bg-[var(--bg-elevated)] text-[var(--text-primary)]"
                  >
                    <option value="">Select Level</option>
                    {EXPERIENCE_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[var(--text-secondary)]">Location</Label>
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="City, Country"
                    className="bg-[var(--bg-elevated)] border-[var(--border-soft)] text-[var(--text-primary)]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[var(--text-secondary)]">Focus Areas <span className="text-[var(--text-disabled)] text-xs font-normal">(Max 3)</span></Label>
                <div className="grid grid-cols-2 gap-2">
                  {FOCUS_AREAS.map(f => (
                    <label key={f.value} className={`
                                        flex items-center gap-2 p-2 rounded-lg border text-sm cursor-pointer transition-all
                                        ${focusAreas?.includes(f.value)
                        ? "border-[var(--brand-primary)] bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]"
                        : "border-[var(--border-soft)] hover:border-[var(--brand-primary)]/30 text-[var(--text-secondary)]"}
                                    `}>
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={focusAreas?.includes(f.value) || false}
                        onChange={() => toggleFocus(f.value)}
                        disabled={!focusAreas?.includes(f.value) && (focusAreas?.length || 0) >= 3}
                      />
                      <span className="font-medium">{f.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-12 rounded-xl border-[var(--border-soft)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]">
                Cancel
              </Button>
              <Button type="submit" disabled={saving || uploadingAvatar} className="flex-1 h-12 rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-white shadow-lg shadow-brand-primary/20">
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Changes"}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
