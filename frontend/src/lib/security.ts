import DOMPurify from "isomorphic-dompurify"

/**
 * Masks an email address to protect privacy.
 * Example: "johndoe@example.com" -> "joh***@example.com"
 */
export function maskEmail(email: string): string {
    if (!email || !email.includes("@")) return email

    const [local, domain] = email.split("@")
    if (local.length <= 3) {
        return `${local}***@${domain}`
    }

    return `${local.slice(0, 3)}***@${domain}`
}

/**
 * Sanitizes HTML content to prevent XSS attacks.
 * Uses strict configuration to strip dangerous tags and attributes.
 */
export function sanitizeHtml(html: string): string {
    if (!html) return ""

    return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: [
            "b", "i", "em", "strong", "u", "s", "a", "p", "div", "span",
            "ul", "ol", "li", "h1", "h2", "h3", "h4", "h5", "h6",
            "blockquote", "pre", "code", "img", "br", "hr",
            "table", "thead", "tbody", "tr", "th", "td"
        ],
        ALLOWED_ATTR: [
            "href", "target", "rel", "src", "alt", "class", "width", "height", "title"
        ],
        FORBID_TAGS: ["style", "script", "iframe", "object", "embed", "link"],
        FORBID_ATTR: ["style", "on*", "data-*"],
    })
}

/**
 * Checks if a URL is safe for navigation/redirection.
 * Prevents javascript: URI attacks.
 */
export function isSafeUrl(url: string): boolean {
    if (!url) return false
    const lower = url.toLowerCase().trim()
    return !lower.startsWith("javascript:") && !lower.startsWith("vbscript:") && !lower.startsWith("data:")
}
