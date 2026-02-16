export type ContentBlockType =
    | { type: 'header'; content: string; level: number }
    | { type: 'paragraph'; content: string }
    | { type: 'list'; items: string[] }

export function parseBlogContent(content: string): ContentBlockType[] {
    if (!content) return []

    const lines = content.split(/\n+/).filter(line => line.trim().length > 0)
    const blocks: ContentBlockType[] = []

    let currentListItems: string[] = []

    // Helper to flush current list if exists
    const flushList = () => {
        if (currentListItems.length > 0) {
            blocks.push({ type: 'list', items: [...currentListItems] })
            currentListItems = []
        }
    }

    lines.forEach((line) => {
        const trimmed = line.trim()

        // 1. Detect Headers (Lines starting with "1.", "2." etc AND short length, or purely numeric bullets that act as headers)
        // Heuristic: If it starts with number and is reasonably short (< 100 chars), treat as header section
        const headerMatch = trimmed.match(/^(\d+)\.\s+(.*)/)

        // 2. Detect Bullet Lists (Lines starting with "-", "*", "•")
        const listMatch = trimmed.match(/^[-*•]\s+(.*)/)

        if (headerMatch) {
            flushList()
            // If the content after number is very long, it might just be a numbered list item in a big paragraph. 
            // But user requested: "1. -> section title". Let's assume section titles are typically shorter.
            // However, the rule "Lines after that until next numbered section -> paragraph block" implies these are section dividers.
            blocks.push({ type: 'header', content: headerMatch[2], level: 2 })
        }
        else if (listMatch) {
            currentListItems.push(listMatch[1])
        }
        else {
            flushList()
            blocks.push({ type: 'paragraph', content: trimmed })
        }
    })

    flushList()
    return blocks
}
