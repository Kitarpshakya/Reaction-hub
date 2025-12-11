"use client";

import { ElementCard as IElementCard, ElementCategory } from "@/lib/types/element";
import ElementCard from "./ElementCard";

interface PeriodicTableGridProps {
  elements: IElementCard[];
  selectedCategory: ElementCategory | null;
}

export default function PeriodicTableGrid({
  elements,
  selectedCategory,
}: PeriodicTableGridProps) {
  return (
    <div className="w-full flex justify-center py-8 px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16">
      <div
        className="periodic-table-grid grid gap-[2px] sm:gap-1 md:gap-1.5 lg:gap-2 mx-auto"
        style={{
          gridTemplateColumns: "repeat(18, 1fr)",
          gridTemplateRows: "repeat(10, 1fr)",
          width: "min(98vw, 1400px)",
          height: "auto",
          aspectRatio: "18 / 10",
        }}
      >
        {elements.map((element, index) => (
          <ElementCard
            key={element.symbol}
            element={element}
            index={index}
            selectedCategory={selectedCategory}
          />
        ))}
      </div>
    </div>
  );
}
