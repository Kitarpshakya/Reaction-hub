"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export default function Header() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [showDropdown, setShowDropdown] = useState(false);

  // Determine page type and header content
  const getPageInfo = () => {
    if (pathname === "/periodic-table") {
      return { showBack: true, backUrl: "/", title: "Periodic Table" };
    }
    if (pathname === "/compounds/create") {
      return { showBack: true, backUrl: "/compounds", title: "Create Compound" };
    }
    if (pathname?.match(/^\/compounds\/[^/]+\/edit$/)) {
      return { showBack: true, backUrl: "/compounds", title: "Edit Compound" };
    }
    if (pathname?.match(/^\/compounds\/[^/]+$/)) {
      return { showBack: true, backUrl: "/compounds", title: "Compound Details" };
    }
    if (pathname === "/compounds") {
      return { showBack: true, backUrl: "/", title: "Chemical Compounds" };
    }
    return { showBack: false, backUrl: "/", title: "" };
  };

  const pageInfo = getPageInfo();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0F0F1E]/80 backdrop-blur-md border-b border-white/10">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Logo/Title or Back Button + Page Title */}
          <div className="flex items-center gap-4">
            {pageInfo.showBack ? (
              <>
                {/* Back Button */}
                <Link
                  href={pageInfo.backUrl}
                  className="inline-flex items-center text-white/60 hover:text-white transition-colors group"
                >
                  <svg
                    className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  <span className="text-sm font-medium">Back</span>
                </Link>

                {/* Divider */}
                <div className="h-6 w-px bg-white/10" />

                {/* Page Title */}
                <h1 className="text-xl font-bold text-white">{pageInfo.title}</h1>
              </>
            ) : (
              /* Logo on Home page */
              <Link href="/" className="text-xl font-bold text-white hover:text-[#6C5CE7] transition-colors">
                REACTION HUB
              </Link>
            )}
          </div>

          {/* Auth Section */}
          <div className="flex items-center gap-4">
            {status === "loading" ? (
              <div className="w-20 h-10 bg-white/10 rounded animate-pulse" />
            ) : session ? (
              <div className="relative">
                {/* Profile Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 px-2.5 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-all border border-white/10 hover:border-white/20"
                >
                  {session.user?.image && (
                    <img
                      src={session.user.image}
                      alt={session.user.name || "User"}
                      className="w-7 h-7 rounded-full ring-2 ring-white/20"
                    />
                  )}
                  <span className="text-white/90 text-sm font-medium hidden sm:block">{session.user?.name}</span>
                  <svg
                    className={`w-4 h-4 text-white/60 transition-transform ${showDropdown ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </motion.button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {showDropdown && (
                    <>
                      {/* Backdrop to close dropdown */}
                      <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />

                      {/* Dropdown Content */}
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-64 bg-[#1A1A2E] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50"
                      >
                        {/* User Info */}
                        <div className="px-4 py-3 border-b border-white/10 bg-white/5">
                          <div className="flex items-center gap-3">
                            {session.user?.image && (
                              <img
                                src={session.user.image}
                                alt={session.user.name || "User"}
                                className="w-12 h-12 rounded-full ring-2 ring-white/20"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-semibold truncate">{session.user?.name}</p>
                              <p className="text-white/60 text-sm truncate">{session.user?.email}</p>
                            </div>
                          </div>
                        </div>

                        {/* Menu Items */}
                        <div className="py-2">
                          <Link
                            href="/profile"
                            onClick={() => setShowDropdown(false)}
                            className="w-full px-4 py-2.5 text-white/80 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-3"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                            <span className="font-medium">My Profile</span>
                          </Link>
                          <button
                            onClick={() => {
                              setShowDropdown(false);
                              signOut({ callbackUrl: "/" });
                            }}
                            className="w-full px-4 py-2.5 text-left text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-3"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                              />
                            </svg>
                            <span className="font-medium">Sign Out</span>
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link href="/login?callbackUrl=/">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-5 py-1.5 bg-[#6C5CE7] text-white rounded-lg hover:bg-[#5B4CD6] transition-colors font-medium text-sm"
                >
                  Login
                </motion.button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
