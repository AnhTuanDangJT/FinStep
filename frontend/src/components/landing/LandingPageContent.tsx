"use client"

import { useState, useEffect, useRef } from "react"
import { HeroSection } from "@/components/landing/HeroSection"
import { HowItWorksSection } from "@/components/landing/HowItWorksSection"
import { MentorSection } from "@/components/landing/MentorSection"
import { MentorshipProgramSection } from "@/components/landing/MentorshipProgramSection"
import { TrustSection } from "@/components/landing/TrustSection"
import { StorySection } from "@/components/landing/StorySection"
import { BlogFeatureSection } from "@/components/landing/BlogFeatureSection"
import { MouseSpotlight } from "@/components/ui/MouseSpotlight"
import { LandingBackground } from "@/components/landing/LandingBackground"
import { ChatPopup } from "@/components/landing/ChatPopup"
import { IntroOverlay } from "@/components/landing/IntroOverlay"
import { ScrollProgressSidebar } from "@/components/landing/ScrollProgressSidebar"
import { Footer } from "@/components/landing/Footer"
import { DoorButton } from "@/components/ui/DoorButton"
import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function LandingPageContent() {
  const [showIntro, setShowIntro] = useState(true)
  const [introFinished, setIntroFinished] = useState(false)
  const onFinishCalledRef = useRef(false)

  useEffect(() => {
    const introPlayed = sessionStorage.getItem("introPlayed")
    if (introPlayed === "true") {
      setShowIntro(false)
      setIntroFinished(true)
    }
  }, [])

  const handleIntroFinish = () => {
    if (onFinishCalledRef.current) return
    onFinishCalledRef.current = true
    setIntroFinished(true)
    setShowIntro(false)
    sessionStorage.setItem("introPlayed", "true")
  }

  return (
    <>
      {showIntro && !introFinished && (
        <IntroOverlay onFinish={handleIntroFinish} />
      )}
      <LandingBackground>
        <MouseSpotlight />
        <main className="min-h-screen">
          <ScrollProgressSidebar />
          <div id="hero">
            <HeroSection />
          </div>
          <div id="trust">
            <TrustSection />
          </div>
          <StorySection />
          <div id="features">
            <HowItWorksSection />
            <BlogFeatureSection />
          </div>
          <div id="mentors">
            <MentorSection />
            <MentorshipProgramSection />
          </div>
          <section id="join" className="py-40 bg-white relative overflow-hidden flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.5 }}
              className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-brand-primary/5 via-transparent to-transparent"
            />
            <div className="relative z-10 text-center space-y-12 max-w-4xl px-4">
              <div className="space-y-4">
                <motion.h2
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  className="text-5xl md:text-8xl font-bold text-[#2B1C14] tracking-tighter"
                >
                  Ready to <span className="text-[#FF7A00]">climb?</span>
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.8 }}
                  className="text-xl md:text-2xl text-[#2B1C14]/60 max-w-2xl mx-auto font-medium"
                >
                  Curious about the journey of finance? Your path to mastery starts right here.
                </motion.p>
              </div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="flex justify-center pt-8"
              >
                <div className="flex flex-col items-center gap-6">
                  <span className="text-sm font-bold uppercase tracking-[0.3em] text-[#FF7A00]/60">Step through the door</span>
                  <DoorButton href="/register" />
                </div>
              </motion.div>
            </div>
          </section>
          {introFinished && <ChatPopup />}
          <Footer />
        </main>
      </LandingBackground>
    </>
  )
}
