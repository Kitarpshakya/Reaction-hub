"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import ElementsPanel from "@/components/compounds/create/ElementsPanel";
import CompoundCanvas from "@/components/compounds/create/CompoundCanvas";
import CompoundDetails from "@/components/compounds/create/CompoundDetails";
import QuickExamples from "@/components/compounds/create/QuickExamples";
import { useCompoundCanvasStore } from "@/lib/stores/useCompoundCanvasStore";

export default function CreateCompoundPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { reset } = useCompoundCanvasStore();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/compounds/create");
    }

    // Reset store on mount
    reset();

    return () => {
      // Cleanup on unmount
    };
  }, [status, router, reset]);

  if (status === "loading") {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] bg-gradient-to-br from-[#0F0F1E] via-[#1A1A2E] to-[#0F0F1E] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#6C5CE7]"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-gradient-to-br from-[#0F0F1E] via-[#1A1A2E] to-[#0F0F1E]">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="container mx-auto px-4 py-3">
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
              <h1 className="text-2xl font-bold text-white">Create New Compound</h1>
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
          <CompoundDetails />
        </div>
      </div>
    </div>
  );
}
