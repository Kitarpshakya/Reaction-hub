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

interface TableLegendProps {
  selectedCategory: ElementCategory | null;
  onCategoryClick: (category: ElementCategory) => void;
}

export default function TableLegend({ selectedCategory, onCategoryClick }: TableLegendProps) {
  return (
    <div className="w-full max-w-6xl mx-auto mt-6 md:mt-8 px-2 md:px-4">
      <h3 className="text-xs md:text-sm font-semibold text-gray-400 mb-2 md:mb-3 text-center">
        Element Categories {selectedCategory && <span className="text-[#6C5CE7]">(Click again to clear filter)</span>}
      </h3>
      <div className="flex flex-wrap justify-center gap-2 md:gap-3">
        {Object.entries(categoryLabels).map(([category, label]) => {
          const isSelected = selectedCategory === category;
          const isFiltered = selectedCategory !== null && !isSelected;

          return (
            <button
              key={category}
              onClick={() => onCategoryClick(category as ElementCategory)}
              className={`flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 rounded-md border transition-all cursor-pointer hover:scale-105 ${
                isSelected
                  ? "bg-[#6C5CE7]/20 border-[#6C5CE7] ring-2 ring-[#6C5CE7]/50"
                  : isFiltered
                  ? "bg-gray-800/30 border-gray-700/50 opacity-50"
                  : "bg-gray-800/50 border-gray-700 hover:border-gray-600"
              }`}
            >
              <div
                className={`w-3 h-3 md:w-4 md:h-4 rounded-sm border flex-shrink-0 transition-all ${
                  isSelected ? "border-[#6C5CE7] ring-1 ring-[#6C5CE7]" : "border-gray-600"
                }`}
                style={{ backgroundColor: CATEGORY_COLORS[category as ElementCategory] }}
              />
              <span
                className={`text-[10px] md:text-xs whitespace-nowrap transition-colors ${
                  isSelected ? "text-white font-semibold" : isFiltered ? "text-gray-500" : "text-gray-300"
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
