export default function PublicLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="force-light bg-[var(--bg-primary)] min-h-screen">
            {children}
        </div>
    )
}
