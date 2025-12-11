"use client";

import { useEffect, useState } from "react";
import PeriodicTableGrid from "@/components/periodic-table/PeriodicTableGrid";
import TableLegend from "@/components/periodic-table/TableLegend";
import { ElementCard, ElementCategory } from "@/lib/types/element";

export default function PeriodicTablePage() {
  const [elements, setElements] = useState<ElementCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<ElementCategory | null>(null);

  useEffect(() => {
    fetchElements();
  }, []);

  const fetchElements = async () => {
    try {
      const res = await fetch("/api/elements");
      if (res.ok) {
        const data = await res.json();
        setElements(data.elements || []);
      }
    } catch (error) {
      console.error("Error fetching elements:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (category: ElementCategory) => {
    // Toggle: if same category clicked, deselect it
    setSelectedCategory(selectedCategory === category ? null : category);
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] bg-gradient-to-br from-[#0F0F1E] via-[#1A1A2E] to-[#0F0F1E] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#6C5CE7]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-gradient-to-br from-[#0F0F1E] via-[#1A1A2E] to-[#0F0F1E]">
      {/* Main Content */}
      <main className="w-full overflow-hidden">
        {elements.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-6">🔬</div>
            <h2 className="text-2xl font-bold text-white mb-2">No data found</h2>
            <p className="text-white/60">The periodic table data hasn&apos;t been loaded yet.</p>
          </div>
        ) : (
          <>
            {/* Legend */}
            <TableLegend
              selectedCategory={selectedCategory}
              onCategoryClick={handleCategoryClick}
            />
            {/* Periodic Table */}
            <PeriodicTableGrid
              elements={elements}
              selectedCategory={selectedCategory}
            />
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-white/40 text-sm border-t border-white/10 mt-12">
        <p>Explore the elements • Click any element to view detailed information</p>
      </footer>
    </div>
  );
}
