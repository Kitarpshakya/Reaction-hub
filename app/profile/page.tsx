"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useModal } from "@/lib/contexts/ModalContext";

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

interface OrganicStructure {
  _id: string;
  id: string;
  name: string;
  iupacName?: string;
  category: string;
  molecularFormula: string;
  molecularWeight: number;
  createdByName: string;
  createdAt: string;
}

type TabType = "compounds" | "organic";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { showConfirm, showError } = useModal();
  const [compounds, setCompounds] = useState<Compound[]>([]);
  const [organicStructures, setOrganicStructures] = useState<OrganicStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("compounds");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/profile");
    } else if (status === "authenticated" && session?.user?.id) {
      fetchUserData();
    }
  }, [status, session, router]);

  const fetchUserData = async () => {
    if (!session?.user?.id) return;

    try {
      // Fetch both compounds and organic structures in parallel
      const [compoundsRes, organicRes] = await Promise.all([
        fetch(`/api/compounds?userId=${session.user.id}`),
        fetch(`/api/organic-structures?createdBy=${session.user.id}`)
      ]);

      if (compoundsRes.ok) {
        const data = await compoundsRes.json();
        setCompounds(data.compounds || []);
      }

      if (organicRes.ok) {
        const data = await organicRes.json();
        setOrganicStructures(data.structures || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCompound = async (compoundId: string) => {
    showConfirm(
      "Are you sure you want to delete this compound? This action cannot be undone.",
      async () => {
        setDeletingId(compoundId);
        try {
          const res = await fetch(`/api/compounds/${compoundId}`, {
            method: "DELETE",
          });

          if (res.ok) {
            setCompounds(compounds.filter((c) => c.id !== compoundId));
          } else {
            const data = await res.json();
            showError(data.error || "Failed to delete compound");
          }
        } catch (error) {
          console.error("Error deleting compound:", error);
          showError("Failed to delete compound");
        } finally {
          setDeletingId(null);
        }
      },
      "Delete Compound",
      "Delete"
    );
  };

  const handleDeleteOrganic = async (structureId: string) => {
    showConfirm(
      "Are you sure you want to delete this organic structure? This action cannot be undone.",
      async () => {
        setDeletingId(structureId);
        try {
          const res = await fetch(`/api/organic-structures/${structureId}`, {
            method: "DELETE",
          });

          if (res.ok) {
            setOrganicStructures(organicStructures.filter((s) => s.id !== structureId));
          } else {
            const data = await res.json();
            showError(data.error || "Failed to delete structure");
          }
        } catch (error) {
          console.error("Error deleting structure:", error);
          showError("Failed to delete structure");
        } finally {
          setDeletingId(null);
        }
      },
      "Delete Organic Structure",
      "Delete"
    );
  };

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] bg-linear-to-br from-[#0F0F1E] via-[#1A1A2E] to-[#0F0F1E] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  const totalCreations = compounds.length + organicStructures.length;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-linear-to-br from-[#0F0F1E] via-[#1A1A2E] to-[#0F0F1E]">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <div className="mb-4">
              <Link
                href="/"
                className="inline-flex items-center text-white/60 hover:text-white transition-colors text-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Home
              </Link>
            </div>
            <div className="flex items-center gap-4 mb-2">
              {session?.user?.image && (
                <img
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  className="w-16 h-16 rounded-full border-2 border-[#6C5CE7]"
                />
              )}
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-white">{session?.user?.name || "My Profile"}</h1>
                <p className="text-white/60">{session?.user?.email}</p>
              </div>
            </div>
            <p className="text-white/60 mt-2">
              {totalCreations} creation{totalCreations !== 1 ? "s" : ""} ({compounds.length} compounds, {organicStructures.length} organic structures)
            </p>
          </div>

          <div className="flex gap-3">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/compounds/create"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#6C5CE7] text-white rounded-xl font-semibold hover:bg-[#5B4CD6] transition-colors text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Compound
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/organic-chemistry/create"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#00D9FF] text-black rounded-xl font-semibold hover:bg-[#00C4E6] transition-colors text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Organic
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-white/10 pb-4">
          <button
            onClick={() => setActiveTab("compounds")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "compounds"
                ? "bg-[#6C5CE7] text-white"
                : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
            }`}
          >
            Compounds ({compounds.length})
          </button>
          <button
            onClick={() => setActiveTab("organic")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "organic"
                ? "bg-[#00D9FF] text-black"
                : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
            }`}
          >
            Organic Structures ({organicStructures.length})
          </button>
        </div>

        {/* Content */}
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
        ) : activeTab === "compounds" ? (
          // Compounds Tab
          compounds.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-6">⚗️</div>
              <h2 className="text-2xl font-bold text-white mb-2">No compounds yet</h2>
              <p className="text-white/60 mb-6">Create your first chemical compound!</p>
              <Link
                href="/compounds/create"
                className="inline-block px-6 py-3 bg-[#6C5CE7] text-white rounded-xl font-semibold hover:bg-[#5B4CD6] transition-colors"
              >
                Create Compound
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {compounds.map((compound, index) => (
                <motion.div
                  key={compound.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-[#6C5CE7]/50 hover:shadow-lg hover:shadow-[#6C5CE7]/10 transition-all relative group"
                >
                  <Link href={`/compounds/${compound.id}`}>
                    <div className="cursor-pointer p-6">
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
                        {compound.description && (
                          <div className="py-2 border-b border-white/5">
                            <p className="text-white/60 text-xs line-clamp-2 leading-relaxed">{compound.description}</p>
                          </div>
                        )}
                        <div className="flex items-center justify-between py-2">
                          <span className="text-white/40">Created</span>
                          <span className="text-white/60 text-xs">{new Date(compound.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </Link>

                  {/* Action Buttons - Show on hover */}
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* View Button */}
                    <Link href={`/compounds/${compound.id}`}>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 bg-[#6C5CE7]/20 hover:bg-[#6C5CE7]/30 text-[#6C5CE7] rounded-lg transition-colors backdrop-blur-sm"
                        title="View details"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </motion.button>
                    </Link>

                    {/* Delete Button */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCompound(compound.id);
                      }}
                      disabled={deletingId === compound.id}
                      className="p-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
                      title="Delete compound"
                    >
                      {deletingId === compound.id ? (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      )}
                    </motion.button>
                  </div>

                  {/* Hover Indicator */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#6C5CE7] to-[#A855F7] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </motion.div>
              ))}
            </div>
          )
        ) : (
          // Organic Structures Tab
          organicStructures.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-6">🧬</div>
              <h2 className="text-2xl font-bold text-white mb-2">No organic structures yet</h2>
              <p className="text-white/60 mb-6">Create your first organic molecule!</p>
              <Link
                href="/organic-chemistry/create"
                className="inline-block px-6 py-3 bg-[#00D9FF] text-black rounded-xl font-semibold hover:bg-[#00C4E6] transition-colors"
              >
                Create Organic Structure
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {organicStructures.map((structure, index) => (
                <motion.div
                  key={structure.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-[#00D9FF]/50 hover:shadow-lg hover:shadow-[#00D9FF]/10 transition-all relative group"
                >
                  {/* Category Badge - Top */}
                  <div className="px-6 pt-4 pb-2 border-b border-white/5">
                    <span className="inline-block px-3 py-1 bg-[#00D9FF]/20 text-[#00D9FF] text-xs font-semibold rounded-full capitalize">
                      {structure.category}
                    </span>
                  </div>

                  <Link href={`/organic-chemistry/${structure.id}`}>
                    <div className="cursor-pointer p-6 pt-4">
                      {/* Name */}
                      <h3 className="text-xl font-bold text-white mb-1 line-clamp-1 group-hover:text-[#00D9FF] transition-colors">
                        {structure.name}
                      </h3>

                      {/* IUPAC Name */}
                      {structure.iupacName && (
                        <p className="text-xs text-white/50 mb-3 italic line-clamp-1">
                          {structure.iupacName}
                        </p>
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
                        <div className="flex items-center justify-between py-2">
                          <span className="text-white/40">Created</span>
                          <span className="text-white/60 text-xs">{new Date(structure.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </Link>

                  {/* Action Buttons - Show on hover */}
                  <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Edit Button */}
                    <Link href={`/organic-chemistry/${structure.id}`}>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 bg-[#00D9FF]/20 hover:bg-[#00D9FF]/30 text-[#00D9FF] rounded-lg transition-colors backdrop-blur-sm"
                        title="View details"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </motion.button>
                    </Link>

                    {/* Delete Button */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteOrganic(structure.id);
                      }}
                      disabled={deletingId === structure.id}
                      className="p-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
                      title="Delete structure"
                    >
                      {deletingId === structure.id ? (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      )}
                    </motion.button>
                  </div>

                  {/* Hover Indicator */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00D9FF] to-[#6C5CE7] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </motion.div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
