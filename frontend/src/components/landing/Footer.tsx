"use client"

import Link from "next/link"
import { Facebook, Twitter, Instagram, Linkedin, Github, Mail, MapPin } from "lucide-react"
import { AnimatedLogo } from "@/components/ui/AnimatedLogo"

export function Footer() {
    return (
        <footer className="bg-[#0B1220] border-t border-white/5 relative z-10">
            <div className="container mx-auto px-4 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-16">
                    {/* Brand Column */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="flex items-center gap-2">
                            <div className="relative w-8 h-8">
                                {/* Using AnimatedLogo or Image here. Using simplified fallback for footer. */}
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-primary to-brand-accent flex items-center justify-center font-bold text-white text-lg">
                                    F
                                </div>
                            </div>
                            <span className="text-xl font-bold text-white tracking-tight">FINSTEP</span>
                        </div>
                        <p className="text-white/40 leading-relaxed max-w-sm">
                            Empowering the next generation of finance leaders with professional mentorship, real-world insights, and a community of excellence.
                        </p>
                        <div className="flex items-center gap-4 pt-2">
                            {[Twitter, Linkedin, Instagram, Github].map((Icon, i) => (
                                <Link
                                    key={i}
                                    href="#"
                                    className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-white/40 hover:text-brand-primary hover:bg-white/10 hover:border-brand-primary/20 transition-all"
                                >
                                    <Icon className="w-5 h-5" />
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Links Columns */}
                    <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-8">
                        {/* Column 1 */}
                        <div className="space-y-6">
                            <h4 className="text-white font-bold tracking-wider uppercase text-xs">Platform</h4>
                            <ul className="space-y-4">
                                <li><Link href="#mentors" className="text-white/40 hover:text-brand-primary transition-colors text-sm">Mentorship</Link></li>
                                <li><Link href="#features" className="text-white/40 hover:text-brand-primary transition-colors text-sm">Features</Link></li>
                                <li><Link href="/dashboard" className="text-white/40 hover:text-brand-primary transition-colors text-sm">Dashboard</Link></li>
                                <li><Link href="/blog" className="text-white/40 hover:text-brand-primary transition-colors text-sm">Blog</Link></li>
                            </ul>
                        </div>

                        {/* Column 2 */}
                        <div className="space-y-6">
                            <h4 className="text-white font-bold tracking-wider uppercase text-xs">Resources</h4>
                            <ul className="space-y-4">
                                <li><Link href="#" className="text-white/40 hover:text-brand-primary transition-colors text-sm">Community</Link></li>
                                <li><Link href="#" className="text-white/40 hover:text-brand-primary transition-colors text-sm">Success Stories</Link></li>
                                <li><Link href="#" className="text-white/40 hover:text-brand-primary transition-colors text-sm">Career Guide</Link></li>
                                <li><Link href="#" className="text-white/40 hover:text-brand-primary transition-colors text-sm">Newsletter</Link></li>
                            </ul>
                        </div>

                        {/* Column 3 */}
                        <div className="space-y-6">
                            <h4 className="text-white font-bold tracking-wider uppercase text-xs">Company</h4>
                            <ul className="space-y-4">
                                <li><Link href="#" className="text-white/40 hover:text-brand-primary transition-colors text-sm">About Us</Link></li>
                                <li><Link href="#" className="text-white/40 hover:text-brand-primary transition-colors text-sm">Careers</Link></li>
                                <li><Link href="#" className="text-white/40 hover:text-brand-primary transition-colors text-sm">Partnersboard</Link></li>
                                <li><Link href="#" className="text-white/40 hover:text-brand-primary transition-colors text-sm">Contact</Link></li>
                            </ul>
                        </div>

                        {/* Column 4 */}
                        <div className="space-y-6">
                            <h4 className="text-white font-bold tracking-wider uppercase text-xs">Legal</h4>
                            <ul className="space-y-4">
                                <li><Link href="/privacy" className="text-white/40 hover:text-brand-primary transition-colors text-sm">Privacy Policy</Link></li>
                                <li><Link href="/terms" className="text-white/40 hover:text-brand-primary transition-colors text-sm">Terms of Service</Link></li>
                                <li><Link href="#" className="text-white/40 hover:text-brand-primary transition-colors text-sm">Cookie Policy</Link></li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-white/30 text-sm">
                        © 2026 FinStep Inc. All rights reserved.
                    </p>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 text-white/30 text-sm">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span>Systems Operational</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}
