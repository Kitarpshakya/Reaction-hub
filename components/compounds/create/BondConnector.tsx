"use client";

import React from "react";
import { Bond, BondType } from "@/lib/types/compound";

interface BondConnectorProps {
  bond: Bond;
  fromPosition: { x: number; y: number };
  toPosition: { x: number; y: number };
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}

export default function BondConnector({
  bond,
  fromPosition,
  toPosition,
  isSelected,
  onSelect,
  onRemove,
}: BondConnectorProps) {
  // Calculate line properties
  const dx = toPosition.x - fromPosition.x;
  const dy = toPosition.y - fromPosition.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  // Calculate midpoint for remove button
  const midX = (fromPosition.x + toPosition.x) / 2;
  const midY = (fromPosition.y + toPosition.y) / 2;

  const getBondStyle = (type: BondType) => {
    switch (type) {
      case "single":
        return { strokeWidth: 3, strokeDasharray: "none" };
      case "double":
        return { strokeWidth: 5, strokeDasharray: "none" };
      case "triple":
        return { strokeWidth: 7, strokeDasharray: "none" };
      case "ionic":
        return { strokeWidth: 3, strokeDasharray: "10,5" };
      case "covalent":
        return { strokeWidth: 4, strokeDasharray: "none" };
      case "metallic":
        return { strokeWidth: 4, strokeDasharray: "5,5" };
      default:
        return { strokeWidth: 3, strokeDasharray: "none" };
    }
  };

  const bondStyle = getBondStyle(bond.bondType);

  return (
    <g>
      {/* Bond line */}
      <line
        x1={fromPosition.x}
        y1={fromPosition.y}
        x2={toPosition.x}
        y2={toPosition.y}
        stroke={isSelected ? "#60A5FA" : "#9CA3AF"}
        strokeWidth={isSelected ? bondStyle.strokeWidth + 2 : bondStyle.strokeWidth}
        strokeDasharray={bondStyle.strokeDasharray}
        className="cursor-pointer hover:stroke-blue-400 transition-all"
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      />

      {/* Invisible wider line for easier clicking */}
      <line
        x1={fromPosition.x}
        y1={fromPosition.y}
        x2={toPosition.x}
        y2={toPosition.y}
        stroke="transparent"
        strokeWidth={20}
        className="cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      />

      {/* Remove button (shown when selected) */}
      {isSelected && (
        <g transform={`translate(${midX}, ${midY})`}>
          <circle
            r="10"
            fill="#EF4444"
            stroke="white"
            strokeWidth="1.5"
            className="cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          />
          <text
            x="0"
            y="0"
            textAnchor="middle"
            dominantBaseline="central"
            fill="white"
            fontSize="14"
            fontWeight="bold"
            className="pointer-events-none"
          >
            ×
          </text>
          <title>Click to break bond</title>
        </g>
      )}

    </g>
  );
}
