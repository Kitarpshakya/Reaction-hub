"use client";

import React, { Suspense, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { Element } from "@/lib/types/element";
import { Bond, CompoundElement } from "@/lib/types/compound";
import { calculateBoundingBox } from "@/lib/utils/molecular-geometry";
import { getAtomColor, get3DAtomRadius } from "@/lib/utils/organic-helpers";
import AtomSphere from "./visualization3d/AtomSphere";
import BondCylinder from "./visualization3d/BondCylinder";

interface CompoundVisualization3DProps {
  elements: CompoundElement[];
  bonds?: Bond[];
  allElements: Element[];
}

function MoleculeScene({
  elements,
  bonds = [],
  allElements,
  showBonds,
}: CompoundVisualization3DProps & { showBonds: boolean }) {
  // Create element lookup map
  const elementLookup = useMemo(() => {
    const map = new Map<string, Element>();
    allElements.forEach((el) => map.set(el.symbol, el));
    return map;
  }, [allElements]);

  // Mode for rendering: ball-stick when bonds visible, space-filling when hidden
  const renderMode = showBonds ? "ball-stick" : ("space-filling" as const);

  // Enrich elements with full data and adjust positions for space-filling model
  const enrichedElements = useMemo(() => {
    const enriched = elements
      .map((el) => ({
        ...el,
        element: elementLookup.get(el.symbol),
      }))
      .filter((el) => el.element !== undefined && el.position3D !== undefined);

    // If bonds are hidden, reposition atoms to touch tangentially (space-filling)
    if (!showBonds && enriched.length > 1 && bonds.length > 0) {
      // Build adjacency map from bonds
      const adjacency = new Map<string, { partnerId: string; partnerElement: Element }[]>();

      bonds.forEach((bond) => {
        const fromEl = enriched.find((e) => e.elementId === bond.fromElementId);
        const toEl = enriched.find((e) => e.elementId === bond.toElementId);

        if (fromEl?.element && toEl?.element) {
          if (!adjacency.has(bond.fromElementId)) adjacency.set(bond.fromElementId, []);
          if (!adjacency.has(bond.toElementId)) adjacency.set(bond.toElementId, []);

          adjacency.get(bond.fromElementId)!.push({ partnerId: bond.toElementId, partnerElement: toEl.element });
          adjacency.get(bond.toElementId)!.push({ partnerId: bond.fromElementId, partnerElement: fromEl.element });
        }
      });

      // BFS to position atoms tangentially starting from first atom
      const positioned = new Map<string, { x: number; y: number; z: number }>();
      const visited = new Set<string>();

      // Start from first atom at origin
      const startAtom = enriched[0];
      if (startAtom.position3D) {
        positioned.set(startAtom.elementId, { x: 0, y: 0, z: 0 });
        visited.add(startAtom.elementId);

        const queue = [startAtom.elementId];

        while (queue.length > 0) {
          const currentId = queue.shift()!;
          const currentPos = positioned.get(currentId)!;
          const currentEl = enriched.find((e) => e.elementId === currentId);

          if (!currentEl?.element) continue;

          const neighbors = adjacency.get(currentId) || [];

          neighbors.forEach(({ partnerId, partnerElement }) => {
            if (visited.has(partnerId)) return;

            const partner = enriched.find((e) => e.elementId === partnerId);
            if (!partner?.position3D) return;

            // Calculate overlapping distance using van der Waals radii (space-filling mode)
            // Multiply by 0.65 to create ~35% overlap for that fused/merged look
            const r1 = get3DAtomRadius(currentEl.element!.symbol, "space-filling");
            const r2 = get3DAtomRadius(partnerElement.symbol, "space-filling");
            const overlappingDist = (r1 + r2) * 0.65;

            // Get direction from original positions
            const origCurrent = enriched.find((e) => e.elementId === currentId)?.position3D;
            const origPartner = partner.position3D;

            if (origCurrent && origPartner) {
              const dx = origPartner.x - origCurrent.x;
              const dy = origPartner.y - origCurrent.y;
              const dz = origPartner.z - origCurrent.z;
              const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;

              // Normalize direction and scale by overlapping distance
              const newPos = {
                x: currentPos.x + (dx / dist) * overlappingDist,
                y: currentPos.y + (dy / dist) * overlappingDist,
                z: currentPos.z + (dz / dist) * overlappingDist,
              };

              positioned.set(partnerId, newPos);
              visited.add(partnerId);
              queue.push(partnerId);
            }
          });
        }
      }

      // Apply new positions, fallback to original for unvisited atoms
      return enriched.map((el) => ({
        ...el,
        position3D: positioned.get(el.elementId) || el.position3D,
      }));
    }

    return enriched;
  }, [elements, elementLookup, showBonds, bonds]);

  // Calculate camera position based on bounding box
  const cameraDistance = useMemo(() => {
    const bbox = calculateBoundingBox(enrichedElements);
    return Math.max(bbox.size * 2, 10);
  }, [enrichedElements]);

  return (
    <>
      {/* Enhanced Lighting for Glossy Effect */}
      <ambientLight intensity={0.4} />
      <hemisphereLight args={["#ffffff", "#444444", 0.6]} />

      {/* Main Key Light (creates primary highlight) */}
      <directionalLight position={[10, 10, 10]} intensity={1.2} color="#ffffff" castShadow={false} />

      {/* Fill Light (softens shadows) */}
      <pointLight position={[-8, 5, -8]} intensity={0.6} color="#ffffff" />

      {/* Rim Light (creates edge highlights) */}
      <pointLight position={[0, -10, 10]} intensity={0.5} color="#b3d9ff" />

      {/* Top Light (enhances glossy appearance) */}
      <spotLight position={[0, 15, 0]} angle={0.6} penumbra={0.5} intensity={0.8} color="#ffffff" />

      {/* Bonds (only show when toggle is ON) */}
      {showBonds &&
        bonds.map((bond, idx) => {
          // Find the elements for this bond
          const fromElement = enrichedElements.find((el) => el.elementId === bond.fromElementId);
          const toElement = enrichedElements.find((el) => el.elementId === bond.toElementId);

          if (!fromElement?.position3D || !toElement?.position3D) return null;

          return (
            <BondCylinder
              key={`bond-${idx}`}
              from={fromElement.position3D}
              to={toElement.position3D}
              bondType={bond.bondType}
            />
          );
        })}

      {/* Atoms */}
      {enrichedElements.map((el, idx) => {
        if (!el.element || !el.position3D) return null;

        return (
          <AtomSphere
            key={`${el.symbol}-${idx}`}
            position={el.position3D}
            element={el.element}
            count={el.count}
            mode={renderMode}
          />
        );
      })}

      {/* Environment Map for Reflections */}
      <Environment preset="studio" />

      {/* Camera Controls */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        minDistance={5}
        maxDistance={50}
        autoRotate
        autoRotateSpeed={0.5}
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.5}
        makeDefault
      />
    </>
  );
}

export default function CompoundVisualization3D({ elements, bonds = [], allElements }: CompoundVisualization3DProps) {
  const [showBonds, setShowBonds] = useState(true);

  // Create element lookup for info badge
  const elementLookup = useMemo(() => {
    const map = new Map<string, Element>();
    allElements.forEach((el) => map.set(el.symbol, el));
    return map;
  }, [allElements]);

  // Group elements by unique type for info badge
  const uniqueElements = useMemo(() => {
    const elementMap = new Map<string, { element: Element; count: number; color: string }>();

    elements.forEach((el) => {
      const fullElement = elementLookup.get(el.symbol);
      if (fullElement) {
        if (elementMap.has(el.symbol)) {
          elementMap.get(el.symbol)!.count += 1;
        } else {
          elementMap.set(el.symbol, {
            element: fullElement,
            count: 1,
            color: getAtomColor(fullElement.symbol),
          });
        }
      }
    });

    return Array.from(elementMap.values());
  }, [elements, elementLookup]);

  // Group bonds by type for info badge
  const bondInfo = useMemo(() => {
    const bondMap = new Map<string, { type: string; count: number; color: string }>();

    const bondColors: Record<string, string> = {
      single: "#B0B0B0",
      covalent: "#B0B0B0",
      double: "#34D399",
      triple: "#FBBF24",
      ionic: "#F87171",
      metallic: "#A78BFA",
    };

    bonds.forEach((bond) => {
      const type = bond.bondType;
      if (bondMap.has(type)) {
        bondMap.get(type)!.count += 1;
      } else {
        bondMap.set(type, {
          type,
          count: 1,
          color: bondColors[type] || "#9CA3AF",
        });
      }
    });

    return Array.from(bondMap.values());
  }, [bonds]);

  return (
    <div className="bg-black border border-gray-700 rounded-2xl p-4 h-[400px] md:h-[500px] lg:h-[600px] relative overflow-hidden">
      {/* Bond Toggle Button - Top Right */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={() => setShowBonds(!showBonds)}
          className="flex items-center gap-2 bg-gray-900/90 backdrop-blur-sm px-3 py-2 rounded-lg border border-gray-700 hover:border-gray-600 transition-all shadow-xl cursor-pointer"
        >
          <div
            className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
              showBonds ? "bg-[#6C5CE7] border-[#6C5CE7]" : "bg-transparent border-gray-500"
            }`}
          >
            {showBonds && (
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <span className="text-sm font-medium text-gray-300">Show Bonds</span>
        </button>
      </div>

      {/* Info Badge - Elements & Bonds */}
      <div className="absolute top-4 left-4 z-10 bg-gray-900/90 backdrop-blur-sm px-4 py-2.5 rounded-lg border border-gray-700 shadow-xl max-w-xs">
        {/* Elements Section */}
        <div className="text-gray-400 text-xs font-medium mb-2">Elements</div>
        <div className="space-y-1.5">
          {uniqueElements.map((item) => {
            return (
              <div key={`element-${item.element.symbol}`} className="flex items-center gap-2 text-xs">
                <div
                  className="w-3 h-3 rounded-full border border-white/30 shadow-sm"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-white font-medium">{item.element.symbol}</span>
                <span className="text-gray-400">({item.element.name})</span>
                {item.count > 1 && <span className="text-[#6C5CE7] font-semibold ml-auto">×{item.count}</span>}
              </div>
            );
          })}
        </div>

        {/* Bonds Section */}
        {showBonds && bondInfo.length > 0 && (
          <>
            <div className="text-gray-400 text-xs font-medium mt-3 mb-2 pt-2 border-t border-gray-700">Bonds</div>
            <div className="space-y-1.5">
              {bondInfo.map((bond) => {
                const bondLabel = bond.type.charAt(0).toUpperCase() + bond.type.slice(1);
                return (
                  <div key={`bond-${bond.type}`} className="flex items-center gap-2 text-xs">
                    <div className="w-4 h-1 rounded-full" style={{ backgroundColor: bond.color }} />
                    <span className="text-white font-medium">{bondLabel}</span>
                    {bond.count > 1 && <span className="text-[#6C5CE7] font-semibold ml-auto">×{bond.count}</span>}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Summary */}
        <div className="text-gray-500 text-[10px] mt-2 pt-2 border-t border-gray-700">
          {elements.length} atoms • {bonds.length} bonds
        </div>
      </div>

      {/* Canvas */}
      <Canvas
        camera={{ position: [10, 7, 10], fov: 45 }}
        className="w-full h-full cursor-grab clicking:cursor-grabbing"
        shadows={false}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
          toneMapping: 2, // ACESFilmicToneMapping
          toneMappingExposure: 1.2,
        }}
      >
        <Suspense fallback={null}>
          <MoleculeScene elements={elements} bonds={bonds} allElements={allElements} showBonds={showBonds} />
        </Suspense>
      </Canvas>

      {/* Controls Hint */}
      <div className="absolute bottom-4 right-4 text-gray-500 text-xs bg-gray-900/70 px-2 py-1 rounded border border-gray-700/50">
        Drag to rotate • Scroll to zoom • Right-click to pan
      </div>
    </div>
  );
}
