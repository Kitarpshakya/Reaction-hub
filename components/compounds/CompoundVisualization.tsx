"use client";

import React, { useMemo } from "react";
import { Element } from "@/lib/types/element";
import { Bond, BondType, CompoundElement } from "@/lib/types/compound";

interface CompoundVisualizationProps {
  elements: CompoundElement[];
  bonds?: Bond[];
  allElements: Element[]; // Full element data
}

export default function CompoundVisualization({ elements, bonds = [], allElements }: CompoundVisualizationProps) {
  // Create element lookup map
  const elementLookup = useMemo(() => {
    const map = new Map<string, Element>();
    allElements.forEach((el) => {
      map.set(el.symbol, el);
    });
    return map;
  }, [allElements]);

  // Get element full data
  const enrichedElements = useMemo(() => {
    return elements
      .map((el) => ({
        ...el,
        element: elementLookup.get(el.symbol),
      }))
      .filter((el) => el.element !== undefined);
  }, [elements, elementLookup]);

  // Calculate canvas dimensions and center positions if not provided
  const { canvasWidth, canvasHeight, positionedElements } = useMemo(() => {
    const width = 800;
    const height = 600;

    // If positions are provided, use them and center the compound
    if (elements.every((el) => el.position)) {
      const tempPositions = enrichedElements.map((el, idx) => ({
        ...el,
        position: elements[idx].position || { x: 0, y: 0 },
      }));

      // Calculate bounding box of all elements
      const positions = tempPositions.map(el => el.position);
      const minX = Math.min(...positions.map(p => p.x));
      const maxX = Math.max(...positions.map(p => p.x));
      const minY = Math.min(...positions.map(p => p.y));
      const maxY = Math.max(...positions.map(p => p.y));

      // Calculate center of the compound
      const compoundCenterX = (minX + maxX) / 2;
      const compoundCenterY = (minY + maxY) / 2;

      // Calculate offset to center the compound in canvas
      const canvasCenterX = width / 2;
      const canvasCenterY = height / 2;
      const offsetX = canvasCenterX - compoundCenterX;
      const offsetY = canvasCenterY - compoundCenterY;

      // Apply offset to all positions
      return {
        canvasWidth: width,
        canvasHeight: height,
        positionedElements: tempPositions.map((el) => ({
          ...el,
          position: {
            x: el.position.x + offsetX,
            y: el.position.y + offsetY,
          },
        })),
      };
    }

    // Otherwise, create a simple grid layout
    const cols = Math.ceil(Math.sqrt(enrichedElements.length));
    const spacing = 120;
    const offsetX = width / 2 - ((cols - 1) * spacing) / 2;
    const offsetY = height / 2;

    return {
      canvasWidth: width,
      canvasHeight: height,
      positionedElements: enrichedElements.map((el, idx) => ({
        ...el,
        position: {
          x: offsetX + (idx % cols) * spacing,
          y: offsetY + Math.floor(idx / cols) * spacing - 100,
        },
      })),
    };
  }, [enrichedElements, elements]);

  // Get element color based on category
  const getElementColor = (category: string) => {
    const colors: Record<string, string> = {
      nonmetal: "#4ECDC4",
      "noble-gas": "#95E1D3",
      "alkali-metal": "#F38181",
      "alkaline-earth-metal": "#FDCB6E",
      "transition-metal": "#A29BFE",
      "post-transition-metal": "#74B9FF",
      metalloid: "#FD79A8",
      halogen: "#FF7675",
      lanthanide: "#FFEAA7",
      actinide: "#DFE6E9",
      unknown: "#808080",
    };
    return colors[category] || colors["unknown"];
  };

  // Calculate element radius
  const getElementRadius = (atomicMass: number) => {
    return Math.sqrt(atomicMass) * 2.5 + 20;
  };

  // Get bond color based on type
  const getBondColor = (bondType: BondType) => {
    const colors: Record<BondType, string> = {
      single: "#60A5FA",
      double: "#34D399",
      triple: "#FBBF24",
      ionic: "#F87171",
      covalent: "#60A5FA",
      metallic: "#A78BFA",
    };
    return colors[bondType] || "#60A5FA";
  };

  // Get bond stroke width based on type
  const getBondStrokeWidth = (bondType: BondType) => {
    const widths: Record<BondType, number> = {
      single: 2,
      double: 4,
      triple: 6,
      ionic: 2,
      covalent: 2,
      metallic: 3,
    };
    return widths[bondType] || 2;
  };

  return (
    <div className="bg-gray-900 rounded-lg p-4">
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
        className="w-full h-full"
        style={{ minHeight: "400px" }}
      >
        {/* Background grid */}
        <defs>
          <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-pattern)" />

        {/* Bonds */}
        <g>
          {bonds.map((bond, idx) => {
            // Find elements by elementId
            const fromEl = positionedElements.find((el) => el.elementId === bond.fromElementId);
            const toEl = positionedElements.find((el) => el.elementId === bond.toElementId);

            if (!fromEl?.position || !toEl?.position || !fromEl.element || !toEl.element) {
              console.warn(`Bond ${idx} skipped: could not find elements`, {
                fromId: bond.fromElementId,
                toId: bond.toElementId,
                availableIds: positionedElements.map((e) => e.elementId),
              });
              return null;
            }

            const fromRadius = getElementRadius(fromEl.element.atomicMass);
            const toRadius = getElementRadius(toEl.element.atomicMass);

            // Calculate bond line (from edge to edge of circles)
            const dx = toEl.position.x - fromEl.position.x;
            const dy = toEl.position.y - fromEl.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance === 0) return null;

            const fromX = fromEl.position.x + (dx / distance) * fromRadius;
            const fromY = fromEl.position.y + (dy / distance) * fromRadius;
            const toX = toEl.position.x - (dx / distance) * toRadius;
            const toY = toEl.position.y - (dy / distance) * toRadius;

            const bondColor = getBondColor(bond.bondType);
            const strokeWidth = getBondStrokeWidth(bond.bondType);

            // For double and triple bonds, draw multiple lines
            if (bond.bondType === "double") {
              const offset = 3;
              const perpX = -dy / distance;
              const perpY = dx / distance;

              return (
                <g key={bond.id || idx}>
                  <line
                    x1={fromX + perpX * offset}
                    y1={fromY + perpY * offset}
                    x2={toX + perpX * offset}
                    y2={toY + perpY * offset}
                    stroke={bondColor}
                    strokeWidth={2}
                    strokeLinecap="round"
                  />
                  <line
                    x1={fromX - perpX * offset}
                    y1={fromY - perpY * offset}
                    x2={toX - perpX * offset}
                    y2={toY - perpY * offset}
                    stroke={bondColor}
                    strokeWidth={2}
                    strokeLinecap="round"
                  />
                </g>
              );
            } else if (bond.bondType === "triple") {
              const offset = 5;
              const perpX = -dy / distance;
              const perpY = dx / distance;

              return (
                <g key={bond.id || idx}>
                  <line
                    x1={fromX}
                    y1={fromY}
                    x2={toX}
                    y2={toY}
                    stroke={bondColor}
                    strokeWidth={2}
                    strokeLinecap="round"
                  />
                  <line
                    x1={fromX + perpX * offset}
                    y1={fromY + perpY * offset}
                    x2={toX + perpX * offset}
                    y2={toY + perpY * offset}
                    stroke={bondColor}
                    strokeWidth={2}
                    strokeLinecap="round"
                  />
                  <line
                    x1={fromX - perpX * offset}
                    y1={fromY - perpY * offset}
                    x2={toX - perpX * offset}
                    y2={toY - perpY * offset}
                    stroke={bondColor}
                    strokeWidth={2}
                    strokeLinecap="round"
                  />
                </g>
              );
            } else if (bond.bondType === "ionic") {
              // Ionic bonds shown as dashed lines
              return (
                <line
                  key={bond.id || idx}
                  x1={fromX}
                  y1={fromY}
                  x2={toX}
                  y2={toY}
                  stroke={bondColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray="5,5"
                  strokeLinecap="round"
                />
              );
            } else {
              // Single, covalent, or metallic bonds
              return (
                <line
                  key={bond.id || idx}
                  x1={fromX}
                  y1={fromY}
                  x2={toX}
                  y2={toY}
                  stroke={bondColor}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                />
              );
            }
          })}
        </g>

        {/* Elements */}
        <g>
          {positionedElements.map((el, idx) => {
            if (!el.element || !el.position) return null;

            const radius = getElementRadius(el.element.atomicMass);
            const color = getElementColor(el.element.category);

            return (
              <g key={`${el.symbol}-${idx}`}>
                {/* Element circle */}
                <circle
                  cx={el.position.x}
                  cy={el.position.y}
                  r={radius}
                  fill={color}
                  stroke="white"
                  strokeWidth="2"
                  opacity="0.9"
                />

                {/* Element symbol */}
                <text
                  x={el.position.x}
                  y={el.position.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize={radius > 30 ? "20" : "16"}
                  fontWeight="bold"
                  style={{ userSelect: "none" }}
                >
                  {el.symbol}
                </text>

                {/* Count badge if > 1 */}
                {el.count > 1 && (
                  <g>
                    <circle
                      cx={el.position.x + radius - 10}
                      cy={el.position.y - radius + 10}
                      r="12"
                      fill="#6C5CE7"
                      stroke="white"
                      strokeWidth="1.5"
                    />
                    <text
                      x={el.position.x + radius - 10}
                      y={el.position.y - radius + 10}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="white"
                      fontSize="10"
                      fontWeight="bold"
                      style={{ userSelect: "none" }}
                    >
                      {el.count}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-1 bg-blue-400"></div>
          <span className="text-gray-400">Single</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-1 bg-green-400" style={{ height: "4px" }}></div>
          <span className="text-gray-400">Double</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-1 bg-yellow-400" style={{ height: "6px" }}></div>
          <span className="text-gray-400">Triple</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-1 bg-red-400 border-dashed border-t-2"></div>
          <span className="text-gray-400">Ionic</span>
        </div>
      </div>
    </div>
  );
}
