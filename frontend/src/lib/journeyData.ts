export interface JourneyStep {
    id: string
    title: string
    description: string
    readTime: string
    slug: string // used for href /blogs/[slug]
}

export const JOURNEY_STEPS: JourneyStep[] = [
    {
        id: "1",
        title: "The Mindset Shift",
        description: "Stop thinking like a consumer and start thinking like an investor. Understanding assets vs liabilities.",
        readTime: "5 min read",
        slug: "the-mindset-shift"
    },
    {
        id: "2",
        title: "Emergency Fund Basics",
        description: "Why you need F-U money before you start picking stocks. Building your safety net.",
        readTime: "7 min read",
        slug: "emergency-fund-basics"
    },
    {
        id: "3",
        title: "Debt Avalanche vs Snowball",
        description: "Killing high-interest debt effectively. Which method fits your psychology?",
        readTime: "10 min read",
        slug: "debt-avalanche-vs-snowball"
    },
    {
        id: "4",
        title: "Index Funds & ETFs",
        description: "The lazy way to wealth. Understanding broad market exposure.",
        readTime: "8 min read",
        slug: "index-funds-etfs"
    }
]
