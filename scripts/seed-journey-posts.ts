/**
 * Seed the default FinStep Journey and its 4 step blog posts.
 * Every journey step will point to a real Post (slug-based: /blogs/:slug).
 * Run: npx tsx scripts/seed-journey-posts.ts
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { resolve } from 'path';
import { connectDB } from '../src/config/db';
import { User } from '../src/modules/auth/auth.model';
import { Journey } from '../src/modules/journey/journey.model';
import { BlogPost } from '../src/modules/posts/post.model';
import { hashPassword } from '../src/utils/hash';

dotenv.config({ path: resolve(process.cwd(), '.env') });

const JOURNEY_TITLE = 'FinStep Journey';
const SEED_AUTHOR_EMAIL = 'seed@finstep.local';
const SEED_AUTHOR_NAME = 'FinStep';

const STEP_DEFS: Array<{
  title: string;
  slug: string;
  summary: string;
  content: string;
  tags: string[];
  category: string;
  coverImageUrl: string;
}> = [
  {
    title: 'The Mindset Shift',
    slug: 'the-mindset-shift',
    summary: 'Stop thinking like a consumer and start thinking like an investor. Understanding assets vs liabilities.',
    content: `## The Mindset Shift

The first step in your financial journey is changing how you think about money. Most people treat income as something to spend. Investors treat it as something to allocate.

**Assets vs Liabilities**
- An asset puts money in your pocket (rental income, dividends, a side business).
- A liability takes money out (car payments, credit card interest, unnecessary subscriptions).

Start by listing your monthly cash flows. Label each as asset or liability. Then focus on growing assets and shrinking liabilities. This mindset shift is the foundation for everything that follows.`,
    tags: ['mindset', 'basics', 'assets', 'liabilities'],
    category: 'Personal Finance',
    coverImageUrl: '/assets/journey/step-1.png',
  },
  {
    title: 'Emergency Fund Basics',
    slug: 'emergency-fund-basics',
    summary: 'Why you need F-U money before you start picking stocks. Building your safety net.',
    content: `## Emergency Fund Basics

Before you invest a single dollar, build an emergency fund. This is money that sits in a high-yield savings account and is only for real emergencies: job loss, medical bills, urgent repairs.

**How much?** Aim for 3–6 months of essential expenses. If your monthly essentials are $3,000, that’s $9,000–$18,000.

**Where?** A separate account you don’t touch for daily spending. Many use an online bank with a higher APY.

**Why first?** Without this buffer, a single shock can force you to sell investments at a bad time or go into debt. With it, you can take risks (like investing) without fear.`,
    tags: ['emergency fund', 'savings', 'safety net', 'basics'],
    category: 'Personal Finance',
    coverImageUrl: '/assets/journey/step-2.png',
  },
  {
    title: 'Debt Avalanche vs Snowball',
    slug: 'debt-avalanche-vs-snowball',
    summary: 'Killing high-interest debt effectively. Which method fits your psychology?',
    content: `## Debt Avalanche vs Snowball

Two popular ways to pay off multiple debts:

**Avalanche:** Pay minimums on everything; put extra money toward the debt with the *highest interest rate*. Mathematically optimal—you pay less interest over time.

**Snowball:** Pay minimums on everything; put extra money toward the *smallest balance* first. You get quick wins and motivation as balances disappear.

Choose avalanche if you’re disciplined and want to minimize interest. Choose snowball if you need psychological wins to stay on track. Both work; the best plan is the one you’ll stick with.`,
    tags: ['debt', 'avalanche', 'snowball', 'payoff'],
    category: 'Personal Finance',
    coverImageUrl: '/assets/journey/step-3.png',
  },
  {
    title: 'Index Funds & ETFs',
    slug: 'index-funds-etfs',
    summary: 'The lazy way to wealth. Understanding broad market exposure.',
    content: `## Index Funds & ETFs

You don’t need to pick individual stocks to build long-term wealth. Index funds and ETFs let you own the whole market (or a big slice of it) in one ticker.

**Index fund:** A mutual fund that tracks an index (e.g. S&P 500). Often low cost and diversified.

**ETF:** Exchange-traded fund. Same idea but trades like a stock. Often even lower fees and more tax-efficient in taxable accounts.

**Why use them?** Low fees, diversification, and a long-term return that tracks the market. Most active managers fail to beat the index over decades. “The lazy way” is often the winning way.`,
    tags: ['investing', 'index funds', 'ETFs', 'diversification'],
    category: 'Investing',
    coverImageUrl: '/assets/journey/step-4.png',
  },
];

async function seed() {
  await connectDB();

  let authorId: string;
  let authorName: string;
  let authorEmail: string;

  const existing = await User.findOne({ email: SEED_AUTHOR_EMAIL }).lean();
  if (existing) {
    authorId = (existing as any)._id.toString();
    authorName = (existing as any).name || SEED_AUTHOR_NAME;
    authorEmail = (existing as any).email;
    console.log('Using existing seed user:', authorEmail);
  } else {
    const user = await User.create({
      name: SEED_AUTHOR_NAME,
      email: SEED_AUTHOR_EMAIL,
      provider: 'local',
      roles: ['USER'],
      passwordHash: await hashPassword('seed-no-login-' + Date.now()),
    });
    authorId = user._id.toString();
    authorName = user.name;
    authorEmail = user.email;
    console.log('Created seed user:', authorEmail);
  }

  const author = { userId: authorId, name: authorName, email: authorEmail };

  let journey = await Journey.findOne({ title: JOURNEY_TITLE }).lean();
  let journeyId: mongoose.Types.ObjectId;
  if (journey) {
    journeyId = (journey as any)._id;
    console.log('Using existing journey:', JOURNEY_TITLE);
  } else {
    const created = await Journey.create({
      userId: authorId,
      title: JOURNEY_TITLE,
      goal: 'Investing',
      isPublic: true,
    });
    journeyId = created._id;
    console.log('Created journey:', JOURNEY_TITLE);
  }

  for (let i = 0; i < STEP_DEFS.length; i++) {
    const def = STEP_DEFS[i];
    const stepNumber = i + 1;
    const existing = await BlogPost.findOne({ slug: def.slug }).lean();
    if (existing) {
      const ex = existing as any;
      if (ex.status !== 'APPROVED') {
        await BlogPost.updateOne(
          { _id: ex._id },
          {
            $set: {
              status: 'APPROVED',
              approvedAt: new Date(),
              journeyId,
              stepNumber,
              title: def.title,
              summary: def.summary,
              content: def.content,
              tags: def.tags,
              category: def.category,
              coverImageUrl: def.coverImageUrl,
            },
          }
        );
        console.log('Updated and approved post:', def.slug);
      } else {
        await BlogPost.updateOne(
          { _id: ex._id },
          { $set: { journeyId, stepNumber } }
        );
        console.log('Linked existing post to journey:', def.slug);
      }
      continue;
    }

    const excerpt = def.summary.substring(0, 200).trim();
    await BlogPost.create({
      title: def.title,
      slug: def.slug,
      content: def.content,
      excerpt,
      summary: def.summary,
      tags: def.tags,
      category: def.category,
      coverImageUrl: def.coverImageUrl,
      status: 'APPROVED',
      authorId,
      author,
      approvedAt: new Date(),
      journeyId,
      stepNumber,
      likes: 0,
      likedBy: [],
    });
    console.log('Created post:', def.slug);
  }

  console.log('Seed complete. Journey steps point to real posts. Use GET /api/journeys/default to verify.');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
