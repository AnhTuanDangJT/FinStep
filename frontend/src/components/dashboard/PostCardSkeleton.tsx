import { Skeleton } from "@/components/ui/skeleton"

export function PostCardSkeleton() {
    return (
        <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-[1.5rem] shadow-sm overflow-hidden h-[320px] flex flex-col md:flex-row">
            <div className="flex-1 p-6 md:p-8 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="w-32 h-4" />
                            <Skeleton className="w-24 h-3" />
                        </div>
                    </div>
                    <Skeleton className="w-20 h-6 rounded-full" />
                </div>
                <div className="space-y-3 flex-1">
                    <Skeleton className="w-3/4 h-8" />
                    <Skeleton className="w-full h-4" />
                    <Skeleton className="w-full h-4" />
                    <Skeleton className="w-2/3 h-4" />
                </div>
                <div className="flex gap-4 border-t border-gray-100 pt-4">
                    <Skeleton className="w-20 h-8 rounded-full" />
                    <Skeleton className="w-24 h-8 rounded-full" />
                </div>
            </div>
            <div className="hidden md:block w-[40%] h-full">
                <Skeleton className="w-full h-full rounded-none" />
            </div>
        </div>
    )
}
