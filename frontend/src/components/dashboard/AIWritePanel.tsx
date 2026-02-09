"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, Wand2, RefreshCw, Check, AlertCircle, Type } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AIWritePanelProps {
    content: string
    onApply: (newContent: string) => void
}

type AIAction = "grammar" | "clarity" | "rewrite" | "summary"

export function AIWritePanel({ content, onApply }: AIWritePanelProps) {
    const [loading, setLoading] = React.useState(false)
    const [suggestion, setSuggestion] = React.useState<string | null>(null)
    const [activeAction, setActiveAction] = React.useState<AIAction | null>(null)

    const handleAction = (action: AIAction) => {
        if (!content.trim()) return
        setActiveAction(action)
        setLoading(true)
        setSuggestion(null)

        // Mock AI Delay
        setTimeout(() => {
            setLoading(false)
            // Mock Response based on action
            let result = ""
            switch (action) {
                case "grammar":
                    result = content + "\n\n[AI: Fixed 3 grammar issues and improved punctuation.]"
                    break
                case "clarity":
                    result = "This is a clearer version of your text:\n\n" + content.split(" ").slice(0, 10).join(" ") + "..."
                    break
                case "rewrite":
                    result = "Here is a professional rewrite:\n\n" + content.toUpperCase() // Mock change
                    break
                case "summary":
                    result = "Summary: A blog post discussing financial strategies."
                    break
            }
            setSuggestion(result)
        }, 1500)
    }

    return (
        <div className="bg-gradient-to-b from-[var(--black-elevated)] to-[var(--black-surface)] backdrop-blur-xl border border-[var(--neon-purple)]/30 rounded-[2rem] p-6 shadow-[0_0_15px_rgba(167,139,250,0.1)] h-full flex flex-col">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-[var(--neon-purple)] to-purple-900 rounded-xl text-white shadow-lg shadow-[var(--neon-purple)]/20">
                    <Sparkles className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="font-bold text-[var(--text-primary)]">AI Companion</h3>
                    <p className="text-xs text-[var(--text-secondary)] opacity-70">Enhance your writing</p>
                </div>
            </div>

            <div className="space-y-3 mb-6">
                <p className="text-xs font-bold text-[var(--text-secondary)] opacity-40 uppercase tracking-widest pl-1">Actions</p>

                <div className="grid grid-cols-1 gap-2">
                    <Button
                        variant="outline"
                        onClick={() => handleAction("grammar")}
                        disabled={loading || !content}
                        className="justify-start gap-3 h-10 border-[var(--border-soft)] hover:bg-[var(--neon-purple)]/10 text-[var(--text-secondary)] hover:text-[var(--neon-purple)] hover:border-[var(--neon-purple)]/30"
                    >
                        <Check className="w-4 h-4 text-green-500" />
                        Fix Grammar
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => handleAction("clarity")}
                        disabled={loading || !content}
                        className="justify-start gap-3 h-10 border-[var(--border-soft)] hover:bg-[var(--neon-purple)]/10 text-[var(--text-secondary)] hover:text-[var(--neon-purple)] hover:border-[var(--neon-purple)]/30"
                    >
                        <Wand2 className="w-4 h-4 text-blue-500" />
                        Improve Clarity
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => handleAction("rewrite")}
                        disabled={loading || !content}
                        className="justify-start gap-3 h-10 border-[var(--border-soft)] hover:bg-[var(--neon-purple)]/10 text-[var(--text-secondary)] hover:text-[var(--neon-purple)] hover:border-[var(--neon-purple)]/30"
                    >
                        <RefreshCw className="w-4 h-4 text-purple-500" />
                        Rewrite Professional
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => handleAction("summary")}
                        disabled={loading || !content}
                        className="justify-start gap-3 h-10 border-[var(--border-soft)] hover:bg-[var(--neon-purple)]/10 text-[var(--text-secondary)] hover:text-[var(--neon-purple)] hover:border-[var(--neon-purple)]/30"
                    >
                        <Type className="w-4 h-4 text-orange-500" />
                        Generate Summary
                    </Button>
                </div>
            </div>

            {/* Results Area */}
            <div className="flex-1 bg-[var(--bg-surface)]/30 border border-[var(--border-soft)] rounded-xl p-4 overflow-y-auto min-h-[150px] transition-all relative">
                {loading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--text-secondary)] opacity-50 gap-3">
                        <Sparkles className="w-8 h-8 animate-pulse text-brand-primary" />
                        <span className="text-sm font-medium animate-pulse">Consulting AI...</span>
                    </div>
                ) : suggestion ? (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[var(--text-secondary)] opacity-40 uppercase">Suggestion</span>
                            <span className="text-[10px] px-2 py-0.5 bg-brand-primary/10 text-brand-primary rounded-full">
                                {activeAction}
                            </span>
                        </div>
                        <p className="text-sm text-[var(--text-primary)] opacity-80 whitespace-pre-wrap leading-relaxed">
                            {suggestion}
                        </p>
                        <Button
                            size="sm"
                            onClick={() => {
                                onApply(suggestion)
                                setSuggestion(null)
                            }}
                            className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white shadow-lg shadow-brand-primary/20"
                        >
                            Apply Changes
                        </Button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-[var(--text-secondary)] opacity-30 text-center gap-2">
                        <Bot className="w-8 h-8" />
                        <p className="text-sm">Select an action above to get AI assistance with your draft.</p>
                    </div>
                )}
            </div>

            <div className="mt-4 flex items-start gap-2 p-3 bg-blue-500/5 rounded-xl border border-blue-500/10">
                <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <p className="text-[10px] text-blue-400/80 leading-relaxed">
                    AI suggestions are generated for educational purposes. Please verify facts and review content before publishing.
                </p>
            </div>
        </div>
    )
}

function Bot(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 8V4H8" />
            <rect width="16" height="12" x="4" y="8" rx="2" />
            <path d="M2 14h2" />
            <path d="M20 14h2" />
            <path d="M15 13v2" />
            <path d="M9 13v2" />
        </svg>
    )
}
