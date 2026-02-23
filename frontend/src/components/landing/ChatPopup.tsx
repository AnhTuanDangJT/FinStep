"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bot, X, Send, Sparkles, ChevronRight, MessageSquare, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/context/AuthContext"

interface Message {
    id: string
    role: "user" | "assistant"
    text: string
}

const QUICK_REPLIES = [
    "Budgeting Basics",
    "How to Invest",
    "Career Guidance",
    "Find a Mentor",
]

export function ChatPopup() {
    const { user } = useAuth()
    const [isOpen, setIsOpen] = React.useState(false)
    const [messages, setMessages] = React.useState<Message[]>([
        {
            id: "welcome",
            role: "assistant",
            text: "What kind of career guidance do you need in the field of finance? Or are you looking for a mentor?"
        }
    ])
    const [input, setInput] = React.useState("")
    const [isTyping, setIsTyping] = React.useState(false)
    const messagesEndRef = React.useRef<HTMLDivElement>(null)
    const quickRepliesRef = React.useRef<HTMLDivElement>(null)

    const scrollQuickReplies = (direction: 'left' | 'right') => {
        if (quickRepliesRef.current) {
            const scrollAmount = 200
            quickRepliesRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            })
        }
    }

    // Scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    React.useEffect(() => {
        scrollToBottom()
    }, [messages, isOpen])

    React.useEffect(() => {
        const timer = setTimeout(() => setIsOpen(true), 2500)
        return () => clearTimeout(timer)
    }, [])

    const handleSend = async (text: string = input) => {
        if (!text.trim()) return

        const userMsg: Message = { id: Date.now().toString(), role: "user", text }
        setMessages(prev => [...prev, userMsg])
        setInput("")
        setIsTyping(true)

        try {
            // Mock API Call - Replace with real /api/ai call
            await new Promise(resolve => setTimeout(resolve, 1500))

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                text: "That's a great question! I'm designed to help you navigate your financial journey. To get specific advice, try exploring our 'Journeys' section or ask me about specific topics like 'Compound Interest'."
            }
            setMessages(prev => [...prev, aiMsg])
        } catch (error) {
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                text: "I'm currently experiencing connection issues. Please try again later."
            }
            setMessages(prev => [...prev, errorMsg])
        } finally {
            setIsTyping(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleSend()
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="mb-4 w-[350px] md:w-[400px] h-[500px] bg-[var(--bg-surface)] border border-[var(--border-soft)] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-brand-primary to-orange-400 p-4 flex items-center justify-between text-white">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-full">
                                    <Bot className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">FinStep Assistant</h3>
                                    <p className="text-xs text-white/80 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                                        Online
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[var(--bg-elevated)]/30 custom-scrollbar">
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                    {msg.role === "assistant" && (
                                        <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center mr-2 flex-shrink-0">
                                            <Sparkles className="w-4 h-4 text-brand-primary" />
                                        </div>
                                    )}
                                    <div
                                        className={`max-w-[80%] p-3 text-sm leading-relaxed shadow-sm
                                        ${msg.role === "user"
                                                ? "bg-brand-primary text-white rounded-2xl rounded-tr-sm"
                                                : "bg-[var(--bg-surface)] border border-[var(--border-soft)] text-[var(--text-primary)] rounded-2xl rounded-tl-sm"
                                            }`}
                                    >
                                        {msg.text}
                                    </div>
                                </div>
                            ))}

                            {/* Typing Indicator */}
                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center mr-2">
                                        <Bot className="w-4 h-4 text-brand-primary" />
                                    </div>
                                    <div className="bg-[var(--bg-surface)] border border-[var(--border-soft)] p-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-[var(--text-disabled)] rounded-full animate-bounce [animation-delay:-0.3s]" />
                                        <span className="w-1.5 h-1.5 bg-[var(--text-disabled)] rounded-full animate-bounce [animation-delay:-0.15s]" />
                                        <span className="w-1.5 h-1.5 bg-[var(--text-disabled)] rounded-full animate-bounce" />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Quick Replies & Input */}
                        <div className="p-4 bg-[var(--bg-surface)] border-t border-[var(--border-soft)]">
                            {/* Chips - Only show if last message was from assistant */}
                            {!isTyping && messages[messages.length - 1]?.role === "assistant" && (
                                <div className="relative group/scroll">
                                    <button
                                        onClick={() => scrollQuickReplies('left')}
                                        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1 bg-[var(--bg-surface)]/90 border border-[var(--border-soft)] rounded-full text-[var(--text-secondary)] hover:text-[var(--brand-primary)] hover:bg-[var(--bg-elevated)] opacity-0 group-hover/scroll:opacity-100 transition-opacity shadow-sm disabled:opacity-0"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>

                                    <div
                                        ref={quickRepliesRef}
                                        className="flex gap-2 overflow-x-auto pb-3 no-scrollbar mask-fade-right scroll-smooth px-1"
                                    >
                                        {QUICK_REPLIES.map(reply => (
                                            <button
                                                key={reply}
                                                onClick={() => handleSend(reply)}
                                                className="whitespace-nowrap flex-shrink-0 px-3 py-1.5 bg-[var(--bg-elevated)] hover:bg-brand-primary/10 hover:text-brand-primary border border-[var(--border-soft)] hover:border-brand-primary/30 rounded-full text-xs font-medium transition-colors text-[var(--text-secondary)]"
                                            >
                                                {reply}
                                            </button>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => scrollQuickReplies('right')}
                                        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1 bg-[var(--bg-surface)]/90 border border-[var(--border-soft)] rounded-full text-[var(--text-secondary)] hover:text-[var(--brand-primary)] hover:bg-[var(--bg-elevated)] opacity-0 group-hover/scroll:opacity-100 transition-opacity shadow-sm"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            )}

                            <div className="flex items-center gap-2">
                                <Input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Ask about finance..."
                                    className="rounded-full border-[var(--border-soft)] focus-visible:ring-brand-primary bg-[var(--bg-elevated)] text-[var(--text-primary)]"
                                />
                                <Button
                                    size="icon"
                                    onClick={() => handleSend()}
                                    disabled={!input.trim() || isTyping}
                                    className="rounded-full bg-brand-primary hover:bg-brand-primary/90 text-white shrink-0 shadow-lg shadow-brand-primary/20"
                                >
                                    <Send className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="group relative flex items-center justify-center w-14 h-14 bg-brand-primary/90 hover:bg-brand-primary text-white rounded-full shadow-lg shadow-brand-primary/30 transition-transform"
            >
                <span className="absolute right-full mr-3 bg-gray-900 text-white text-xs font-medium px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    FinStep Assistant
                </span>
                <AnimatePresence mode="wait">
                    {isOpen ? (
                        <motion.div
                            key="close"
                            initial={{ rotate: -90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: 90, opacity: 0 }}
                        >
                            <ChevronRight className="w-6 h-6 rotate-90" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="open"
                            initial={{ rotate: 90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: -90, opacity: 0 }}
                        >
                            <MessageSquare className="w-6 h-6 fill-white/20" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.button>
        </div>
    )
}
