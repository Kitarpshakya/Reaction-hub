"use client";

import React, { useState, useMemo } from "react";
import { Element } from "@/lib/types/element";
import { Bond, CompoundElement } from "@/lib/types/compound";
import CompoundVisualization from "./CompoundVisualization";
import CompoundVisualization3D from "./CompoundVisualization3D";
import { generate3DCoordinates } from "@/lib/utils/molecular-geometry";

interface CompoundVisualizationWrapperProps {
  elements: CompoundElement[];
  bonds?: Bond[];
  allElements: Element[];
}

export default function CompoundVisualizationWrapper({
  elements,
  bonds = [],
  allElements,
}: CompoundVisualizationWrapperProps) {
  const [viewMode, setViewMode] = useState<"2d" | "3d">("2d");

  // Generate 3D coordinates (memoized)
  const elements3D = useMemo(() => {
    const { elements: generated } = generate3DCoordinates(elements, bonds, allElements);
    return generated;
  }, [elements, bonds, allElements]);

  return (
    <div>
      {/* Title with Toggle Button */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Structure Visualization</h2>
        <div className="inline-flex rounded-lg bg-gray-800/50 backdrop-blur-sm p-1 border border-white/10">
          <button
            onClick={() => setViewMode("2d")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
              viewMode === "2d"
                ? "bg-[#6C5CE7] text-white shadow-lg"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            2D View
          </button>
          <button
            onClick={() => setViewMode("3d")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
              viewMode === "3d"
                ? "bg-[#6C5CE7] text-white shadow-lg"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            3D View
          </button>
        </div>
      </div>

      {/* Visualization */}
      <div>
        {viewMode === "2d" ? (
          <CompoundVisualization
            elements={elements}
            bonds={bonds}
            allElements={allElements}
          />
        ) : (
          <CompoundVisualization3D
            elements={elements3D}
            bonds={bonds}
            allElements={allElements}
          />
        )}
      </div>
    </div>
  );
}
