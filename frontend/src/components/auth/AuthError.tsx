import { AlertCircle } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface AuthErrorProps {
    message: string
}

export function AuthError({ message }: AuthErrorProps) {
    if (!message) return null

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 rounded-lg bg-red-50 border border-red-100 flex items-start gap-3 w-full mb-4"
        >
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{message}</p>
        </motion.div>
    )
}
