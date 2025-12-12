"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { OrganicStructure } from "@/lib/types/organic";
import MoleculeViewer from "@/components/organic/MoleculeViewer";

export default function OrganicStructureDetailPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const [structure, setStructure] = useState<OrganicStructure | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchStructure(params.id as string);
    }
  }, [params.id]);

  const fetchStructure = async (id: string) => {
    try {
      const res = await fetch(`/api/organic-structures/${id}`);
      if (res.ok) {
        const data = await res.json();
        setStructure(data.structure);
      } else {
        setError("Structure not found");
      }
    } catch (error) {
      console.error("Error fetching structure:", error);
      setError("Failed to load structure");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!structure || !confirm("Are you sure you want to delete this structure?")) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/organic-structures/${structure.id || structure._id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/organic-chemistry");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete structure");
      }
    } catch (error) {
      console.error("Error deleting structure:", error);
      alert("Failed to delete structure");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] bg-linear-to-br from-[#0F0F1E] via-[#1A1A2E] to-[#0F0F1E] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (error || !structure) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] bg-linear-to-br from-[#0F0F1E] via-[#1A1A2E] to-[#0F0F1E] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-white mb-2">{error || "Structure not found"}</h2>
          <Link
            href="/organic-chemistry"
            className="inline-block px-6 py-3 bg-[#6C5CE7] text-white rounded-xl font-semibold hover:bg-[#5B4CD6] transition-colors"
          >
            Back to Library
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = session?.user?.id === structure.createdBy;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-linear-to-br from-[#0F0F1E] via-[#1A1A2E] to-[#0F0F1E]">
      <div className="container mx-auto px-4 py-6">
        {/* Header with actions */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <Link
              href="/organic-chemistry"
              className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-4"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Library
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">{structure.name}</h1>
            {structure.commonName && structure.commonName !== structure.name && (
              <p className="text-xl text-white/60 mb-2">{structure.commonName}</p>
            )}
            {structure.iupacName && (
              <p className="text-sm text-white/40">IUPAC: {structure.iupacName}</p>
            )}
          </div>

          {/* Action buttons */}
          {isOwner && (
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-500/20 text-red-300 rounded-xl font-semibold hover:bg-red-500/30 transition-colors disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </motion.button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left column - Structure viewer */}
          <div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Structure</h2>
              <MoleculeViewer
                atoms={structure.atoms}
                bonds={structure.bonds}
                width={500}
                height={400}
                showHydrogens={false}
                scale={1.2}
              />
            </div>

            {/* Metadata */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 mt-6">
              <h2 className="text-xl font-bold text-white mb-4">Metadata</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-white/40">Created by:</span>
                  <span className="text-white ml-2">{structure.createdByName}</span>
                </div>
                <div>
                  <span className="text-white/40">Visibility:</span>
                  <span className="text-white ml-2">{structure.isPublic ? "Public" : "Private"}</span>
                </div>
                {structure.isTemplate && (
                  <div>
                    <span className="inline-block px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-semibold rounded-lg">
                      Template
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right column - Properties */}
          <div className="space-y-6">
            {/* Molecular info */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Molecular Information</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-white/40 text-sm mb-1">Molecular Formula</p>
                  <p className="text-3xl font-mono text-[#6C5CE7]">{structure.molecularFormula}</p>
                </div>
                <div>
                  <p className="text-white/40 text-sm mb-1">Molecular Weight</p>
                  <p className="text-2xl text-white">{structure.molecularWeight.toFixed(2)} g/mol</p>
                </div>
                <div>
                  <p className="text-white/40 text-sm mb-1">Category</p>
                  <p className="text-lg text-white capitalize">{structure.category.replace("-", " ")}</p>
                </div>
                <div>
                  <p className="text-white/40 text-sm mb-1">SMILES</p>
                  <p className="text-sm font-mono text-white bg-black/30 px-3 py-2 rounded-lg break-all">
                    {structure.smiles}
                  </p>
                </div>
              </div>
            </div>

            {/* Chemical Properties */}
            {(structure.logP !== null && structure.logP !== undefined) ||
             (structure.pKa !== null && structure.pKa !== undefined) ? (
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">Chemical Properties</h2>
                <div className="space-y-3">
                  {structure.logP !== null && structure.logP !== undefined && (
                    <div>
                      <p className="text-white/40 text-sm mb-1">LogP</p>
                      <p className="text-lg text-white">{structure.logP.toFixed(2)}</p>
                    </div>
                  )}
                  {structure.pKa !== null && structure.pKa !== undefined && (
                    <div>
                      <p className="text-white/40 text-sm mb-1">pKa</p>
                      <p className="text-lg text-white">{structure.pKa.toFixed(2)}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {/* Functional Groups */}
            {structure.functionalGroups && structure.functionalGroups.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">Functional Groups</h2>
                <div className="flex flex-wrap gap-2">
                  {structure.functionalGroups.map((fg, index) => (
                    <span
                      key={index}
                      className="px-3 py-2 bg-white/10 text-white rounded-lg text-sm"
                    >
                      {fg.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {structure.tags && structure.tags.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {structure.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-2 bg-[#6C5CE7]/20 text-[#6C5CE7] rounded-lg text-sm"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Structure Details */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Structure Details</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-white/40">Atoms:</span>
                  <span className="text-white ml-2">{structure.atoms.length}</span>
                </div>
                <div>
                  <span className="text-white/40">Bonds:</span>
                  <span className="text-white ml-2">{structure.bonds.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
