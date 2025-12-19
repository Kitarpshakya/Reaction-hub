"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface Compound {
  _id: string;
  id: string;
  name: string;
  formula: string;
  molarMass: number;
  description?: string;
  createdByName: string;
  createdAt: string;
}

export default function CompoundsPage() {
  const { data: session } = useSession();
  const [compounds, setCompounds] = useState<Compound[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchCompounds();
  }, []);

  const fetchCompounds = async () => {
    try {
      const res = await fetch("/api/compounds");
      if (res.ok) {
        const data = await res.json();
        setCompounds(data.compounds || []);
      }
    } catch (error) {
      console.error("Error fetching compounds:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter compounds based on search query
  const filteredCompounds = compounds.filter((compound) => {
    const query = searchQuery.toLowerCase();
    return (
      compound.name.toLowerCase().includes(query) ||
      compound.formula.toLowerCase().includes(query) ||
      compound.description?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-linear-to-br from-[#0F0F1E] via-[#1A1A2E] to-[#0F0F1E]">
      <div className="container mx-auto px-4 py-6">
        {/* Header with Search and Create Button */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md w-full">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search compounds by name, formula, or description..."
                className="w-full px-4 py-3 pl-12 pr-10 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/50 focus:border-[#6C5CE7]/50 transition-all"
              />
              {/* Search Icon */}
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {/* Clear Button */}
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  aria-label="Clear search"
                >
                  <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            {/* Results count */}
            {searchQuery && (
              <p className="text-xs text-white/40 mt-2 ml-1">
                {filteredCompounds.length} {filteredCompounds.length === 1 ? "result" : "results"} found
              </p>
            )}
          </div>

          {/* Create Compound Button */}
          {session && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/compounds/create"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#6C5CE7] text-white rounded-xl font-semibold hover:bg-[#5B4CD6] transition-colors whitespace-nowrap"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
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
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-6 animate-pulse">
                <div className="h-6 bg-white/10 rounded mb-4"></div>
                <div className="h-4 bg-white/10 rounded mb-2"></div>
                <div className="h-4 bg-white/10 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : compounds.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-6">⚗️</div>
            <h2 className="text-2xl font-bold text-white mb-2">No compounds yet</h2>
            <p className="text-white/60 mb-6">Be the first to create a chemical compound!</p>
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
        ) : filteredCompounds.length === 0 ? (
          /* No search results */
          <div className="text-center py-20">
            <div className="text-6xl mb-6">🔍</div>
            <h2 className="text-2xl font-bold text-white mb-2">No compounds found</h2>
            <p className="text-white/60 mb-6">No compounds match your search for &quot;{searchQuery}&quot;</p>
            <button
              onClick={() => setSearchQuery("")}
              className="inline-block px-6 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-colors"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCompounds.map((compound, index) => (
              <Link key={compound.id} href={`/compounds/${compound.id}`}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.3) }}
                  className="group bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-[#6C5CE7]/50 transition-all cursor-pointer hover:shadow-lg hover:shadow-[#6C5CE7]/10 relative"
                >
                  <div className="p-6">
                    {/* Name */}
                    <h3 className="text-xl font-bold text-white mb-3 line-clamp-1 group-hover:text-[#6C5CE7] transition-colors">
                      {compound.name}
                    </h3>

                    {/* Chemical Formula - Highlighted */}
                    <div className="bg-[#6C5CE7]/10 border border-[#6C5CE7]/30 rounded-lg px-4 py-3 mb-4">
                      <p className="text-2xl font-mono font-bold text-[#6C5CE7] text-center tracking-wide">
                        {compound.formula}
                      </p>
                    </div>

                    {/* Properties Grid */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between py-2 border-b border-white/5">
                        <span className="text-white/40">Molar Mass</span>
                        <span className="text-white/80 font-medium">{compound.molarMass.toFixed(3)} g/mol</span>
                      </div>
                    </div>
                  </div>

                  {/* Hover Indicator */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#6C5CE7] to-[#A855F7] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </motion.div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
