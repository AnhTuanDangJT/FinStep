import Image from "next/image"
import { cn } from "@/lib/utils"

export function Logo({ className, light = false }: { className?: string; light?: boolean }) {
    return (
        <div className={cn("flex items-center gap-2 font-bold text-2xl tracking-tight select-none", className)}>
            <div className={cn("relative flex items-center justify-center w-10 h-10 rounded-xl bg-white shadow-lg shadow-brand-primary/20", light && "shadow-none ring-2 ring-white/20")}>
                <Image
                    src="/FinstepLOGO.png"
                    alt="FinStep"
                    fill
                    sizes="40px"
                    className="object-contain p-1.5"
                />
            </div>
            <span className={cn("text-brand-text", light && "text-white")}>
                FinStep<span className="text-brand-primary">.</span>
            </span>
        </div>
    )
}
