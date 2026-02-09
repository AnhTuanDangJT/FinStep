import { BLOG_POSTS } from "@/lib/blogData"
import { BlogReader } from "@/components/dashboard/BlogReader"
import { notFound } from "next/navigation"

export async function generateStaticParams() {
    return BLOG_POSTS.map((post) => ({
        slug: post.slug,
    }))
}

export default async function Page({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const slug = (await params).slug
    const post = BLOG_POSTS.find((p) => p.slug === slug)

    if (!post) {
        notFound()
    }

    return <BlogReader post={post} />
}
