import mongoose from 'mongoose';
import { Journey, IJourney } from './journey.model';
import { BlogPost, IBlogPost } from '../posts/post.model';
import { CreateJourneyInput } from './journey.validator';

/**
 * Create a journey (authenticated user)
 */
export const createJourney = async (
  userId: string,
  input: CreateJourneyInput
): Promise<IJourney> => {
  const journey = await Journey.create({
    userId,
    title: input.title.trim(),
    goal: input.goal,
    isPublic: input.isPublic ?? false,
  });
  return journey;
};

/**
 * Get journey by ID. Returns null if not found.
 * Caller must enforce: owner can always see; others only if isPublic.
 */
export const getJourneyById = async (journeyId: string): Promise<IJourney | null> => {
  if (!mongoose.Types.ObjectId.isValid(journeyId)) return null;
  return Journey.findById(new mongoose.Types.ObjectId(journeyId)).lean().then((j) => j as IJourney | null);
};

/**
 * List posts for a journey (timeline ordered by stepNumber, then createdAt).
 * Only APPROVED posts are returned for non-owners; owner sees all statuses if they request with auth.
 */
export const getJourneyPosts = async (
  journeyId: string,
  options: { approvedOnly?: boolean } = {}
): Promise<IBlogPost[]> => {
  if (!mongoose.Types.ObjectId.isValid(journeyId)) return [];
  const query: Record<string, unknown> = { journeyId: new mongoose.Types.ObjectId(journeyId) };
  if (options.approvedOnly) {
    query.status = 'APPROVED';
  }
  const posts = await BlogPost.find(query)
    .sort({ stepNumber: 1, createdAt: 1 })
    .lean();
  return posts as unknown as IBlogPost[];
};

/**
 * List journeys for a user (own journeys)
 */
export const listUserJourneys = async (
  userId: string,
  options?: { page?: number; limit?: number }
): Promise<{ journeys: IJourney[]; total: number; page: number; limit: number; totalPages: number }> => {
  const page = options?.page ?? 1;
  const limit = Math.min(options?.limit ?? 20, 50);
  const skip = (page - 1) * limit;
  const [journeys, total] = await Promise.all([
    Journey.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Journey.countDocuments({ userId }),
  ]);
  return {
    journeys: journeys as unknown as IJourney[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

/** Step shape returned by API: stepNumber, title, postId, postSlug for /blogs/:slug routing */
export interface JourneyStepDto {
  stepNumber: number;
  title: string;
  postId: string;
  postSlug: string;
}

/**
 * Get journey steps as DTOs (postId + postSlug) for the given journey.
 * Only APPROVED posts are returned for non-owners; owner sees all when approvedOnly=false.
 */
export const getJourneySteps = async (
  journeyId: string,
  options: { approvedOnly?: boolean } = {}
): Promise<JourneyStepDto[]> => {
  const posts = await getJourneyPosts(journeyId, options);
  return posts.map((p) => ({
    stepNumber: p.stepNumber ?? 0,
    title: p.title,
    postId: (p as any)._id?.toString?.() ?? '',
    postSlug: p.slug ?? '',
  }));
};

/**
 * Get the default/public FinStep journey (title "FinStep Journey", isPublic true).
 * Used by the Journey page to show steps that link to real blog posts.
 */
export const getDefaultJourney = async (): Promise<{ journey: IJourney; steps: JourneyStepDto[] } | null> => {
  const journey = await Journey.findOne({ title: 'FinStep Journey', isPublic: true })
    .sort({ createdAt: 1 })
    .lean();
  if (!journey) return null;
  const steps = await getJourneySteps((journey as any)._id.toString(), { approvedOnly: true });
  return {
    journey: journey as unknown as IJourney,
    steps,
  };
};
