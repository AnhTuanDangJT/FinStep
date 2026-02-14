import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/** Font for user content (posts, comments) — full Vietnamese diacritic support so tone marks render correctly */
const interContent = Inter({
  variable: "--font-content",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FinStep - Career Growth Platform",
  description: "Climb the ladder with confidence.",
  icons: {
    icon: "/finstep-logo.png",
    apple: "/finstep-logo.png",
  },
};

/** Force dark color-scheme; ignore browser/OS preference */
export const viewport: Viewport = {
  colorScheme: "dark",
};

import { AuthProvider } from "@/context/AuthContext"

import { CinematicEntrance } from "@/components/ui/CinematicEntrance"
import { Toaster } from "sonner"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${interContent.variable} font-sans antialiased text-[var(--text-primary)] transition-colors duration-300`}
      >
        <AuthProvider>
          <CinematicEntrance />
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
