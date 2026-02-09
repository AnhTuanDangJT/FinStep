"use client"

import * as React from "react"
import { BookOpen, Search, SlidersHorizontal, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"

interface FiltersBarProps {
    search: string
    onSearchChange: (value: string) => void
    category: string
    onCategoryChange: (value: string) => void
    sort: string
    onSortChange: (value: string) => void
}

const CATEGORIES = [
    { id: "Investing", label: "Investing" },
    { id: "Saving", label: "Saving" },
    { id: "Career", label: "Career" },
    { id: "Budgeting", label: "Budgeting" },
    { id: "Tech", label: "Tech" },
    { id: "Mindset", label: "Mindset" },
    { id: "Life", label: "Life" },
]

export function FiltersBar({
    search,
    onSearchChange,
    category,
    onCategoryChange,
    sort,
    onSortChange,
}: FiltersBarProps) {
    const [isExpanded, setIsExpanded] = React.useState(false)

    const dropdownRef = React.useRef<HTMLDivElement>(null)

    // Close dropdown when clicking outside
    React.useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsExpanded(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [])

    // Clear all filters
    const handleClear = () => {
        onSearchChange("")
        onCategoryChange("")
        onSortChange("newest")
    }

    const hasActiveFilters = search || category || sort !== "newest"

    return (
        <div className="w-full max-w-4xl mx-auto mb-10 space-y-4">
            {/* Search & Sort Row */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text/40 group-focus-within:text-brand-primary transition-colors">
                        <Search className="w-5 h-5" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by title..."
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-[var(--bg-surface)]/60 backdrop-blur-md border border-[var(--border-soft)] text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition-all shadow-sm hover:shadow-md"
                    />
                    {search && (
                        <button
                            onClick={() => onSearchChange("")}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-text/40 hover:text-brand-text dark:text-gray-500 dark:hover:text-white"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                <div className="flex gap-2">
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="h-full px-6 py-4 rounded-2xl bg-[var(--bg-surface)]/60 backdrop-blur-md border border-[var(--border-soft)] text-[var(--text-primary)] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 cursor-pointer hover:bg-[var(--bg-elevated)] transition-colors flex items-center gap-3 min-w-[180px] justify-between group"
                        >
                            <span>
                                {sort === "newest" && "Newest First"}
                                {sort === "popular" && "Most Popular"}
                                {sort === "oldest" && "Oldest First"}
                            </span>
                            <SlidersHorizontal className="w-4 h-4 text-brand-text/40 group-hover:text-brand-primary transition-colors" />
                        </button>

                        <AnimatePresence>
                            {isExpanded && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute top-full right-0 mt-2 w-full bg-[var(--bg-surface)]/90 border border-[var(--border-soft)] rounded-2xl shadow-xl overflow-hidden z-50 backdrop-blur-md"
                                >
                                    <div className="p-2 space-y-1">
                                        {[
                                            { value: "newest", label: "Newest First" },
                                            { value: "popular", label: "Most Popular" },
                                            { value: "oldest", label: "Oldest First" }
                                        ].map((option) => (
                                            <button
                                                key={option.value}
                                                onClick={() => {
                                                    onSortChange(option.value)
                                                    setIsExpanded(false)
                                                }}
                                                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${sort === option.value
                                                    ? "bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]"
                                                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                                                    }`}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Tags Row */}
            <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-text/40 dark:text-gray-500 mr-2">
                    Filter by:
                </span>
                <button
                    onClick={() => onCategoryChange("")}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border ${!category
                        ? "bg-[var(--brand-primary)] text-[#070B14] border-[var(--brand-primary)] font-bold shadow-[0_0_10px_rgba(255,183,3,0.3)]"
                        : "bg-transparent text-[var(--text-secondary)] border-transparent hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
                        }`}
                >
                    All
                </button>
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => onCategoryChange(category === cat.id ? "" : cat.id)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border ${category === cat.id
                            ? "bg-[var(--brand-primary)] text-[#070B14] border-[var(--brand-primary)] shadow-[0_0_10px_rgba(255,183,3,0.3)] font-bold"
                            : "bg-[var(--bg-surface)]/40 text-[var(--text-secondary)] border-[var(--border-soft)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] hover:border-[var(--brand-primary)]/30"
                            }`}
                    >
                        {cat.label}
                    </button>
                ))}

                {hasActiveFilters && (
                    <button
                        onClick={handleClear}
                        className="ml-auto text-xs font-medium text-red-500 hover:text-red-600 flex items-center gap-1"
                    >
                        <X className="w-3 h-3" /> Clear Filters
                    </button>
                )}
            </div>
        </div>
    )
}
