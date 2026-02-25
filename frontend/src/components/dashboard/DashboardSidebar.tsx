"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  BookOpen,
  PenTool,
  User,
  ShieldAlert,
  Menu,
  X,
  Sparkles,
  Map,
  UserCheck
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ROUTES } from "@/lib/routes"

export type DashboardView =
  | "readBlogs"
  | "writeBlog"
  | "myBlogs"
  | "profile"
  | "admin"
  | "timeline"
  | "mentor"

interface DashboardSidebarProps {
  activeView: DashboardView
  onViewChange: (view: DashboardView) => void
  isAdmin?: boolean
}

export function DashboardSidebar({
  activeView,
  onViewChange,
  isAdmin = false,
}: DashboardSidebarProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const router = useRouter()

  const items = [
    {
      id: "readBlogs",
      label: "Read Blogs",
      icon: BookOpen,
      adminOnly: false,
    },
    {
      id: "writeBlog",
      label: "Write a Blog",
      icon: PenTool,
      adminOnly: false,
    },
    {
      id: "myBlogs",
      label: "My Blogs",
      icon: BookOpen,
      adminOnly: false,
    },
    {
      id: "profile",
      label: "My Profile",
      icon: User,
      adminOnly: false,
    },
    {
      id: "timeline",
      label: "My Journey",
      icon: Map,
      adminOnly: false,
    },
    {
      id: "mentor",
      label: "Connect to Mentor",
      subLabel: "Bùi Đình Trí",
      icon: UserCheck,
      adminOnly: false,
      routeLink: ROUTES.MENTOR,
      className: "text-[var(--brand-accent)] font-semibold bg-[var(--brand-accent)]/10 hover:bg-[var(--brand-accent)]/20 border border-[var(--brand-accent)]/20 hover:shadow-[0_0_10px_rgba(34,211,238,0.2)]",
    },
    {
      id: "admin",
      label: "Admin Panel",
      icon: ShieldAlert,
      adminOnly: true,
      className: "text-red-500 hover:text-red-600 hover:bg-red-50",
    },
  ]

  const filteredItems = React.useMemo(
    () => items.filter((item) => (item.adminOnly ? isAdmin : true)),
    [isAdmin]
  )

  return (
    <>
      {/* --- DESKTOP SIDEBAR --- */}
      <div className="hidden lg:flex flex-col w-64 bg-[var(--bg-elevated)]/95 backdrop-blur-xl border-r border-[var(--border-soft)] h-full sticky top-0">
        <div className="flex flex-col h-full p-4">
          <div className="mb-8 px-4 pt-4">
            <h2 className="text-xs font-bold text-[var(--text-secondary)] opacity-60 uppercase tracking-widest mb-1">
              Menu
            </h2>
          </div>

          <nav className="flex-1 space-y-2">
            {filteredItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  // @ts-ignore - internal route: navigate to /mentor
                  if (item.routeLink) {
                    // @ts-ignore
                    router.push(item.routeLink)
                    return
                  }
                  onViewChange(item.id as DashboardView)
                }}
                className={cn(
                  "relative w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-colors duration-150 group overflow-hidden text-left",
                  activeView === item.id
                    ? "bg-[var(--bg-surface)] shadow-[0_0_15px_rgba(255,183,3,0.1)] text-[var(--brand-primary)] font-medium border border-[var(--brand-primary)]/20"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]/50",
                  // @ts-ignore
                  item.className
                )}
              >
                {activeView === item.id && (
                  <div className="absolute left-0 top-3 bottom-3 w-1 bg-brand-primary rounded-r-full" />
                )}

                <item.icon
                  className={cn(
                    "w-5 h-5 shrink-0",
                    activeView === item.id ? "text-[var(--brand-primary)] drop-shadow-[0_0_8px_rgba(255,183,3,0.5)]" : "text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]"
                  )}
                />
                <span className="relative z-10 flex flex-col items-start">
                  <span>{item.label}</span>
                  {/* @ts-ignore */}
                  {item.subLabel && (
                    <span className="text-[10px] font-normal opacity-70">
                      {/* @ts-ignore */}
                      {item.subLabel}
                    </span>
                  )}
                </span>

                {activeView === item.id && (
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-brand-primary/5 to-transparent -z-10 opacity-50"
                  />
                )}
              </button>
            ))}
          </nav>

          {/* Bottom Decoration */}
          <div className="p-4 mt-auto space-y-4">
            <div className="bg-[var(--bg-surface)]/40 p-4 rounded-2xl border border-[var(--border-soft)]">
              <div className="flex items-center gap-2 mb-2 text-brand-primary/80">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wide">Pro Tip</span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Consistency is key. Write a little every day to build your portfolio.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* --- MOBILE BOTTOM NAVIGATION --- */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--bg-elevated)]/95 backdrop-blur-xl border-t border-[var(--border-soft)] pb-safe pb-2 pt-2 px-2 sm:px-6 shadow-[0_-10px_40px_rgba(0,0,0,0.2)]">
        <div className="flex items-center justify-around">
          {filteredItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  // @ts-ignore - internal route: navigate to /mentor
                  if (item.routeLink) {
                    // @ts-ignore
                    router.push(item.routeLink)
                    return
                  }
                  onViewChange(item.id as DashboardView)
                }}
                className={cn(
                  "relative flex flex-col items-center justify-center w-16 h-14 rounded-2xl transition-all duration-300",
                  isActive
                    ? "text-[var(--brand-primary)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]/50",
                  // @ts-ignore
                  item.className && item.id !== 'mentor' && item.id !== 'admin' ? "" : (item.id === 'mentor' ? "text-[var(--brand-accent)]" : item.id === 'admin' ? "text-red-500" : "")
                )}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-primary/20 via-brand-primary/5 to-transparent rounded-2xl opacity-50 border-b-2 border-brand-primary" />
                )}

                <item.icon
                  className={cn(
                    "w-6 h-6 mb-1 transition-transform duration-300 relative z-10",
                    isActive ? "scale-110 drop-shadow-[0_0_8px_rgba(255,183,3,0.5)]" : ""
                  )}
                />

                <span className={cn(
                  "text-[10px] font-semibold tracking-wide relative z-10 transition-all duration-300",
                  isActive ? "opacity-100" : "opacity-70"
                )}>
                  {/* Abbreviate long labels for mobile tab bar */}
                  {item.id === 'readBlogs' ? 'Feed'
                    : item.id === 'writeBlog' ? 'Write'
                      : item.id === 'myBlogs' ? 'My Blogs'
                        : item.id === 'profile' ? 'Profile'
                          : item.id === 'timeline' ? 'Journey'
                            : item.id === 'mentor' ? 'Mentor'
                              : item.id === 'admin' ? 'Admin'
                                : item.label}
                </span>
              </button>
            )
          })}
        </div>
      </nav>
    </>
  )
}
