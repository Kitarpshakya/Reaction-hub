"use client";

import { Atom, Bond } from "@/lib/types/organic";
import { getAtomColor, getAtomRadius, getBondStyle } from "@/lib/utils/organic-helpers";

interface MoleculeViewerProps {
  atoms: Atom[];
  bonds: Bond[];
  width?: number;
  height?: number;
  showHydrogens?: boolean;
  scale?: number;
}

export default function MoleculeViewer({
  atoms,
  bonds,
  width = 400,
  height = 300,
  showHydrogens = false,
  scale = 1,
}: MoleculeViewerProps) {
  if (atoms.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-white/5 border border-white/10 rounded-xl text-white/40"
        style={{ width, height }}
      >
        No structure data
      </div>
    );
  }

  // Calculate bounding box
  const xs = atoms.map(a => a.position.x);
  const ys = atoms.map(a => a.position.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const structureWidth = maxX - minX || 100;
  const structureHeight = maxY - minY || 100;
  const padding = 40;

  // Calculate scale to fit in viewBox
  const scaleX = (width - 2 * padding) / structureWidth;
  const scaleY = (height - 2 * padding) / structureHeight;
  const autoScale = Math.min(scaleX, scaleY, 1) * scale;

  // Center the structure
  const offsetX = (width - structureWidth * autoScale) / 2 - minX * autoScale;
  const offsetY = (height - structureHeight * autoScale) / 2 - minY * autoScale;

  // Transform atom positions
  const transformedAtoms = atoms.map(atom => ({
    ...atom,
    x: atom.position.x * autoScale + offsetX,
    y: atom.position.y * autoScale + offsetY,
  }));

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="bg-white/5 border border-white/10 rounded-xl"
    >
      {/* Render bonds first (so they appear behind atoms) */}
      {bonds.map((bond) => {
        const fromAtom = transformedAtoms.find(a => a.id === bond.from);
        const toAtom = transformedAtoms.find(a => a.id === bond.to);

        if (!fromAtom || !toAtom) return null;

        const bondStyle = getBondStyle(bond.type);

        // For double and triple bonds, draw multiple lines
        if (bond.type === "double") {
          const dx = toAtom.x - fromAtom.x;
          const dy = toAtom.y - fromAtom.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          const perpX = (-dy / len) * (bondStyle.offset || 3);
          const perpY = (dx / len) * (bondStyle.offset || 3);

          return (
            <g key={bond.id}>
              <line
                x1={fromAtom.x + perpX}
                y1={fromAtom.y + perpY}
                x2={toAtom.x + perpX}
                y2={toAtom.y + perpY}
                stroke="#FFFFFF"
                strokeWidth={bondStyle.strokeWidth}
                strokeDasharray={bondStyle.dashArray}
              />
              <line
                x1={fromAtom.x - perpX}
                y1={fromAtom.y - perpY}
                x2={toAtom.x - perpX}
                y2={toAtom.y - perpY}
                stroke="#FFFFFF"
                strokeWidth={bondStyle.strokeWidth}
                strokeDasharray={bondStyle.dashArray}
              />
            </g>
          );
        } else if (bond.type === "triple") {
          const dx = toAtom.x - fromAtom.x;
          const dy = toAtom.y - fromAtom.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          const perpX = (-dy / len) * (bondStyle.offset || 5);
          const perpY = (dx / len) * (bondStyle.offset || 5);

          return (
            <g key={bond.id}>
              <line
                x1={fromAtom.x}
                y1={fromAtom.y}
                x2={toAtom.x}
                y2={toAtom.y}
                stroke="#FFFFFF"
                strokeWidth={bondStyle.strokeWidth}
              />
              <line
                x1={fromAtom.x + perpX}
                y1={fromAtom.y + perpY}
                x2={toAtom.x + perpX}
                y2={toAtom.y + perpY}
                stroke="#FFFFFF"
                strokeWidth={bondStyle.strokeWidth}
              />
              <line
                x1={fromAtom.x - perpX}
                y1={fromAtom.y - perpY}
                x2={toAtom.x - perpX}
                y2={toAtom.y - perpY}
                stroke="#FFFFFF"
                strokeWidth={bondStyle.strokeWidth}
              />
            </g>
          );
        } else {
          // Single or aromatic bond
          return (
            <line
              key={bond.id}
              x1={fromAtom.x}
              y1={fromAtom.y}
              x2={toAtom.x}
              y2={toAtom.y}
              stroke="#FFFFFF"
              strokeWidth={bondStyle.strokeWidth}
              strokeDasharray={bondStyle.dashArray}
            />
          );
        }
      })}

      {/* Render atoms */}
      {transformedAtoms.map((atom) => {
        // Skip hydrogen if showHydrogens is false
        if (!showHydrogens && atom.element === "H") {
          return null;
        }

        const radius = getAtomRadius(atom.element, 12);
        const color = getAtomColor(atom.element);

        return (
          <g key={atom.id}>
            {/* Atom circle */}
            <circle
              cx={atom.x}
              cy={atom.y}
              r={radius}
              fill={color}
              stroke="#000000"
              strokeWidth="1.5"
            />
            {/* Element label */}
            <text
              x={atom.x}
              y={atom.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="14"
              fontWeight="bold"
              fill="#000000"
            >
              {atom.element}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
