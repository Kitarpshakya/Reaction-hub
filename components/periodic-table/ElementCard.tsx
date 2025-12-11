"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ElementCard as IElementCard, ElementCategory } from "@/lib/types/element";
import { useState, memo } from "react";

interface ElementCardProps {
  element: IElementCard;
  index: number;
  selectedCategory: ElementCategory | null;
}

function ElementCard({ element, index, selectedCategory }: ElementCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Determine if this element should be dimmed
  // Check both primary category and categories array for highlighting
  const matchesCategory =
    selectedCategory !== null &&
    (element.category === selectedCategory || element.categories?.includes(selectedCategory));
  const isFiltered = selectedCategory !== null && !matchesCategory;
  const isHighlighted = matchesCategory;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{
        opacity: isFiltered ? 0.25 : 1,
        scale: isHighlighted ? 1.05 : 1,
      }}
      transition={{
        opacity: {
          duration: 0.4,
          delay: Math.min(index * 0.005, 0.5),
          ease: "easeInOut",
        },
        scale: {
          duration: 0.4,
          delay: Math.min(index * 0.005, 0.5),
          ease: "easeInOut",
        },
      }}
      style={{
        gridRow: element.gridRow,
        gridColumn: element.gridColumn,
      }}
      className="element-card-container aspect-square relative"
    >
      <Link href={`/elements/${element.symbol}`} className="block h-full w-full" prefetch={false}>
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="h-full w-full rounded-lg border-2 flex flex-col justify-center items-center cursor-pointer shadow-lg relative overflow-hidden transition-all duration-200"
          style={{
            backgroundColor: element.color,
            backgroundImage: `linear-gradient(135deg, ${element.color} 0%, ${element.color}dd 100%)`,
            borderColor: isHighlighted ? "#6C5CE7" : isHovered ? element.color : "rgb(55, 65, 81)",
            transform: isHovered ? "scale(1.05)" : "scale(1)",
            zIndex: isHovered ? 100 : isHighlighted ? 10 : 1,
            boxShadow: isHighlighted
              ? `0 0 20px ${element.color}90, 0 0 40px ${element.color}50`
              : isHovered
              ? `0 8px 16px -4px ${element.color}70`
              : "0 2px 4px rgba(0, 0, 0, 0.3)",
          }}
        >
          {/* Default View - Symbol and Atomic Number Only */}
          <div
            className="absolute inset-0 flex flex-col justify-center items-center p-1 transition-opacity duration-150"
            style={{ opacity: isHovered ? 0 : 1 }}
          >
            {/* Atomic Number - Top Corner */}
            <div className="absolute top-1 left-1 text-[7px] sm:text-[8px] md:text-[9px] lg:text-[10px] font-bold text-gray-900 leading-none">
              {element.atomicNumber}
            </div>

            {/* Symbol - Center */}
            <div className="text-base sm:text-lg md:text-2xl lg:text-3xl font-bold text-gray-900 leading-none">
              {element.symbol}
            </div>
          </div>

          {/* Hover View - Full Information */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-between p-0.5 transition-opacity duration-150"
            style={{ opacity: isHovered ? 1 : 0 }}
          >
            {/* Atomic Number */}
            <div className="text-[9px] font-bold text-gray-900 w-full text-left leading-none">
              {element.atomicNumber}
            </div>

            {/* Symbol - Reduced Size */}
            <div className="flex items-center justify-center flex-shrink-0">
              <div className="text-base font-bold text-gray-900 leading-none">{element.symbol}</div>
            </div>

            {/* Name and Atomic Weight */}
            <div className="text-center w-full overflow-hidden">
              <div className="text-[8.5px] font-bold text-gray-900 leading-tight mb-0.5 px-0.5 break-words">
                {element.name}
              </div>
              <div className="text-[7.5px] text-gray-800 leading-none font-semibold">
                {element.atomicMass.toFixed(3)}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// Memoize the component to prevent unnecessary re-renders
export default memo(ElementCard);
