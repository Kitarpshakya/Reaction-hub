"use client";

import React, { useState, useEffect } from "react";
import { Element } from "@/lib/types/element";
import { useCompoundCanvasStore } from "@/lib/stores/useCompoundCanvasStore";
import { getCategoryColor } from "@/lib/utils/element-helpers";

export default function ElementsPanel() {
  const [elements, setElements] = useState<Element[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const { addElement } = useCompoundCanvasStore();

  useEffect(() => {
    fetchElements();
  }, []);

  const fetchElements = async () => {
    try {
      const response = await fetch("/api/elements");
      const data = await response.json();
      setElements(data.elements || []);
    } catch (error) {
      console.error("Error fetching elements:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredElements = elements.filter(
    (element) =>
      element.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      element.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      element.atomicNumber.toString().includes(searchQuery)
  );

  const handleElementClick = (element: Element) => {
    // Add element to center of canvas with slight random offset
    const randomX = 400 + (Math.random() - 0.5) * 100;
    const randomY = 300 + (Math.random() - 0.5) * 100;
    addElement(element, { x: randomX, y: randomY });
  };

  return (
    <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-white font-bold text-lg mb-3">Elements</h2>
        <input
          type="text"
          placeholder="Search elements..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Elements grid */}
      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="text-gray-400 text-center py-8">Loading elements...</div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {filteredElements.map((element) => {
              const categoryColor = getCategoryColor(element.category);

              return (
                <div
                  key={element.symbol}
                  onClick={() => handleElementClick(element)}
                  className="p-2 rounded-lg cursor-pointer transition-all hover:scale-105 hover:shadow-lg active:scale-95"
                  title={`${element.name} - Click to add`}
                >
                  <div
                    className="w-16 h-16 rounded-lg flex flex-col items-center justify-center text-black shadow-md"
                    style={{ backgroundColor: categoryColor }}
                  >
                    <div className="text-[10px] font-light">{element.atomicNumber}</div>
                    <div className="text-lg font-bold">{element.symbol}</div>
                    <div className="text-[9px]">{element.atomicMass.toFixed(1)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && filteredElements.length === 0 && (
          <div className="text-gray-400 text-center py-8">No elements found</div>
        )}
      </div>

      {/* Help text */}
      <div className="p-4 border-t border-gray-700 text-xs text-gray-400">
        <p>Click elements to add to canvas</p>
      </div>
    </div>
  );
}
