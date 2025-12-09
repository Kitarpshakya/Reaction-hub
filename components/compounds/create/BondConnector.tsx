"use client";

import React from "react";
import { Bond, BondType } from "@/lib/types/compound";
import { getBondDisplayName } from "@/lib/utils/chemistry-helpers";

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
        stroke={isSelected ? "#3B82F6" : "#6B7280"}
        strokeWidth={bondStyle.strokeWidth}
        strokeDasharray={bondStyle.strokeDasharray}
        className="cursor-pointer hover:stroke-blue-400 transition-colors"
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
            r="14"
            fill="#EF4444"
            stroke="white"
            strokeWidth="2"
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
            fontSize="18"
            fontWeight="bold"
            className="pointer-events-none"
          >
            ×
          </text>
          <title>Click to break bond</title>
        </g>
      )}

      {/* Bond type label (shown when selected or on hover) */}
      {isSelected && (
        <g transform={`translate(${midX}, ${midY - 30})`}>
          <rect
            x="-50"
            y="-12"
            width="100"
            height="24"
            fill="white"
            stroke="#3B82F6"
            strokeWidth="2"
            rx="6"
            className="drop-shadow-lg"
          />
          <text
            x="0"
            y="0"
            textAnchor="middle"
            dominantBaseline="central"
            fill="#1F2937"
            fontSize="11"
            fontWeight="600"
            className="pointer-events-none"
          >
            {getBondDisplayName(bond.bondType)}
          </text>
        </g>
      )}
    </g>
  );
}
