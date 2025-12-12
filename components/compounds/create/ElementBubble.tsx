"use client";

import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { Element } from "@/lib/types/element";
import { getCategoryColor } from "@/lib/utils/element-helpers";

interface ElementBubbleProps {
  id: string;
  element: Element;
  position: { x: number; y: number };
  isSelected: boolean;
  isBonded?: boolean;
  availableValence: number;
  onSelect: () => void;
  onRemove: () => void;
}

export default function ElementBubble({
  id,
  element,
  position,
  isSelected,
  isBonded = false,
  availableValence,
  onSelect,
  onRemove,
}: ElementBubbleProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
  });

  // Debug logging for selected elements
  React.useEffect(() => {
    if (isSelected) {
      console.log("ElementBubble render:", element.symbol, {
        isSelected,
        isBonded,
        availableValence,
      });
    }
  }, [isSelected, isBonded, availableValence, element.symbol]);

  // Fixed size for all elements
  const bubbleSize = 60; // Fixed size in pixels

  const style: React.CSSProperties = {
    position: "absolute",
    left: transform ? position.x + transform.x : position.x,
    top: transform ? position.y + transform.y : position.y,
    width: bubbleSize,
    height: bubbleSize,
    transform: "translate(-50%, -50%)",
    opacity: isDragging ? 0.7 : 1,
    cursor: isDragging ? "grabbing" : "grab",
    zIndex: isDragging ? 1000 : 1,
    transition: isDragging ? "none" : "transform 0.2s ease, box-shadow 0.2s ease",
  };

  const categoryColor = getCategoryColor(element.category);

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    console.log("Removing element:", element.symbol);
    onRemove();
  };


  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-full flex flex-col items-center justify-center transition-all duration-200 ${
        isSelected
          ? "ring-4 ring-blue-400 shadow-lg shadow-blue-400/60 scale-110 animate-pulse"
          : isBonded
          ? "ring-1 shadow-md hover:scale-105 hover:shadow-lg cursor-pointer"
          : "ring-2 ring-dashed ring-yellow-400 shadow-md hover:scale-105 hover:shadow-lg cursor-pointer"
      }`}
      {...listeners}
      {...attributes}
    >
      <div
        className={`w-full h-full rounded-full flex flex-col items-center justify-center ${
          !isBonded ? "opacity-70" : ""
        }`}
        style={{
          backgroundColor: categoryColor,
          borderColor: adjustColor(categoryColor, -20),
          borderWidth: "2px",
          borderStyle: isBonded ? "solid" : "dashed",
          pointerEvents: "none", // Prevent inner div from interfering with drag
        }}
      >
        <div className="text-xl font-bold text-black">
          {element.symbol}
        </div>
      </div>

      {/* Remove button - separate from draggable area */}
      <button
        onClick={handleRemoveClick}
        onMouseDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        onTouchStart={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        className="absolute -top-0.5 -right-0.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600 active:bg-red-700 transition-colors shadow-md cursor-pointer font-bold text-sm border border-white"
        style={{
          pointerEvents: "auto",
          zIndex: 9999,
        }}
        title="Remove element"
        type="button"
      >
        ×
      </button>

      {/* Unbonded indicator */}
      {!isBonded && (
        <div
          className="absolute -bottom-0.5 -left-0.5 bg-yellow-500 text-white rounded-full w-5 h-5 flex items-center justify-center shadow-md z-30 text-xs font-bold border border-white"
          title="Unbonded - not included in formula"
          style={{ pointerEvents: "none" }}
        >
          !
        </div>
      )}

      {/* Available valence indicator (shown when selected) */}
      {isSelected && availableValence > 0 && (
        <div
          className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 bg-green-500 text-white rounded px-1.5 py-0.5 flex items-center justify-center shadow-md z-50 text-[10px] font-bold whitespace-nowrap border border-white"
          title={`Can form ${availableValence} more bond${availableValence > 1 ? "s" : ""}`}
          style={{ pointerEvents: "none" }}
        >
          +{availableValence}
        </div>
      )}

      {/* Full valence indicator (shown when selected and no bonds available) */}
      {isSelected && availableValence === 0 && isBonded && (
        <div
          className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 bg-red-500 text-white rounded px-1.5 py-0.5 flex items-center justify-center shadow-md z-50 text-[10px] font-bold whitespace-nowrap border border-white"
          title="Cannot form more bonds"
          style={{ pointerEvents: "none" }}
        >
          FULL
        </div>
      )}
    </div>
  );
}

// Helper function to adjust color brightness
function adjustColor(color: string, amount: number): string {
  const hex = color.replace("#", "");
  const r = Math.max(0, Math.min(255, parseInt(hex.slice(0, 2), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(hex.slice(2, 4), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(hex.slice(4, 6), 16) + amount));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b
    .toString(16)
    .padStart(2, "0")}`;
}
