import PeriodicTableGrid from "@/components/periodic-table/PeriodicTableGrid";
import TableLegend from "@/components/periodic-table/TableLegend";
import { ElementCard } from "@/lib/types/element";
import Link from "next/link";

async function getElements(): Promise<ElementCard[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/elements`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!res.ok) {
      throw new Error("Failed to fetch elements");
    }

    const data = await res.json();
    return data.elements || [];
  } catch (error) {
    console.error("Error fetching elements:", error);
    return [];
  }
}

export default async function PeriodicTablePage() {
  const elements = await getElements();

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-gradient-to-br from-[#0F0F1E] via-[#1A1A2E] to-[#0F0F1E]">
      {/* Header */}
      <header className="py-4 md:py-6 px-4 text-center border-b border-white/10">
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
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-2">
          Periodic Table
        </h1>
        <p className="text-white/60 text-sm sm:text-base md:text-lg">
          Interactive Table of Elements
        </p>
      </header>

      {/* Main Content */}
      <main className="w-full overflow-hidden">
        {elements.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-8 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-yellow-400 mb-4">
                Database Not Seeded
              </h2>
              <p className="text-gray-300 mb-6">
                The periodic table data hasn&apos;t been loaded yet. Please seed the
                database to get started.
              </p>
              <div className="bg-gray-800 rounded-lg p-4 text-left">
                <p className="text-sm text-gray-400 mb-2">Run this command:</p>
                <code className="text-green-400 text-sm">
                  curl -X POST http://localhost:3000/api/elements/seed
                </code>
                <p className="text-sm text-gray-400 mt-4 mb-2">Or visit:</p>
                <a
                  href="/api/elements/seed"
                  className="text-blue-400 hover:underline text-sm"
                >
                  /api/elements/seed
                </a>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Periodic Table */}
            <PeriodicTableGrid elements={elements} />

            {/* Legend */}
            <TableLegend />
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-white/40 text-sm border-t border-white/10 mt-12">
        <p>
          Explore the elements • Click any element to view detailed information
        </p>
      </footer>
    </div>
  );
}
