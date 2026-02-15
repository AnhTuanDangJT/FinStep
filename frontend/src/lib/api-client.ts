import { User } from "./auth";

/** Base API URL without trailing slash (avoids double-slash 404s when env has trailing slash). */
const getApiBase = (): string =>
    (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/$/, "");

/** Resolve blog cover or image URL to an absolute URL (for display). */
export function getBlogCoverImageUrl(coverOrUrl?: string | null, imageUrl?: string | null): string | undefined {
    const resolve = (v: string | null | undefined): string | undefined => {
        if (v == null || !String(v).trim()) return undefined;
        const t = String(v).trim();
        if (t.startsWith("http://") || t.startsWith("https://")) return t;
        const path = t.startsWith("/") ? t : `/${t}`;
        return `${getApiBase()}${path}`;
    };
    return resolve(coverOrUrl) ?? resolve(imageUrl) ?? undefined;
}

/** Get a single image URL from blog.images item (string or { url: string }). */
export function getBlogImageUrl(img: string | { url?: string } | null | undefined): string | undefined {
    if (img == null) return undefined;
    const raw = typeof img === "string" ? img : img?.url;
    return getBlogCoverImageUrl(raw) ?? undefined;
}

export interface Post {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    tags: string[];
    coverImage?: string;
    author: User;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt: string;
}

/** Blog post (admin/featured flow); may include grade fields. */
export interface Blog {
    _id: string;
    title: string;
    slug?: string;
    excerpt?: string;
    content?: string;
    author?: { name?: string; id?: string; userId?: string };
    createdAt: string;
    coverImageUrl?: string | null;
    imageUrl?: string | null;
    images?: Array<{ url?: string } | string>;
    grade?: number;
    gradedAt?: string | null;
    gradeLabel?: string | null;
    gradeScore?: number;
    gradeReason?: string | null;
    reason?: string | null;
    commentsCount?: number;
    status?: string;
    rejectionReason?: string | null;
    tags?: string[];
    category?: string;
    likes?: number;
    likedBy?: string[];
}

/** User profile as returned by admin/user endpoints. */
export type UserProfile = User & { id?: string };

/** Current journey summary object. */
export interface CurrentJourneySummary {
    journeyId: string;
    title: string;
    currentStep: number;
    totalSteps: number;
    nextStepTitle: string;
}

/** Current user profile (GET /api/profile/me). */
export interface ProfileMe {
    id: string;
    email: string;
    name: string;
    displayName: string;
    avatarUrl?: string;
    bio?: string;
    experienceLevel?: "Beginner" | "Intermediate" | "Advanced";
    focusAreas: string[];
    location?: string;
    linkedInUrl?: string;
    joinedAt: string;
    lastActiveAt?: string;
    role: string;
    postCount: number;
    journeyCount: number;
    totalLikes: number;
    currentJourney?: CurrentJourneySummary;
    themePreference?: "light" | "dark";
}

/** Mentorship registration (no internal ids). */
export interface MentorshipRegistration {
    id: string; // Added ID for deletion
    _id?: string; // Backend ID
    name: string;
    school: string;
    experienceLevel: string;
    major: string;
    financeFocus: string;
    createdAt: string;
}

/** Body for PUT /api/profile/me. */
export interface UpdateProfileBody {
    displayName?: string;
    avatarUrl?: string;
    bio?: string;
    experienceLevel?: "Beginner" | "Intermediate" | "Advanced";
    focusAreas?: string[];
    location?: string;
    themePreference?: "light" | "dark";
}

/** Comment on a blog post. */
export interface Comment {
    _id?: string;
    id?: string;
    body?: string;
    content?: string;
    author?: { name?: string; id?: string };
    createdAt: string;
}

class ApiClient {
    private accessToken: string | null = null;

    setAccessToken(token: string | null) {
        this.accessToken = token;
    }

    private async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        // Token is now strictly in-memory
        const token = this.accessToken;

        const headers: HeadersInit = {
            "Content-Type": "application/json",
            ...options.headers || {},
        };

        if (token) {
            (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
        }

        const res = await fetch(`${getApiBase()}${endpoint}`, {
            ...options,
            headers,
            credentials: "include",
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            const err = new Error((errorData as { message?: string }).message || "An error occurred");
            (err as Error & { status?: number }).status = res.status;
            throw err;
        }

        return res.json();
    }

    // --- Public / Blog ---

    async getApprovedPosts(search?: string, tag?: string): Promise<Post[]> {
        const query = new URLSearchParams();
        if (search) query.append("search", search);
        if (tag) query.append("tag", tag);
        const res = await this.fetch<{ success: boolean; data: { posts?: Post[] } }>(`/posts?${query.toString()}`);
        return Array.isArray((res as any).data?.posts) ? (res as any).data.posts : (res as any).data ?? [];
    }

    async getPostBySlug(slug: string): Promise<Post> {
        const res = await this.fetch<{ success: boolean; data: { post?: Post } }>(`/posts/${slug}`);
        return (res as any).data?.post ?? (res as any).data;
    }

    // --- Blog (single post, comments, like) ---

    async getApprovedBlogs(
        page: number = 1,
        limit: number = 10,
        search?: string,
        category?: string,
        sort?: string
    ): Promise<{ blogs: Blog[]; total: number; page: number; limit: number; totalPages: number }> {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (search) params.append("search", search);
        if (category) params.append("category", category);
        if (sort) params.append("sort", sort);
        const res = await this.fetch<{ success: boolean; data: { blogs: Blog[]; total: number; page: number; limit: number; totalPages: number } }>(`/api/blogs/public?${params}`);
        return res.data;
    }

    async getBlogById(id: string): Promise<Blog> {
        const res = await this.fetch<{ success: boolean; data: { blog: Blog } }>(`/api/blogs/${id}`);
        return res.data.blog;
    }

    async getComments(postId: string): Promise<{ comments: Comment[]; totalCount: number }> {
        const res = await this.fetch<{ success: boolean; data: { comments: Comment[]; totalCount: number } }>(`/api/blogs/${postId}/comments`);
        return res.data;
    }

    async addComment(postId: string, content: string): Promise<{ comment: Comment; totalCount: number }> {
        const res = await this.fetch<{ success: boolean; data: { comment: Comment; totalCount: number } }>(`/api/blogs/${postId}/comment`, {
            method: "POST",
            body: JSON.stringify({ content }),
        });
        return res.data;
    }

    async toggleLike(postId: string): Promise<{ blog: Blog; liked: boolean }> {
        const res = await this.fetch<{ success: boolean; data: { blog: Blog; liked: boolean } }>(`/api/blogs/${postId}/like`, { method: "POST" });
        return res.data;
    }

    // --- Profile (current user) ---

    async getProfileMe(): Promise<ProfileMe> {
        const res = await this.fetch<{ success: boolean; data: ProfileMe }>("/api/profile/me");
        return res.data;
    }

    async updateProfile(body: UpdateProfileBody): Promise<ProfileMe> {
        const res = await this.fetch<{ success: boolean; data: ProfileMe }>("/api/profile/me", {
            method: "PUT",
            body: JSON.stringify(body),
        });
        return res.data;
    }

    async deleteAccount(): Promise<void> {
        await this.fetch("/api/profile/me", {
            method: "DELETE",
            body: JSON.stringify({ confirm: "DELETE" }),
        });
    }

    async uploadAvatar(file: Blob | File): Promise<{ avatarUrl: string }> {
        const formData = new FormData();
        formData.append("avatar", file);
        const token = this.accessToken;
        const headers: HeadersInit = {};
        if (token) (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
        const res = await fetch(`${getApiBase()}/api/users/avatar`, {
            method: "POST",
            headers,
            credentials: "include",
            body: formData,
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error((err as { message?: string }).message || "Avatar upload failed");
        }
        const json = await res.json();
        return json.data ?? { avatarUrl: (json as { avatarUrl?: string }).avatarUrl ?? "" };
    }

    // --- Protected / User ---

    async createPost(data: Partial<Post>): Promise<Post> {
        const res = await this.fetch<{ success: boolean; data: { post?: Post } }>("/posts", {
            method: "POST",
            body: JSON.stringify(data),
        });
        return (res as any).data?.post ?? (res as any).data;
    }

    async getMyPosts(): Promise<Post[]> {
        const res = await this.fetch<{ success: boolean; data: Post[] }>("/posts/me");
        return Array.isArray((res as any).data) ? (res as any).data : [];
    }

    // --- Admin ---

    /** GET /admin/overview – admin dashboard counts. Requires admin auth. */
    async getAdminOverview(): Promise<{ pending: number; approved: number; users: number }> {
        const res = await this.fetch<{ success: boolean; data: { pending: number; approved: number; users: number } }>("/admin/overview");
        return res.data ?? { pending: 0, approved: 0, users: 0 };
    }

    async getPendingPosts(): Promise<Post[]> {
        const res = await this.fetch<{ success: boolean; data: { posts: Post[] } }>("/admin/posts/pending");
        return res.data?.posts ?? [];
    }

    async approvePost(id: string): Promise<void> {
        await this.fetch(`/admin/posts/${id}/approve`, { method: "POST" });
    }

    async rejectPost(id: string, reason?: string): Promise<void> {
        await this.fetch(`/admin/posts/${id}/reject`, {
            method: "POST",
            body: JSON.stringify({ reason })
        });
    }

    async getUsers(page: number = 1, limit: number = 10): Promise<{ users: UserProfile[]; total: number }> {
        const res = await this.fetch<{ success: boolean; data: { users: UserProfile[]; total: number } }>("/admin/users");
        const data = res.data ?? { users: [], total: 0 };
        const users = Array.isArray(data.users) ? data.users : [];
        const total = typeof data.total === "number" ? data.total : users.length;
        const start = (page - 1) * limit;
        const sliced = users.slice(start, start + limit);
        return { users: sliced, total };
    }

    async addAdmin(email: string): Promise<void> {
        await this.fetch("/admin/users/add-admin", {
            method: "POST",
            body: JSON.stringify({ email }),
        });
    }

    async adjustUserCredibility(userId: string, score: number, reason: string): Promise<void> {
        await this.fetch(`/admin/users/${userId}/credibility`, {
            method: "POST",
            body: JSON.stringify({ score, reason }),
        });
    }

    // --- Admin & Blog Methods (Mapped or New) ---

    async getPendingBlogs(page: number, limit: number): Promise<{ blogs: Blog[]; total: number }> {
        const posts = await this.getPendingPosts();
        const start = (page - 1) * limit;
        const sliced = posts.slice(start, start + limit);
        return { blogs: sliced as unknown as Blog[], total: posts.length };
    }

    async getAdminApprovedBlogs(page: number, limit: number): Promise<{ blogs: Blog[]; total: number }> {
        const res = await this.fetch<{ success: boolean; data: { blogs: Blog[]; total: number } }>(`/admin/blogs/approved?page=${page}&limit=${limit}`);
        const data = res.data ?? { blogs: [], total: 0 };
        return { blogs: data.blogs ?? [], total: data.total ?? 0 };
    }

    async approveBlog(id: string): Promise<void> {
        await this.approvePost(id);
    }

    async rejectBlog(id: string, reason: string): Promise<void> {
        await this.rejectPost(id, reason);
    }

    async deleteBlog(id: string): Promise<void> {
        await this.fetch(`/posts/${id}`, { method: "DELETE" });
    }

    async gradeBlog(id: string, score: number, reason: string, regrade?: boolean): Promise<{ blog: Blog; regraded: boolean }> {
        const res = await this.fetch<{ success: boolean; data: { blog: Blog; regraded: boolean } }>(`/admin/blogs/${id}/grade`, {
            method: "POST",
            body: JSON.stringify({ grade: score, reason: reason || undefined, regrade: regrade ?? undefined }),
        });
        return res.data ?? { blog: {} as Blog, regraded: false };
    }

    async getUserDetails(userId: string): Promise<AdminUserProfile> {
        const res = await this.fetch<{ success: boolean; data: AdminUserProfile }>(`/admin/users/${userId}`);
        return res.data;
    }

    async getCredibilityHistory(userId: string): Promise<any[]> {
        const res = await this.fetch<{ success: boolean; data: any[] }>(`/admin/users/${userId}/credibility-history`);
        return res.data;
    }

    async getAdminUserPosts(userId: string): Promise<any[]> {
        const res = await this.fetch<{ success: boolean; data: { posts?: any[] } }>(`/admin/users/${userId}/posts`);
        const data = res.data ?? {};
        return Array.isArray(data.posts) ? data.posts : [];
    }

    async registerMentorship(data: any): Promise<void> {
        await this.fetch("/api/mentorship/register", {
            method: "POST",
            body: JSON.stringify(data),
        });
    }

    /** Mentorship registrations (admin). */
    async getMentorshipRegistrations(page = 1, limit = 20): Promise<{ items: MentorshipRegistration[]; total: number; page: number; limit: number }> {
        const res = await this.fetch<{ success: boolean; data: { items: any[]; total: number; page: number; limit: number } }>(
            `/admin/mentorship/registrations?page=${page}&limit=${limit}`
        );
        const items = (res.data?.items || []).map(item => ({
            ...item,
            id: item.id || item._id // Ensure ID exists
        }));
        return { items, total: res.data?.total || 0, page: res.data?.page || 1, limit: res.data?.limit || 20 };
    }

    /** Download mentorship registrations as Excel (admin). */
    async downloadMentorshipExcel(): Promise<Blob> {
        const token = this.accessToken;
        const headers: HeadersInit = {};
        if (token) (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
        const res = await fetch(`${getApiBase()}/admin/mentorship/registrations/export`, {
            headers,
            credentials: "include",
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error((err as { message?: string }).message || "Export failed");
        }
        return res.blob();
    }

    /** Delete registration (admin). */
    async deleteMentorshipRegistration(id: string): Promise<void> {
        await this.fetch(`/admin/mentorship/registrations/${id}`, { method: "DELETE" });
    }

    // --- Missing Methods (implied by usage) ---

    async getMyBlogs(page: number, limit: number): Promise<{ blogs: Blog[]; total: number }> {
        const posts = await this.getMyPosts();
        // Client-side pagination
        const start = (page - 1) * limit;
        const sliced = posts.slice(start, start + limit);
        return { blogs: sliced as unknown as Blog[], total: posts.length };
    }

    async getLatestAnnouncement(): Promise<Announcement | null> {
        // Mock or fetch
        // return this.fetch<Announcement>("/announcements/latest");
        // Mock for now
        return null;
        /*
        return {
            id: "ann-1",
            title: "Welcome to FinStep v2.5",
            message: "We've updated our dashboard with new features!",
            type: "info",
            active: true,
            createdAt: new Date().toISOString()
        };
        */
    }

    async createBlog(data: any): Promise<Blog> {
        const imageFiles = data.imageFiles as File[] | undefined;
        const hasFiles = Array.isArray(imageFiles) && imageFiles.length > 0;

        if (hasFiles) {
            const formData = new FormData();
            formData.append("title", data.title ?? "");
            formData.append("content", data.content ?? "");
            formData.append("excerpt", data.excerpt ?? data.content?.slice(0, 200) ?? "");
            formData.append("tags", JSON.stringify(data.tags ?? []));
            imageFiles.forEach((file: File, index: number) => {
                if (index === 0) {
                    formData.append("coverImage", file);
                } else {
                    formData.append("images", file);
                }
            });

            const token = this.accessToken;
            const headers: HeadersInit = {};
            if (token) (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;

            const res = await fetch(`${getApiBase()}/api/blogs/create`, {
                method: "POST",
                headers,
                credentials: "include",
                body: formData,
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error((err as { message?: string }).message || "Failed to create blog");
            }
            const json = await res.json();
            return (json as any).data?.post ?? (json as any).data?.blog ?? (json as any).data;
        }

        const { imageFiles: _f, ...payload } = data;
        const res = await this.fetch<{ success: boolean; data: { post?: Blog } }>("/posts", {
            method: "POST",
            body: JSON.stringify({ ...payload, coverImageUrl: payload.images?.[0] ?? payload.coverImageUrl }),
        });
        return (res as any).data?.post ?? (res as any).data;
    }

    async updateBlog(id: string, data: any): Promise<Blog> {
        const res = await this.fetch<{ success: boolean; data: { post?: Blog } }>(`/posts/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        });
        return (res as any).data?.post ?? (res as any).data;
    }

    async uploadImage(file: Blob | File): Promise<string> {
        const formData = new FormData();
        formData.append("image", file);
        const token = this.accessToken;
        const headers: HeadersInit = {};
        if (token) (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
        // Do NOT set Content-Type: fetch will set multipart/form-data with boundary

        const res = await fetch(`${getApiBase()}/api/upload`, {
            method: "POST",
            headers,
            credentials: "include",
            body: formData,
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            const msg = (err as { message?: string }).message || res.statusText || "Image upload failed";
            throw new Error(msg);
        }

        const json = await res.json();
        const url =
            (json.data && (json.data.url ?? json.data.coverImageUrl)) ??
            json.url ??
            json.coverImageUrl ??
            "";
        if (!url || typeof url !== "string") {
            throw new Error("Image upload succeeded but no URL returned");
        }
        return url;
    }
    async getPrimaryMentor(): Promise<PrimaryMentor> {
        // Mock implementation or fetch
        // return this.fetch<PrimaryMentor>("/mentor/primary");
        // For now, let's return the hardcoded one from the landing page if API fails,
        // or just fetch. usage suggests it exists.
        // I'll try fetch.
        try {
            const res = await this.fetch<{ success: boolean; data: PrimaryMentor }>("/mentor/primary");
            return res.data;
        } catch (e) {
            // Fallback to hardcoded for demo stability if API fails
            return {
                id: "mentor-1",
                name: "Bùi Đình Trí",
                role: "Senior Mentor",
                bio: "Mentors shorten learning loops, reduce costly mistakes, and provide the accountability you need to succeed.",
                avatarUrl: "",
                ctaUrl: "https://www.facebook.com/tri.dinhbui02#",
                fields: ["Finance", "Investing", "Computer Science"],
                availability: "Available"
            };
        }
    }
}

export interface AdminUserProfile extends UserProfile {
    credibilityScore?: number;
    stats?: {
        blogs: { total: number; approved: number; pending: number; rejected: number }
        joinedAt: string
    }
}

export interface PrimaryMentor {
    id: string;
    name: string;
    role: string;
    bio: string;
    avatarUrl: string;
    ctaUrl: string;
    fields: string[];
    availability: string;
}

export interface Announcement {
    id: string;
    title: string;
    message: string;
    type: "info" | "warning" | "success" | "maintenance";
    active: boolean;
    createdAt: string;
    link?: string;
    linkText?: string;
}

export const apiClient = new ApiClient();
