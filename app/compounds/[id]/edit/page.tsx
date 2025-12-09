"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import ElementsPanel from "@/components/compounds/create/ElementsPanel";
import CompoundCanvas from "@/components/compounds/create/CompoundCanvas";
import CompoundDetails from "@/components/compounds/create/CompoundDetails";
import QuickExamples from "@/components/compounds/create/QuickExamples";
import { useCompoundCanvasStore } from "@/lib/stores/useCompoundCanvasStore";

export default function EditCompoundPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const compoundId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { addElement, loadCompound, setCompoundName, setCompoundDescription } =
    useCompoundCanvasStore();

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

      // Load compound data into store
      loadCompound(compound);

      // Load elements onto canvas
      if (compound.elements) {
        for (const el of compound.elements) {
          // Fetch full element data
          const elemResponse = await fetch(`/api/elements/${el.symbol}`);
          if (elemResponse.ok) {
            const elemData = await elemResponse.json();
            const element = elemData.element;

            // Add element to canvas with saved position
            if (element && el.position) {
              addElement(element, el.position);
            }
          }
        }
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
      <div className="min-h-screen bg-gradient-to-br from-[#0F0F1E] via-[#1A1A2E] to-[#0F0F1E] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#6C5CE7]"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0F0F1E] via-[#1A1A2E] to-[#0F0F1E] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-xl mb-4">{error}</p>
          <Link
            href="/compounds"
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            Back to Compounds
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F0F1E] via-[#1A1A2E] to-[#0F0F1E]">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/compounds"
                className="inline-flex items-center text-white/60 hover:text-white transition-colors"
              >
                <svg
                  className="w-5 h-5 mr-2"
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
                Back to Compounds
              </Link>
              <div className="h-6 w-px bg-gray-700" />
              <h1 className="text-2xl font-bold text-white">Edit Compound</h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-400">
                Logged in as <span className="text-white">{session.user?.name}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Elements Panel - Left */}
        <ElementsPanel />

        {/* Canvas - Center (Maximum Area) */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Quick Examples */}
          <QuickExamples />

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
