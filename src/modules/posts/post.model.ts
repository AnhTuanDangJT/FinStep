import mongoose, { Schema, Document, Model } from 'mongoose';
import { randomUUID } from 'crypto';

export interface IAuthor {
  userId: string;
  name: string;
  email: string;
}

export interface IReviewer {
  adminId: string;
  email: string;
}

/** Single image in a blog post (order preserved) */
export interface IBlogImage {
  _id?: mongoose.Types.ObjectId;
  url: string;
  order: number;
  alt?: string;
}

/** AI-generated metadata per paragraph (advisory only; never overwrites content) */
export interface IParagraphMetaItem {
  index: number;
  aiTitle?: string | null;
  suggestedFormat?: 'paragraph' | 'bullet';
}

export interface IParagraphMeta {
  paragraphs: IParagraphMetaItem[];
}

export type PostStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
export type ExperienceLevel = 'Beginner' | 'Intermediate' | 'Advanced';

/** AI content analysis risk flag (internal; never auto-approve) */
export type RiskFlag = 'low' | 'medium' | 'high';

export interface IBlogPost extends Document {
  /** Non-guessable public identifier (uuid); used in URLs and public responses instead of _id */
  publicId: string;
  title: string;
  slug: string;
  content: string; // FULL text only (no truncation in backend)
  excerpt: string;
  /** Optional short summary for cards/previews (client may truncate for display) */
  summary?: string;
  category?: string;
  tags: string[];
  /** @deprecated Use images[0] for backward compat; kept for migration */
  coverImageUrl?: string;
  /** Multiple images with order (0 images → [], legacy coverImageUrl → images[0] in response) */
  images: IBlogImage[];
  status: PostStatus;
  rejectionReason?: string; // Set when admin rejects
  authorId?: mongoose.Types.ObjectId; // FK → User (optional for backward compat)
  author: IAuthor; // Denormalized snapshot (authorEmail for display)
  reviewedBy?: IReviewer;
  reviewedAt?: Date;
  approvedAt?: Date; // Set when status = APPROVED
  likes: number;
  likedBy: string[]; // userId[] - one like per user
  journeyId?: mongoose.Types.ObjectId; // nullable for legacy posts
  stepNumber?: number;
  experienceLevel?: ExperienceLevel;
  /** AI paragraph analysis metadata (advisory only; never overwrites content) */
  paragraphMeta?: IParagraphMeta;
  /** Toggle AI features (paragraphMeta display) per blog; default true */
  aiFeaturesEnabled?: boolean;
  /** Admin/editor flags (admin only) */
  isFeatured?: boolean;
  isPinned?: boolean;
  editorPick?: boolean;
  /** AI-assisted scoring (internal; generated on submission; do not expose to public APIs) */
  clarityScore?: number;       // 0–100
  originalityScore?: number;  // 0–100
  financeRelevanceScore?: number; // 0–100
  riskFlag?: RiskFlag;       // "low" | "medium" | "high"
  /** Admin post grading (after APPROVED); affects author credibility */
  grade?: number;             // 0..100 nullable
  gradeLabel?: GradeLabel;    // EXCELLENT | GOOD | AVERAGE | WEAK | SPAM
  gradedByEmail?: string;
  gradedAt?: Date;
  credibilityDeltaApplied?: number; // delta applied for this blog (for regrade reversal)
  createdAt: Date;
  updatedAt: Date;
}

export type GradeLabel = 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'WEAK' | 'SPAM';

export interface IComment extends Document {
  postId: mongoose.Types.ObjectId;
  /** Ref to User when authenticated; null for guests */
  authorId?: mongoose.Types.ObjectId;
  /** Denormalized fallback for guests or when authorId not populated */
  authorName?: string;
  content: string;
  createdAt: Date;
}

/**
 * Like model - one like per user per post (unique constraint: postId + userId)
 */
export interface ILike extends Document {
  postId: mongoose.Types.ObjectId;
  userId: string;
  createdAt: Date;
}

const AuthorSchema: Schema = new Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
  },
  { _id: false }
);

const ReviewerSchema: Schema = new Schema(
  {
    adminId: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
  },
  { _id: false }
);

const BlogImageSchema: Schema = new Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },
    order: {
      type: Number,
      required: true,
      default: 0,
    },
    alt: {
      type: String,
      trim: true,
    },
  },
  { _id: true }
);

const BlogPostSchema: Schema = new Schema(
  {
    publicId: {
      type: String,
      required: true,
      unique: true,
      default: () => randomUUID(),
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
    },
    excerpt: {
      type: String,
      required: [true, 'Excerpt is required'],
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    category: {
      type: String,
      trim: true,
    },
    coverImageUrl: {
      type: String,
      trim: true,
    },
    images: {
      type: [BlogImageSchema],
      default: [],
      validate: {
        validator: function (v: unknown[]) {
          return Array.isArray(v) && v.length <= 4;
        },
        message: 'At most 4 images allowed per blog',
      },
    },
    status: {
      type: String,
      enum: ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED'],
      default: 'DRAFT',
      required: true,
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: undefined,
      // Required when status = REJECTED (enforced at API/service); null otherwise
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false, // optional for backward compatibility; set on create
    },
    author: {
      type: AuthorSchema,
      required: true,
    },
    approvedAt: {
      type: Date,
      required: false,
    },
    reviewedBy: {
      type: ReviewerSchema,
      required: false,
    },
    reviewedAt: {
      type: Date,
      required: false,
    },
    likes: {
      type: Number,
      default: 0,
      required: true,
    },
    likedBy: {
      type: [String],
      default: [],
      required: true,
    },
    journeyId: {
      type: Schema.Types.ObjectId,
      ref: 'Journey',
      required: false,
    },
    stepNumber: {
      type: Number,
      required: false,
    },
    experienceLevel: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      required: false,
    },
    summary: {
      type: String,
      trim: true,
      required: false,
    },
    paragraphMeta: {
      type: {
        paragraphs: [{
          index: Number,
          aiTitle: { type: String, default: null },
          suggestedFormat: { type: String, enum: ['paragraph', 'bullet'], default: 'paragraph' },
        }],
      },
      required: false,
    },
    aiFeaturesEnabled: {
      type: Boolean,
      default: true,
      required: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    editorPick: {
      type: Boolean,
      default: false,
    },
    clarityScore: { type: Number, min: 0, max: 100, required: false },
    originalityScore: { type: Number, min: 0, max: 100, required: false },
    financeRelevanceScore: { type: Number, min: 0, max: 100, required: false },
    riskFlag: {
      type: String,
      enum: ['low', 'medium', 'high'],
      required: false,
    },
    grade: { type: Number, min: 0, max: 100, required: false },
    gradeLabel: {
      type: String,
      enum: ['EXCELLENT', 'GOOD', 'AVERAGE', 'WEAK', 'SPAM'],
      required: false,
    },
    gradedByEmail: { type: String, trim: true, lowercase: true, required: false },
    gradedAt: { type: Date, required: false },
    credibilityDeltaApplied: { type: Number, default: 0, required: true },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries (slug has unique: true in field def — no duplicate .index())
BlogPostSchema.index({ status: 1 });
BlogPostSchema.index({ authorId: 1 });
BlogPostSchema.index({ 'author.userId': 1 });
BlogPostSchema.index({ tags: 1 });
BlogPostSchema.index({ createdAt: -1 });
BlogPostSchema.index({ journeyId: 1, stepNumber: 1 });

export const BlogPost: Model<IBlogPost> = mongoose.model<IBlogPost>('BlogPost', BlogPostSchema);

// Comment model: postId → BlogPost, authorId → User (optional for guests)
const CommentSchema: Schema = new Schema(
  {
    postId: {
      type: Schema.Types.ObjectId,
      ref: 'BlogPost',
      required: true,
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    authorName: {
      type: String,
      trim: true,
      required: false,
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      trim: true,
    },
  },
  { timestamps: true }
);
CommentSchema.index({ postId: 1 });
CommentSchema.index({ authorId: 1 });

export const Comment: Model<IComment> = mongoose.model<IComment>('Comment', CommentSchema);

// Like model - unique constraint: one like per user per post
const LikeSchema: Schema = new Schema(
  {
    postId: {
      type: Schema.Types.ObjectId,
      ref: 'BlogPost',
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);
LikeSchema.index({ postId: 1, userId: 1 }, { unique: true });
LikeSchema.index({ postId: 1 });
LikeSchema.index({ userId: 1 });

export const Like: Model<ILike> = mongoose.model<ILike>('Like', LikeSchema);

/**
 * PostUpdate – living posts: immutable timeline updates for APPROVED posts
 */
export interface IPostUpdate extends Document {
  postId: mongoose.Types.ObjectId;
  updateNote: string;
  createdAt: Date;
}

const PostUpdateSchema: Schema = new Schema(
  {
    postId: {
      type: Schema.Types.ObjectId,
      ref: 'BlogPost',
      required: true,
    },
    updateNote: {
      type: String,
      required: [true, 'Update note is required'],
      trim: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
PostUpdateSchema.index({ postId: 1, createdAt: 1 });

export const PostUpdate: Model<IPostUpdate> = mongoose.model<IPostUpdate>('PostUpdate', PostUpdateSchema);


