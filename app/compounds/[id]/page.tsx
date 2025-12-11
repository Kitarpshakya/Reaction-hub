"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Element } from "@/lib/types/element";
import { validateCompound } from "@/lib/utils/chemical-validation";
import ValidationPanel from "@/components/compounds/create/ValidationPanel";
import CompoundVisualization from "@/components/compounds/CompoundVisualization";

interface CompoundElement {
  elementId: string;
  symbol: string;
  count: number;
  position?: { x: number; y: number };
}

interface Bond {
  id: string;
  fromElementId: string;
  toElementId: string;
  bondType: "single" | "double" | "triple" | "ionic" | "covalent" | "metallic";
}

interface ExternalFactors {
  temperature?: { enabled: boolean; value?: number; unit?: string };
  pressure?: { enabled: boolean; value?: number; unit?: string };
  catalyst?: { enabled: boolean; name?: string; details?: string };
  heat?: { enabled: boolean; details?: string };
  light?: { enabled: boolean; wavelength?: number; details?: string };
}

interface Compound {
  _id: string;
  id: string;
  name: string;
  formula: string;
  molarMass: number;
  description?: string;
  elements: CompoundElement[];
  bonds?: Bond[];
  externalFactors?: ExternalFactors;
  createdBy: string;
  createdByName: string;
  createdAt: string;
}

export default function CompoundDetailPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const [compound, setCompound] = useState<Compound | null>(null);
  const [allElements, setAllElements] = useState<Element[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchCompound(params.id as string);
      fetchAllElements();
    }
  }, [params.id]);

  const fetchCompound = async (id: string) => {
    try {
      const res = await fetch(`/api/compounds/${id}`);
      if (res.ok) {
        const data = await res.json();
        setCompound(data.compound);
      } else {
        setError("Compound not found");
      }
    } catch (error) {
      console.error("Error fetching compound:", error);
      setError("Failed to load compound");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllElements = async () => {
    try {
      const res = await fetch("/api/elements");
      if (res.ok) {
        const data = await res.json();
        setAllElements(data.elements);
      }
    } catch (error) {
      console.error("Error fetching elements:", error);
    }
  };

  // Validate compound
  const validation = useMemo(() => {
    if (!compound || !allElements.length) return null;

    // Create element lookup
    const elementMap = new Map<string, Element>();
    allElements.forEach((el) => {
      elementMap.set(el.symbol, el);
    });

    // Enrich compound elements with full element data
    const enrichedElements = compound.elements
      .map((el) => ({
        id: el.elementId,
        element: elementMap.get(el.symbol)!,
        symbol: el.symbol,
      }))
      .filter((el) => el.element !== undefined);

    return validateCompound(enrichedElements, compound.bonds || []);
  }, [compound, allElements]);

  const isOwner = session?.user && compound && session.user.id === compound.createdBy;

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-[#0F0F1E] via-[#1A1A2E] to-[#0F0F1E] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#6C5CE7]"></div>
      </div>
    );
  }

  if (error || !compound) {
    return (
      <div className="min-h-screen bg-linear-to-br from-[#0F0F1E] via-[#1A1A2E] to-[#0F0F1E] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-6">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-4">{error || "Compound not found"}</h2>
          <Link
            href="/compounds"
            className="inline-block px-6 py-3 bg-[#6C5CE7] text-white rounded-xl font-semibold hover:bg-[#5B4CD6] transition-colors"
          >
            Back to Compounds
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-linear-to-br from-[#0F0F1E] via-[#1A1A2E] to-[#0F0F1E]">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">{compound.name}</h1>
              <p className="text-5xl font-mono text-[#6C5CE7] mb-4">{compound.formula}</p>
            </div>

            {isOwner && (
              <Link
                href={`/compounds/${compound.id}/edit`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#6C5CE7] text-white rounded-xl font-semibold hover:bg-[#5B4CD6] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Edit Compound
              </Link>
            )}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Compound Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Chemical Validation */}
            {validation && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 border border-white/10 rounded-xl p-6"
              >
                <h2 className="text-xl font-bold text-white mb-4">Chemical Validation</h2>
                <ValidationPanel validation={validation} />
              </motion.div>
            )}

            {/* Basic Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 border border-white/10 rounded-xl p-6"
            >
              <h2 className="text-xl font-bold text-white mb-4">Basic Information</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-white/40 text-sm">Formula</p>
                  <p className="text-white text-lg font-mono">{compound.formula}</p>
                </div>
                <div>
                  <p className="text-white/40 text-sm">Molar Mass</p>
                  <p className="text-white text-lg">{compound.molarMass.toFixed(3)} g/mol</p>
                </div>
                <div>
                  <p className="text-white/40 text-sm">Elements</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {compound.elements.map((el, idx) => (
                      <div key={idx} className="bg-[#6C5CE7]/20 border border-[#6C5CE7]/50 rounded-lg px-3 py-1">
                        <span className="text-white font-mono">{el.symbol}</span>
                        {el.count > 1 && <span className="text-white/60 text-sm ml-1">×{el.count}</span>}
                      </div>
                    ))}
                  </div>
                </div>
                {compound.bonds && compound.bonds.length > 0 && (
                  <div>
                    <p className="text-white/40 text-sm">Bonds</p>
                    <p className="text-white text-lg">{compound.bonds.length}</p>
                    <div className="mt-2 space-y-1">
                      {Array.from(new Set(compound.bonds.map((b) => b.bondType))).map((type) => (
                        <div key={type} className="text-sm text-white/70 capitalize">
                          • {type} bond ({compound.bonds!.filter((b) => b.bondType === type).length})
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Description */}
            {compound.description && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/5 border border-white/10 rounded-xl p-6"
              >
                <h2 className="text-xl font-bold text-white mb-4">Description</h2>
                <p className="text-white/80">{compound.description}</p>
              </motion.div>
            )}

            {/* External Factors */}
            {compound.externalFactors && Object.values(compound.externalFactors).some((f) => f?.enabled) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white/5 border border-white/10 rounded-xl p-6"
              >
                <h2 className="text-xl font-bold text-white mb-4">External Factors</h2>
                <div className="space-y-3">
                  {compound.externalFactors.temperature?.enabled && (
                    <div>
                      <p className="text-white/40 text-sm">Temperature</p>
                      <p className="text-white">
                        {compound.externalFactors.temperature.value} {compound.externalFactors.temperature.unit}
                      </p>
                    </div>
                  )}
                  {compound.externalFactors.pressure?.enabled && (
                    <div>
                      <p className="text-white/40 text-sm">Pressure</p>
                      <p className="text-white">
                        {compound.externalFactors.pressure.value} {compound.externalFactors.pressure.unit}
                      </p>
                    </div>
                  )}
                  {compound.externalFactors.catalyst?.enabled && (
                    <div>
                      <p className="text-white/40 text-sm">Catalyst</p>
                      <p className="text-white">{compound.externalFactors.catalyst.name}</p>
                      {compound.externalFactors.catalyst.details && (
                        <p className="text-white/60 text-sm">{compound.externalFactors.catalyst.details}</p>
                      )}
                    </div>
                  )}
                  {compound.externalFactors.heat?.enabled && (
                    <div>
                      <p className="text-white/40 text-sm">Heat</p>
                      <p className="text-white">{compound.externalFactors.heat.details || "Applied"}</p>
                    </div>
                  )}
                  {compound.externalFactors.light?.enabled && (
                    <div>
                      <p className="text-white/40 text-sm">Light</p>
                      <p className="text-white">
                        {compound.externalFactors.light.wavelength
                          ? `${compound.externalFactors.light.wavelength} nm`
                          : "Applied"}
                      </p>
                      {compound.externalFactors.light.details && (
                        <p className="text-white/60 text-sm">{compound.externalFactors.light.details}</p>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* Right Column - Visual Representation */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 border border-white/10 rounded-xl p-6"
            >
              <h2 className="text-xl font-bold text-white mb-4">Structure Visualization</h2>

              {allElements.length > 0 ? (
                <CompoundVisualization elements={compound.elements} bonds={compound.bonds} allElements={allElements} />
              ) : (
                <div className="bg-gray-900 rounded-lg p-8 text-center">
                  <div className="text-gray-400">Loading visualization...</div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
