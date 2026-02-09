"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Megaphone, X } from "lucide-react"
import { apiClient } from "@/lib/api-client"

interface Announcement {
    id: string
    title: string
    message: string
    createdAt: string
}

export function SystemAnnouncement() {
    const [announcement, setAnnouncement] = React.useState<Announcement | null>(null)
    const [isVisible, setIsVisible] = React.useState(false)

    React.useEffect(() => {
        async function checkAnnouncement() {
            try {
                const latest = await apiClient.getLatestAnnouncement()
                if (latest) {
                    const dismissedId = localStorage.getItem("finstep_announcement_dismissed")
                    if (dismissedId !== latest.id) {
                        setAnnouncement(latest)
                        setIsVisible(true)
                    }
                }
            } catch (error) {
                console.error("Failed to fetch announcement", error)
            }
        }
        checkAnnouncement()
    }, [])

    const handleDismiss = () => {
        if (announcement) {
            localStorage.setItem("finstep_announcement_dismissed", announcement.id)
            setIsVisible(false)
        }
    }

    return (
        <AnimatePresence>
            {isVisible && announcement && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="relative z-50 bg-gradient-to-r from-indigo-600 to-purple-600 text-white overflow-hidden"
                >
                    <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <span className="flex p-2 rounded-lg bg-white/10">
                                    <Megaphone className="h-5 w-5 text-white" aria-hidden="true" />
                                </span>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 min-w-0">
                                    <span className="font-bold whitespace-nowrap">{announcement.title}</span>
                                    <span className="hidden sm:inline w-px h-4 bg-white/30" />
                                    <span className="text-sm font-medium text-white/90 truncate">
                                        {announcement.message}
                                    </span>
                                </div>
                            </div>

                            <div className="flex-shrink-0 order-2 sm:order-3 sm:ml-3">
                                <button
                                    type="button"
                                    onClick={handleDismiss}
                                    className="-mr-1 flex p-2 rounded-md hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white sm:-mr-2 transition-colors"
                                >
                                    <span className="sr-only">Dismiss</span>
                                    <X className="h-5 w-5 text-white" aria-hidden="true" />
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
