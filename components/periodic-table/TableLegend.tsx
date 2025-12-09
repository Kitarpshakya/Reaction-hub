"use client";

import { CATEGORY_COLORS, ElementCategory } from "@/lib/types/element";

const categoryLabels: Record<ElementCategory, string> = {
  "nonmetal": "Nonmetal",
  "noble-gas": "Noble Gas",
  "alkali-metal": "Alkali Metal",
  "alkaline-earth-metal": "Alkaline Earth",
  "transition-metal": "Transition Metal",
  "post-transition-metal": "Post-Transition",
  "metalloid": "Metalloid",
  "halogen": "Halogen",
  "lanthanide": "Lanthanide",
  "actinide": "Actinide",
  "unknown": "Unknown",
};

export default function TableLegend() {
  return (
    <div className="w-full max-w-6xl mx-auto mt-6 md:mt-8 px-2 md:px-4">
      <h3 className="text-xs md:text-sm font-semibold text-gray-400 mb-2 md:mb-3 text-center">
        Element Categories
      </h3>
      <div className="flex flex-wrap justify-center gap-2 md:gap-3">
        {Object.entries(categoryLabels).map(([category, label]) => (
          <div
            key={category}
            className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 rounded-md bg-gray-800/50 border border-gray-700"
          >
            <div
              className="w-3 h-3 md:w-4 md:h-4 rounded-sm border border-gray-600 flex-shrink-0"
              style={{ backgroundColor: CATEGORY_COLORS[category as ElementCategory] }}
            />
            <span className="text-[10px] md:text-xs text-gray-300 whitespace-nowrap">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
