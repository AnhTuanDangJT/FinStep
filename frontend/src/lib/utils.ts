import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extracts all image URLs from a content string (HTML or Markdown).
 * Returns an array of unique URLs.
 */
export function extractImagesFromContent(content: string): string[] {
  if (!content) return []

  const images: string[] = []

  // 1. Match HTML <img> tags
  // Regex for src attribute, handling single/double quotes
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/g
  let match
  while ((match = imgRegex.exec(content)) !== null) {
    if (match[1]) images.push(match[1])
  }

  // 2. Match Markdown images ![alt](url)
  const mdRegex = /!\[.*?\]\((.*?)\)/g
  while ((match = mdRegex.exec(content)) !== null) {
    if (match[1]) {
      // Handle potential title part in markdown link: url "title"
      const url = match[1].split(' ')[0]
      if (url) images.push(url)
    }
  }

  // Deduplicate
  return Array.from(new Set(images))
}
