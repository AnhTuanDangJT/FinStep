/**
 * Chat service - AI-style answers about finance careers, mentorship, and website features.
 * Stateless; predefined + contextual responses.
 */

export const askChat = async (question: string): Promise<string> => {
  const lower = question.toLowerCase().trim();

  // --- Finance careers ---
  if (lower.includes('career') || lower.includes('job') || lower.includes('work in finance') || lower.includes('finance career')) {
    return 'Finance careers span many paths: banking, asset management, fintech, corporate finance, and financial planning. Build strong analytical skills, get relevant certifications (CFA, CPA, or Series licenses as needed), and network actively. Internships and entry-level roles in analysis or operations are common starting points. FinStep can connect you with mentors who work in these areas.';
  }
  if (lower.includes('salary') || lower.includes('pay') || lower.includes('earn')) {
    return 'Compensation in finance varies by role and level. Analysts and associates at banks or funds often have base salary plus bonus. Financial planners and advisors may earn through fees and commissions. Research roles on Glassdoor or Payscale and talk to mentors in your target field for realistic expectations.';
  }
  if (lower.includes('cfa') || lower.includes('cpa') || lower.includes('certification')) {
    return 'CFA (Chartered Financial Analyst) is widely recognized for investment roles; CPA (Certified Public Accountant) for accounting and audit. Other useful credentials include CFP (financial planning), FRM (risk), and Series 7/66 for advisory. Choose based on your target career; many professionals combine experience with one or two key certifications.';
  }

  // --- Mentorship ---
  if (lower.includes('mentor') || lower.includes('mentorship') || lower.includes('find a mentor')) {
    return 'FinStep offers mentorship to help you navigate finance careers and personal finance. Use the Mentor section to explore topics and connect with experienced professionals. Come with specific questions and goals so your mentor can give targeted advice. Building a lasting mentor relationship takes consistency and follow-up.';
  }
  if (lower.includes('advice') || lower.includes('guidance') || lower.includes('help me')) {
    return 'We’re here to help with finance careers, money management, and using FinStep. Ask a specific question (e.g. “How do I start investing?” or “What’s the best way to find a mentor?”) and we’ll point you to resources and guidance. You can also browse our Community Finance Feed for articles and tips from other users.';
  }

  // --- Website features ---
  if (lower.includes('feature') || lower.includes('what can') || lower.includes('how does') || lower.includes('how do i') || lower.includes('use this')) {
    return 'FinStep lets you: (1) Read the Community Finance Feed — approved blog posts on finance and careers; (2) Write and submit your own posts (they go through moderation); (3) Like and comment on posts; (4) Use this chat for questions about finance careers, mentorship, and the site; (5) Connect with mentors. Create an account to write posts and interact with the community.';
  }
  if (lower.includes('blog') || lower.includes('post') || lower.includes('feed')) {
    return 'The Community Finance Feed is a public feed of approved blog posts. Anyone can read it. Logged-in users can submit posts (status: pending until an admin approves), like posts, and comment. Only approved posts appear in the feed. You can also see your own posts and their status in your dashboard.';
  }
  if (lower.includes('admin') || lower.includes('approve') || lower.includes('moderation')) {
    return 'Blog posts are moderated by admins. After you submit a post, it stays in “pending” until an admin approves or rejects it. Only approved posts show in the public Community Finance Feed. If you have admin access, you can manage users and approve or reject posts from the admin area.';
  }

  // --- General finance ---
  if (lower.includes('budget') || lower.includes('saving')) {
    return 'Creating a budget is the foundation of good financial planning. Start by tracking your income and expenses, then allocate funds to essential categories like housing, food, and savings. Aim to save at least 20% of your income when possible.';
  }
  if (lower.includes('investment') || lower.includes('invest')) {
    return 'Investing can help grow your wealth over time. Consider starting with low-risk options like index funds or ETFs. Diversify your portfolio and invest for the long term. Past performance does not guarantee future results.';
  }
  if (lower.includes('debt') || lower.includes('loan')) {
    return 'Managing debt effectively is crucial. Prioritize paying off high-interest debt first. Consider the debt snowball or avalanche method. Avoid taking on new debt unless necessary and always make at least minimum payments on time.';
  }
  if (lower.includes('credit') || lower.includes('score')) {
    return 'A good credit score opens doors to better interest rates and financial opportunities. Pay bills on time, keep credit utilization below 30%, and maintain a mix of credit types. Check your credit report regularly for errors.';
  }
  if (lower.includes('retirement') || lower.includes('pension')) {
    return 'Start saving for retirement as early as possible to take advantage of compound interest. Contribute to employer-sponsored retirement plans, especially if they offer matching. Aim to save 15-20% of your income for retirement when you can.';
  }

  return 'Thanks for your question. I can help with finance careers, mentorship, and how to use FinStep (blog feed, posting, comments). Ask something specific—e.g. “How do I find a mentor?” or “What can I do on this site?”—and I’ll give you a focused answer.';
};



