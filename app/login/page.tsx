"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  useEffect(() => {
    if (session) {
      router.push(callbackUrl);
    }
  }, [session, router, callbackUrl]);

  if (status === "loading") {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] bg-linear-to-br from-[#0F0F1E] via-[#1A1A2E] to-[#0F0F1E] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#6C5CE7]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-linear-to-br from-[#0F0F1E] via-[#1A1A2E] to-[#0F0F1E] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        {/* Back Button */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-white/60 hover:text-white transition-colors text-sm">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>

        {/* Login Card */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 md:p-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">REACTION HUB</h1>
            <p className="text-white/60 text-lg">Sign in to continue</p>
          </div>

          <div className="space-y-4">
            {process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CONFIGURED === "true" ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => signIn("google", { callbackUrl })}
                className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 px-6 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign in with Google
              </motion.button>
            ) : (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6 text-center">
                <p className="text-yellow-400 font-semibold mb-2">⚠️ Google OAuth Not Configured</p>
                <p className="text-white/60 text-sm mb-4">
                  To enable authentication, please configure Google OAuth credentials in your .env file
                </p>
                <Link
                  href="/"
                  className="inline-block px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors text-sm"
                >
                  Go Back Home
                </Link>
              </div>
            )}
          </div>

          <p className="text-white/40 text-sm text-center mt-8">
            {process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CONFIGURED === "true"
              ? "Sign in to create and manage chemical compounds"
              : "See CLAUDE.md for setup instructions"}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
