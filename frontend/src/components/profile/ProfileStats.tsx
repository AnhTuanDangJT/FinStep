"use client"

import { FileText, Map, Heart, Calendar } from "lucide-react"

interface ProfileStatsProps {
    stats: {
        postsWritten: number
        journeysStarted: number
        totalLikes: number
        joinedAt: string
    }
}

export function ProfileStats({ stats }: ProfileStatsProps) {
    const items = [
        { label: "Posts Written", value: stats.postsWritten, icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10" },
        { label: "Journeys", value: stats.journeysStarted, icon: Map, color: "text-[var(--brand-primary)]", bg: "bg-[var(--brand-primary)]/10" },
        { label: "Total Likes", value: stats.totalLikes, icon: Heart, color: "text-red-500", bg: "bg-red-500/10" },
        { label: "Member Since", value: new Date(stats.joinedAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }), icon: Calendar, color: "text-purple-500", bg: "bg-purple-500/10" },
    ]

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {items.map((item) => (
                <div key={item.label} className="bg-[var(--black-surface)]/60 backdrop-blur-sm border border-[var(--border-soft)] p-4 rounded-2xl shadow-sm flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${item.bg} ${item.color}`}>
                        <item.icon className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-[var(--text-primary)]">{item.value}</div>
                        <div className="text-xs font-medium text-[var(--text-secondary)]/50 uppercase tracking-wide">{item.label}</div>
                    </div>
                </div>
            ))}
        </div>
    )
}
