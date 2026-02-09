"use client";

import { useTheme } from "@/lib/ThemeContext";
import { Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";

export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="relative p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            aria-label="Toggle Theme"
        >
            <div className="relative w-6 h-6 flex items-center justify-center">
                <motion.div
                    initial={false}
                    animate={{
                        rotate: theme === "dark" ? 0 : 180,
                        scale: theme === "dark" ? 0 : 1,
                        opacity: theme === "dark" ? 0 : 1,
                    }}
                    transition={{ duration: 0.3 }}
                    className="absolute"
                >
                    <Sun className="w-6 h-6 text-[var(--neon-amber)] drop-shadow-[0_0_8px_rgba(255,183,3,0.8)]" />
                </motion.div>

                <motion.div
                    initial={false}
                    animate={{
                        rotate: theme === "dark" ? 0 : -180,
                        scale: theme === "dark" ? 1 : 0,
                        opacity: theme === "dark" ? 1 : 0,
                    }}
                    transition={{ duration: 0.3 }}
                    className="absolute"
                >
                    <Moon className="w-6 h-6 text-[var(--neon-cyan)] drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                </motion.div>
            </div>
        </button>
    );
}
