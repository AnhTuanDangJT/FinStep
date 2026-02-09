export interface BlogPost {
    slug: string;
    title: string;
    author: string;
    date: string;
    readTime: string;
    tags: string[];
    coverImage: string;
    content: string; // HTML or Markdown string
}

export const BLOG_POSTS: BlogPost[] = [
    {
        slug: "the-mindset-shift",
        title: "The Mindset Shift: Consumer vs. Investor",
        author: "Bùi Đình Trí",
        date: "Jan 12, 2026",
        readTime: "5 min read",
        tags: ["Mindset", "Investing", "Growth"],
        coverImage: "/assets/journey/the-mindset-shift.svg",
        content: `
      <p>Most people go through life working for money, but they never learn how to make money work for them. This is the fundamental difference between a consumer mindset and an investor mindset.</p>
      
      <h3>The Consumer Trap</h3>
      <p>When you get a paycheck, what's your first thought? For many, it's about paying bills and then buying things they want. A new phone, a nice dinner, a car payment. Raising your lifestyle to match your income is the fastest way to stay poor.</p>
      
      <h3>The Investor Mentality</h3>
      <p>Investors look at money as a tool. Every dollar is a worker. When you spend a dollar, it's gone. When you invest a dollar, it can recruit more dollars for you. Over time, this army of dollars becomes your freedom.</p>
      
      <h3>Assets vs. Liabilities</h3>
      <p>Rich Dad Poor Dad taught us a simple rule: Assets put money in your pocket. Liabilities take money out of your pocket. Your house is often a liability (maintenance, tax, mortgage). A rental property is an asset. Stocks are assets.</p>
      
      <p>To shift your mindset, stop asking "Can I afford this?" and start asking "How can I buy an asset that will pay for this?"</p>
    `
    },
    {
        slug: "emergency-fund-basics",
        title: "Emergency Fund Basics: Your Financial Shield",
        author: "Bùi Đình Trí",
        date: "Jan 15, 2026",
        readTime: "7 min read",
        tags: ["Savings", "Security", "Basics"],
        coverImage: "/assets/journey/emergency-fund-basics.svg",
        content: `
      <p>Before you invest a single dime in the stock market, you need a shield. Life is unpredictable. Cars break down, jobs get lost, medical emergencies happen.</p>
      
      <h3>What is an Emergency Fund?</h3>
      <p>It's 3-6 months of essential living expenses kept in a high-yield savings account (HYSA). It is NOT for investment. It is for insurance.</p>
      
      <h3>Why 3-6 Months?</h3>
      <p>If you lose your job, it might take 3 months to find a new one. If the economy creates a recession, it might take 6. This fund prevents you from selling your investments at a loss when you need cash.</p>
      
      <h3>Where to Keep It</h3>
      <p>Don't keep it in your checking account where you might spend it. Don't put it in crypto. Put it in a separate HYSA where it earns interest but is safe and accessible.</p>
    `
    },
    {
        slug: "debt-avalanche-vs-snowball",
        title: "Debt Avalanche vs. Snowball: Crushing Debt",
        author: "Bùi Đình Trí",
        date: "Jan 20, 2026",
        readTime: "10 min read",
        tags: ["Debt", "Strategy", "Freedom"],
        coverImage: "/assets/journey/debt-avalanche-vs-snowball.svg",
        content: `
      <p>Debt is the biggest obstacle to wealth. But how do you tackle it? There are two main strategies, and the "best" one depends on your psychology.</p>
      
      <h3>The Debt Avalanche (Mathematically Superior)</h3>
      <p>You list your debts by <strong>Interest Rate</strong>, from highest to lowest. You pay minimums on everything, and throw every extra dollar at the highest interest debt.</p>
      <ul>
        <li><strong>Pros:</strong> You save the most money on interest. You get out of debt faster mathematically.</li>
        <li><strong>Cons:</strong> If your highest interest debt is huge, it might take months to see a "win", which can be discouraging.</li>
      </ul>
      
      <h3>The Debt Snowball (Psychologically Superior)</h3>
      <p>You list your debts by <strong>Balance</strong>, from smallest to largest. You ignore interest rates. You attack the smallest debt first.</p>
      <ul>
        <li><strong>Pros:</strong> You get quick wins. Eliminating a small debt feels amazing and builds momentum (the snowball effect).</li>
        <li><strong>Cons:</strong> You pay more in interest over time.</li>
      </ul>
      
      <h3>Which is right for you?</h3>
      <p>If you need motivation, do the Snowball. If you are disciplined and hate inefficiency, do the Avalanche.</p>
    `
    },
    {
        slug: "index-funds-etfs",
        title: "Index Funds & ETFs: The Lazy Path to Wealth",
        author: "Bùi Đình Trí",
        date: "Jan 25, 2026",
        readTime: "8 min read",
        tags: ["Investing", "Stocks", "Passive"],
        coverImage: "/assets/journey/index-funds-etfs.svg",
        content: `
      <p>Picking individual stocks is hard. Even professionals fail to beat the market consistently. So, why try?</p>
      
      <h3>If You Can't Beat Them, Join Them</h3>
      <p>An Index Fund (or ETF like VOO or VTI) buys a little bit of everything. When you buy the S&P 500, you are buying the 500 largest companies in America.</p>
      
      <h3>Why It Works</h3>
      <ul>
        <li><strong>Diversification:</strong> If one company goes bankrupt, you don't lose everything.</li>
        <li><strong>Self-Cleansing:</strong> Bad companies drop out of the index, good companies rise up. You always own the winners.</li>
        <li><strong>Low Fees:</strong> Active funds charge 1-2%. Index funds charge 0.03%. That difference is massive over 30 years.</li>
      </ul>
      
      <h3>The Strategy</h3>
      <p>Buy consistently (Dollar Cost Average), hold forever, and never sell in a panic. That's it.</p>
    `
    }
];
