"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-gradient-to-br from-[#0F0F1E] via-[#1A1A2E] to-[#0F0F1E]">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">REACTION HUB</h1>
          <p className="text-xl md:text-2xl text-white/60 mb-12">Explore Chemistry Interactively</p>
        </motion.div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mt-16">
          {/* Periodic Table Card */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.1 }}>
            <Link href="/periodic-table" prefetch={true}>
              <div className="group bg-gradient-to-br from-[#6C5CE7]/20 to-[#4ECDC4]/20 border border-white/10 rounded-2xl p-8 h-full cursor-pointer hover:border-[#6C5CE7]/50 transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#6C5CE7]/20">
                <div className="text-6xl mb-6">🧪</div>
                <h2 className="text-3xl font-bold text-white mb-4">Periodic Table</h2>
                <p className="text-white/70 mb-6 text-lg">
                  Explore all 118 elements with interactive 3D visualizations and detailed information about each
                  element
                </p>
                <div className="inline-flex items-center text-[#6C5CE7] font-semibold group-hover:translate-x-1 transition-transform">
                  View Table
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Compounds Card */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.2 }}>
            <Link href="/compounds" prefetch={true}>
              <div className="group bg-gradient-to-br from-[#F38181]/20 to-[#FDCB6E]/20 border border-white/10 rounded-2xl p-8 h-full cursor-pointer hover:border-[#F38181]/50 transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#F38181]/20">
                <div className="text-6xl mb-6">⚗️</div>
                <h2 className="text-3xl font-bold text-white mb-4">Compounds</h2>
                <p className="text-white/70 mb-4 text-lg">Browse and create chemical compounds</p>
                <p className="text-white/50 text-sm mb-6 italic">Login required to create compounds</p>
                <div className="inline-flex items-center text-[#F38181] font-semibold group-hover:translate-x-1 transition-transform">
                  View Compounds
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 text-center text-white/40 text-sm border-t border-white/10 mt-16">
        <p>Reaction Hub • Built by Pratik Shakya</p>
      </footer>
    </div>
  );
}
