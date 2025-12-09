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
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? "grabbing" : "move",
  };

  const categoryColor = getCategoryColor(element.category);

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    console.log("Removing element:", element.symbol);
    onRemove();
  };

  const handleElementClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("Element clicked (from bubble):", element.symbol, "isDragging:", isDragging);
    // Always call onSelect - let the parent handle the logic
    onSelect();
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-full flex flex-col items-center justify-center transition-all duration-200 cursor-pointer ${
        isSelected
          ? "ring-4 ring-blue-400 shadow-lg shadow-blue-400/50 scale-105"
          : isBonded
          ? "ring-2 shadow-md hover:scale-105 hover:shadow-lg"
          : "ring-2 ring-dashed ring-yellow-400 shadow-md hover:scale-105 hover:shadow-lg"
      }`}
      onClick={handleElementClick}
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
        }}
        {...listeners}
        {...attributes}
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
        }}
        onTouchStart={(e) => {
          e.stopPropagation();
        }}
        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600 active:bg-red-700 transition-colors shadow-lg z-20 cursor-pointer font-bold text-lg border-2 border-white"
        title="Remove element"
        type="button"
      >
        ×
      </button>

      {/* Unbonded indicator */}
      {!isBonded && (
        <div
          className="absolute -bottom-1 -left-1 bg-yellow-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-xl z-30 text-sm font-bold border-2 border-white"
          title="Unbonded - not included in formula"
          style={{ pointerEvents: "none" }}
        >
          !
        </div>
      )}

      {/* Available valence indicator (shown when selected) */}
      {isSelected && availableValence > 0 && (
        <div
          className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-green-500 text-white rounded px-2 py-1 flex items-center justify-center shadow-xl z-50 text-xs font-bold whitespace-nowrap border-2 border-white"
          title={`Can form ${availableValence} more bond${availableValence > 1 ? "s" : ""}`}
          style={{ pointerEvents: "none" }}
        >
          +{availableValence}
        </div>
      )}

      {/* Full valence indicator (shown when selected and no bonds available) */}
      {isSelected && availableValence === 0 && isBonded && (
        <div
          className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-red-500 text-white rounded px-2 py-1 flex items-center justify-center shadow-xl z-50 text-xs font-bold whitespace-nowrap border-2 border-white"
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
