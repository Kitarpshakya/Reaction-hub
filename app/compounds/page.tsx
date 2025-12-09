"use client"

import { useSession } from "next-auth/react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"

interface Compound {
  _id: string
  id: string
  name: string
  formula: string
  molarMass: number
  description?: string
  createdByName: string
  createdAt: string
}

export default function CompoundsPage() {
  const { data: session } = useSession()
  const [compounds, setCompounds] = useState<Compound[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCompounds()
  }, [])

  const fetchCompounds = async () => {
    try {
      const res = await fetch("/api/compounds")
      if (res.ok) {
        const data = await res.json()
        setCompounds(data.compounds || [])
      }
    } catch (error) {
      console.error("Error fetching compounds:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-gradient-to-br from-[#0F0F1E] via-[#1A1A2E] to-[#0F0F1E]">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <div className="mb-4">
              <Link
                href="/"
                className="inline-flex items-center text-white/60 hover:text-white transition-colors text-sm"
              >
                <svg
                  className="w-4 h-4 mr-2"
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
                Back to Home
              </Link>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
              Chemical Compounds
            </h1>
            <p className="text-white/60">
              Browse user-created chemical compounds
            </p>
          </div>

          {session && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/compounds/create"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#6C5CE7] text-white rounded-xl font-semibold hover:bg-[#5B4CD6] transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Create Compound
              </Link>
            </motion.div>
          )}
        </div>

        {/* Compounds Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white/5 border border-white/10 rounded-xl p-6 animate-pulse"
              >
                <div className="h-6 bg-white/10 rounded mb-4"></div>
                <div className="h-4 bg-white/10 rounded mb-2"></div>
                <div className="h-4 bg-white/10 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : compounds.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-6">⚗️</div>
            <h2 className="text-2xl font-bold text-white mb-2">
              No compounds yet
            </h2>
            <p className="text-white/60 mb-6">
              Be the first to create a chemical compound!
            </p>
            {session ? (
              <Link
                href="/compounds/create"
                className="inline-block px-6 py-3 bg-[#6C5CE7] text-white rounded-xl font-semibold hover:bg-[#5B4CD6] transition-colors"
              >
                Create Compound
              </Link>
            ) : (
              <Link
                href="/login?callbackUrl=/compounds"
                className="inline-block px-6 py-3 bg-[#6C5CE7] text-white rounded-xl font-semibold hover:bg-[#5B4CD6] transition-colors"
              >
                Sign in to Create
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {compounds.map((compound, index) => (
              <Link key={compound.id} href={`/compounds/${compound.id}`}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  whileHover={{ y: -4 }}
                  className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-[#6C5CE7]/50 transition-all cursor-pointer"
                >
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {compound.name}
                  </h3>
                  <p className="text-3xl font-mono text-[#6C5CE7] mb-4">
                    {compound.formula}
                  </p>
                  <div className="space-y-2 text-sm">
                    <p className="text-white/60">
                      <span className="text-white/40">Molar Mass:</span>{" "}
                      {compound.molarMass.toFixed(3)} g/mol
                    </p>
                    {compound.description && (
                      <p className="text-white/60 line-clamp-2">
                        {compound.description}
                      </p>
                    )}
                    <p className="text-white/40 text-xs pt-2 border-t border-white/10">
                      Created by {compound.createdByName}
                    </p>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
