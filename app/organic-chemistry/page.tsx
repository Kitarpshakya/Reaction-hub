"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { OrganicStructure } from "@/lib/types/organic";

export default function OrganicChemistryPage() {
  const { data: session } = useSession();
  const [structures, setStructures] = useState<OrganicStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    fetchStructures();
  }, [selectedCategory]);

  const fetchStructures = async () => {
    try {
      const url =
        selectedCategory === "all" ? "/api/organic-structures" : `/api/organic-structures?category=${selectedCategory}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setStructures(data.structures || []);
      }
    } catch (error) {
      console.error("Error fetching organic structures:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter structures based on search query
  const filteredStructures = structures.filter((structure) => {
    const query = searchQuery.toLowerCase();
    return (
      structure.name.toLowerCase().includes(query) ||
      structure.commonName?.toLowerCase().includes(query) ||
      structure.iupacName?.toLowerCase().includes(query) ||
      structure.molecularFormula.toLowerCase().includes(query) ||
      structure.smiles.toLowerCase().includes(query)
    );
  });

  // Category options
  const categories = [
    { value: "all", label: "All Categories" },
    { value: "alkane", label: "Alkanes" },
    { value: "alkene", label: "Alkenes" },
    { value: "alkyne", label: "Alkynes" },
    { value: "aromatic", label: "Aromatic" },
    { value: "alcohol", label: "Alcohols" },
    { value: "aldehyde", label: "Aldehydes" },
    { value: "ketone", label: "Ketones" },
    { value: "carboxylic-acid", label: "Carboxylic Acids" },
    { value: "ester", label: "Esters" },
    { value: "ether", label: "Ethers" },
    { value: "amine", label: "Amines" },
    { value: "amide", label: "Amides" },
    { value: "halide", label: "Halides" },
  ];

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-linear-to-br from-[#0F0F1E] via-[#1A1A2E] to-[#0F0F1E]">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        {/* Filters and Controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md w-full">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, formula, or SMILES..."
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
                {filteredStructures.length} {filteredStructures.length === 1 ? "result" : "results"} found
              </p>
            )}
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/50 focus:border-[#6C5CE7]/50 transition-all cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value} className="bg-[#1A1A2E]">
                  {cat.label}
                </option>
              ))}
            </select>

            {/* Create Structure Button */}
            {session && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/organic-chemistry/create"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#6C5CE7] text-white rounded-xl font-semibold hover:bg-[#5B4CD6] transition-colors whitespace-nowrap"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Structure
                </Link>
              </motion.div>
            )}
          </div>
        </div>

        {/* Structures Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-6 animate-pulse">
                <div className="h-6 bg-white/10 rounded mb-4"></div>
                <div className="h-4 bg-white/10 rounded mb-2"></div>
                <div className="h-4 bg-white/10 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : structures.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-6">🧪</div>
            <h2 className="text-2xl font-bold text-white mb-2">No organic structures yet</h2>
            <p className="text-white/60 mb-6">Be the first to create an organic molecular structure!</p>
            {session ? (
              <Link
                href="/organic-chemistry/create"
                className="inline-block px-6 py-3 bg-[#6C5CE7] text-white rounded-xl font-semibold hover:bg-[#5B4CD6] transition-colors"
              >
                Create Structure
              </Link>
            ) : (
              <Link
                href="/login?callbackUrl=/organic-chemistry"
                className="inline-block px-6 py-3 bg-[#6C5CE7] text-white rounded-xl font-semibold hover:bg-[#5B4CD6] transition-colors"
              >
                Sign in to Create
              </Link>
            )}
          </div>
        ) : filteredStructures.length === 0 ? (
          /* No search results */
          <div className="text-center py-20">
            <div className="text-6xl mb-6">🔍</div>
            <h2 className="text-2xl font-bold text-white mb-2">No structures found</h2>
            <p className="text-white/60 mb-6">No structures match your search for &quot;{searchQuery}&quot;</p>
            <button
              onClick={() => setSearchQuery("")}
              className="inline-block px-6 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-colors"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredStructures.map((structure, index) => (
              <Link key={structure.id || structure._id} href={`/organic-chemistry/${structure.id || structure._id}`}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.4) }}
                  className="group bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-[#00D9FF]/50 transition-all cursor-pointer hover:shadow-lg hover:shadow-[#00D9FF]/10 relative"
                >
                  {/* Category Badge - Top */}
                  <div className="px-6 pt-4 pb-2 border-b border-white/5">
                    <div className="flex items-center justify-between">
                      <span className="inline-block px-3 py-1 bg-[#00D9FF]/20 text-[#00D9FF] text-xs font-semibold rounded-full capitalize">
                        {structure.category.replace("-", " ")}
                      </span>
                      {structure.isTemplate && (
                        <span className="inline-block px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-semibold rounded-full">
                          Template
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-6 py-4">
                    {/* Name */}
                    <h3 className="text-xl font-bold text-white mb-1 line-clamp-1 group-hover:text-[#00D9FF] transition-colors">
                      {structure.name}
                    </h3>

                    {/* IUPAC/Common Name */}
                    {structure.iupacName && (
                      <p className="text-xs text-white/50 mb-3 italic line-clamp-1">{structure.iupacName}</p>
                    )}
                    {!structure.iupacName && structure.commonName && structure.commonName !== structure.name && (
                      <p className="text-xs text-white/50 mb-3 italic line-clamp-1">{structure.commonName}</p>
                    )}

                    {/* Molecular Formula - Highlighted */}
                    <div className="bg-[#00D9FF]/10 border border-[#00D9FF]/30 rounded-lg px-4 py-3 mb-4">
                      <p className="text-2xl font-mono font-bold text-[#00D9FF] text-center tracking-wide">
                        {structure.molecularFormula}
                      </p>
                    </div>

                    {/* Properties Grid */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between py-2 border-b border-white/5">
                        <span className="text-white/40">Molecular Weight</span>
                        <span className="text-white/80 font-medium">{structure.molecularWeight.toFixed(2)} g/mol</span>
                      </div>
                      {structure.smiles && (
                        <div className="py-2 border-white/5">
                          <p className="text-white/40 text-xs font-mono truncate">
                            <span className="text-white/30">SMILES:</span> {structure.smiles}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Hover Indicator */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00D9FF] to-[#6C5CE7] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </motion.div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
