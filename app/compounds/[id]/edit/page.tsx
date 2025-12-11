"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import ElementsPanel from "@/components/compounds/create/ElementsPanel";
import CompoundCanvas from "@/components/compounds/create/CompoundCanvas";
import CompoundDetails from "@/components/compounds/create/CompoundDetails";
import { useCompoundCanvasStore } from "@/lib/stores/useCompoundCanvasStore";

export default function EditCompoundPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const compoundId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { loadCompound, loadElementsDirectly } = useCompoundCanvasStore();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=/compounds/${compoundId}/edit`);
    }
  }, [status, router, compoundId]);

  useEffect(() => {
    if (status === "authenticated" && compoundId) {
      fetchCompound();
    }
  }, [status, compoundId]);

  const fetchCompound = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/compounds/${compoundId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch compound");
      }

      const data = await response.json();
      const compound = data.compound;

      // Load compound metadata
      loadCompound(compound);

      // Load elements onto canvas (without auto-bonding)
      if (compound.elements && compound.elements.length > 0) {
        // Fetch all element data
        const canvasElements = await Promise.all(
          compound.elements.map(async (el: any) => {
            const elemResponse = await fetch(`/api/elements/${el.symbol}`);
            if (elemResponse.ok) {
              const elemData = await elemResponse.json();
              const element = elemData.element;

              // Generate unique ID for this instance
              const id = `${el.symbol}-${Date.now()}-${Math.random()}`;

              return {
                id,
                elementId: el.elementId || element._id || element.symbol,
                symbol: el.symbol,
                count: el.count || 1,
                position: el.position || { x: 400, y: 300 },
                element: element,
                groupId: compound.bonds && compound.bonds.length > 0 ? "loaded-group" : undefined,
              };
            }
            return null;
          })
        );

        // Filter out nulls
        const validElements = canvasElements.filter((el) => el !== null);

        // Map old element IDs to new instance IDs for bonds
        const idMap = new Map<string, string>();
        compound.elements.forEach((oldEl: any, idx: number) => {
          if (validElements[idx]) {
            idMap.set(oldEl.elementId, validElements[idx].id);
          }
        });

        // Update bond IDs to match new instance IDs
        const updatedBonds = (compound.bonds || []).map((bond: any) => ({
          ...bond,
          fromElementId: idMap.get(bond.fromElementId) || bond.fromElementId,
          toElementId: idMap.get(bond.toElementId) || bond.toElementId,
        }));

        // Load elements and bonds directly (bypass auto-bonding)
        loadElementsDirectly(validElements, updatedBonds);
      }
    } catch (err) {
      console.error("Error loading compound:", err);
      setError("Failed to load compound");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-[#0F0F1E] via-[#1A1A2E] to-[#0F0F1E] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#6C5CE7]"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-linear-to-br from-[#0F0F1E] via-[#1A1A2E] to-[#0F0F1E] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-xl mb-4">{error}</p>
          <Link href="/compounds" className="text-blue-400 hover:text-blue-300 transition-colors">
            Back to Compounds
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-linear-to-br from-[#0F0F1E] via-[#1A1A2E] to-[#0F0F1E]">
      <div className="flex h-[calc(100vh-3.5rem)]">
        {/* Elements Panel - Left */}
        <ElementsPanel />

        {/* Canvas - Center (Maximum Area) */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Canvas */}
          <div id="compound-canvas" className="flex-1 overflow-auto">
            <CompoundCanvas />
          </div>
        </div>

        {/* Details Panel - Right (single scroll container) */}
        <div className="w-96 bg-gray-800 border-l border-gray-700 overflow-y-auto">
          <CompoundDetails compoundId={compoundId} />
        </div>
      </div>
    </div>
  );
}
