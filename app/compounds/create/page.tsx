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
      <div className="min-h-[calc(100vh-3.5rem)] bg-linear-to-br from-[#0F0F1E] via-[#1A1A2E] to-[#0F0F1E] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#6C5CE7]"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-linear-to-br from-[#0F0F1E] via-[#1A1A2E] to-[#0F0F1E]">
      <div className="flex h-[calc(100vh-3.5rem)]">
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
