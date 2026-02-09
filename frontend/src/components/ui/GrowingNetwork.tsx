"use client"

import { motion } from "framer-motion"

interface GrowingNetworkProps {
    side: "left" | "right"
    color: string
}

export function GrowingNetwork({ side, color }: GrowingNetworkProps) {
    // Define nodes grid-like but with some randomness
    const nodes = side === "left" ? [
        { id: 1, x: 20, y: 280, delay: 0 },
        { id: 2, x: 60, y: 240, delay: 0.2 },
        { id: 3, x: 40, y: 200, delay: 0.4 },
        { id: 4, x: 80, y: 180, delay: 0.6 },
        { id: 5, x: 120, y: 220, delay: 0.8 },
        { id: 6, x: 100, y: 140, delay: 1.0 },
        { id: 7, x: 150, y: 100, delay: 1.2 },
        { id: 8, x: 180, y: 60, delay: 1.4 },
    ] : [
        { id: 1, x: 180, y: 280, delay: 0 },
        { id: 2, x: 140, y: 240, delay: 0.2 },
        { id: 3, x: 160, y: 200, delay: 0.4 },
        { id: 4, x: 120, y: 180, delay: 0.6 },
        { id: 5, x: 80, y: 220, delay: 0.8 },
        { id: 6, x: 100, y: 140, delay: 1.0 },
        { id: 7, x: 50, y: 100, delay: 1.2 },
        { id: 8, x: 20, y: 60, delay: 1.4 },
    ]

    // Define connections between close nodes
    const connections = [
        { from: 1, to: 2 },
        { from: 1, to: 3 },
        { from: 2, to: 3 },
        { from: 2, to: 4 },
        { from: 2, to: 5 },
        { from: 3, to: 4 },
        { from: 4, to: 5 },
        { from: 4, to: 6 },
        { from: 5, to: 6 },
        { from: 6, to: 7 },
        { from: 7, to: 8 },
        { from: 6, to: 8 }
    ]

    return (
        <svg viewBox="0 0 200 300" className="w-full h-full overflow-visible" style={{ color }}>
            {/* Draw Lines */}
            {connections.map((conn, i) => {
                const start = nodes.find(n => n.id === conn.from)
                const end = nodes.find(n => n.id === conn.to)
                if (!start || !end) return null

                return (
                    <motion.line
                        key={`line-${i}`}
                        x1={start.x}
                        y1={start.y}
                        x2={end.x}
                        y2={end.y}
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeOpacity="0.4"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 0.4 }}
                        transition={{
                            duration: 1.5,
                            delay: Math.max(start.delay, end.delay), // Wait for both nodes
                            ease: "easeInOut"
                        }}
                    />
                )
            })}

            {/* Draw Nodes */}
            {nodes.map((node) => (
                <motion.circle
                    key={`node-${node.id}`}
                    cx={node.x}
                    cy={node.y}
                    r="3"
                    fill="currentColor"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                        duration: 0.5,
                        delay: node.delay,
                        type: "spring",
                        stiffness: 200
                    }}
                >
                    {/* Pulse Effect on Node */}
                    <motion.circle
                        cx={0} // Relative to parent circle if nested? SVG circle cannot nest.
                    // Actually better to use a separate pulse circle
                    />
                </motion.circle>
            ))}

            {/* Pulse Rings for active nodes */}
            {nodes.map((node) => (
                <motion.circle
                    key={`pulse-${node.id}`}
                    cx={node.x}
                    cy={node.y}
                    r="3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    initial={{ scale: 1, opacity: 0.5 }}
                    animate={{ scale: 3, opacity: 0 }}
                    transition={{
                        duration: 2,
                        delay: node.delay + 0.5,
                        repeat: Infinity,
                        repeatDelay: 1
                    }}
                />
            ))}
        </svg>
    )
}
