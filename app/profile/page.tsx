"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [compounds, setCompounds] = useState<Compound[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/profile");
    } else if (status === "authenticated" && session?.user?.id) {
      fetchUserCompounds();
    }
  }, [status, session, router]);

  const fetchUserCompounds = async () => {
    if (!session?.user?.id) return;

    try {
      const res = await fetch(`/api/compounds?userId=${session.user.id}`);
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

  const handleDelete = async (compoundId: string) => {
    if (!confirm("Are you sure you want to delete this compound?")) {
      return;
    }

    setDeletingId(compoundId);
    try {
      const res = await fetch(`/api/compounds/${compoundId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setCompounds(compounds.filter((c) => c.id !== compoundId));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete compound");
      }
    } catch (error) {
      console.error("Error deleting compound:", error);
      alert("Failed to delete compound");
    } finally {
      setDeletingId(null);
    }
  };

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] bg-gradient-to-br from-[#0F0F1E] via-[#1A1A2E] to-[#0F0F1E] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
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
            <div className="flex items-center gap-4 mb-2">
              {session?.user?.image && (
                <img
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  className="w-16 h-16 rounded-full border-2 border-[#6C5CE7]"
                />
              )}
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-white">
                  {session?.user?.name || "My Profile"}
                </h1>
                <p className="text-white/60">{session?.user?.email}</p>
              </div>
            </div>
            <p className="text-white/60 mt-2">
              {compounds.length} compound{compounds.length !== 1 ? "s" : ""} created
            </p>
          </div>

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
              Create your first chemical compound!
            </p>
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
                className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-[#6C5CE7]/50 transition-all relative group"
              >
                <Link href={`/compounds/${compound.id}`}>
                  <div className="cursor-pointer">
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
                        Created {new Date(compound.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Link>

                {/* Delete Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(compound.id);
                  }}
                  disabled={deletingId === compound.id}
                  className="absolute top-4 right-4 p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Delete compound"
                >
                  {deletingId === compound.id ? (
                    <svg
                      className="w-5 h-5 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
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
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  )}
                </motion.button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
