"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fff9f4] p-4">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold text-brand-text mb-4">Reset Password</h1>
        <p className="text-brand-text/60 mb-6">
          Password reset is not yet available. Please contact support if you need assistance.
        </p>
        <Link href="/login">
          <Button>Back to Login</Button>
        </Link>
      </div>
    </div>
  )
}
