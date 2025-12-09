"use client";

import React from "react";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { useCompoundCanvasStore } from "@/lib/stores/useCompoundCanvasStore";
import {
  getAvailableValence,
  shouldAutoGroup,
  canFormBond,
  determineBondType,
} from "@/lib/utils/chemistry-helpers";
import ElementBubble from "./ElementBubble";
import BondConnector from "./BondConnector";

export default function CompoundCanvas() {
  const {
    canvasElements,
    bonds,
    selectedElementId,
    selectedBondId,
    addBond,
    removeElement,
    updateGroupPosition,
    selectElement,
    selectBond,
    removeBond,
  } = useCompoundCanvasStore();

  const dragStartTimeRef = React.useRef<number>(0);
  const dragDistanceRef = React.useRef<number>(0);

  const handleDragStart = () => {
    dragStartTimeRef.current = Date.now();
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    const elementId = active.id as string;

    // Calculate drag distance and time
    const dragDistance = Math.sqrt(delta.x * delta.x + delta.y * delta.y);
    const dragTime = Date.now() - dragStartTimeRef.current;

    console.log(`Drag end: distance=${dragDistance.toFixed(1)}px, time=${dragTime}ms`);

    // If drag distance is very small, treat as click (not drag)
    if (dragDistance < 5) {
      console.log("Treating as click (minimal drag distance)");
      return;
    }

    // Only update position if it's an existing canvas element
    const draggedElement = canvasElements.find((el) => el.id === elementId);
    if (draggedElement) {
      console.log("Drag ended for:", draggedElement.element.symbol);

      // Update position
      updateGroupPosition(elementId, delta);

      // Check for auto-bonding after drag
      const newPosition = {
        x: draggedElement.position!.x + delta.x,
        y: draggedElement.position!.y + delta.y,
      };

      console.log("Checking for auto-bond after drag...");

      // Find nearby elements
      const nearbyElementIds = shouldAutoGroup(
        canvasElements
          .filter((el) => el.id !== elementId)
          .map((el) => ({
            id: el.id,
            position: el.position!,
          })),
        { id: elementId, position: newPosition },
        120 // threshold
      );

      // Try to bond with nearby elements
      nearbyElementIds.forEach((nearbyId) => {
        const nearbyElement = canvasElements.find((el) => el.id === nearbyId);
        if (
          nearbyElement &&
          canFormBond(
            draggedElement.element,
            nearbyElement.element,
            elementId,
            nearbyId,
            bonds
          )
        ) {
          console.log(
            `Auto-bonding after drag: ${draggedElement.element.symbol} + ${nearbyElement.element.symbol}`
          );
          addBond(elementId, nearbyId, "single");
        }
      });
    }
  };

  const handleCanvasClick = () => {
    selectElement(null);
    selectBond(null);
  };

  const handleElementSelect = (elementId: string) => {
    console.log("Element clicked:", elementId, "Current selected:", selectedElementId);

    if (selectedElementId && selectedElementId !== elementId) {
      // Create bond between selected elements (bond type determined automatically)
      console.log("Attempting to create bond between", selectedElementId, "and", elementId);
      addBond(selectedElementId, elementId, "single"); // Bond type will be auto-determined in store
    } else if (selectedElementId === elementId) {
      // Clicking same element deselects it
      console.log("Deselecting element:", elementId);
      selectElement(null);
    } else {
      // Select the element
      console.log("Selecting element:", elementId);
      selectElement(elementId);
    }
  };

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-full">
        {/* Info bar */}
        <div className="bg-gray-800 px-4 py-2 flex items-center gap-3 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-white font-medium text-sm">Auto-Bonding</span>
          </div>

          <div className="text-xs text-gray-400">
            {selectedElementId
              ? "Click another element to bond • Element stays selected if more bonds available"
              : "Click elements in left panel to add • Drag to reposition • Close elements auto-bond • Unbonded elements show yellow ! badge"}
          </div>

          <div className="ml-auto text-xs text-gray-400">
            {canvasElements.length > 0
              ? `${canvasElements.length} elements • ${bonds.length} bonds`
              : "Click elements to start"}
          </div>
        </div>

        {/* Canvas area */}
        <div
          onClick={handleCanvasClick}
          className="flex-1 bg-gray-900 relative overflow-hidden"
        >
          {/* Grid pattern (optional) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
              <pattern
                id="grid"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {/* Bonds and Groups (SVG) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {/* Group boundaries */}
            <g>
              {(() => {
                const groups = new Map<string, typeof canvasElements>();
                canvasElements.forEach((el) => {
                  if (el.groupId) {
                    if (!groups.has(el.groupId)) {
                      groups.set(el.groupId, []);
                    }
                    groups.get(el.groupId)!.push(el);
                  }
                });

                return Array.from(groups.entries()).map(([groupId, elements]) => {
                  if (elements.length < 2) return null;

                  // Calculate bounding box for group
                  const positions = elements
                    .map((el) => el.position)
                    .filter((pos): pos is { x: number; y: number } => pos !== undefined);

                  if (positions.length === 0) return null;

                  const minX = Math.min(...positions.map((p) => p.x)) - 40;
                  const maxX = Math.max(...positions.map((p) => p.x)) + 40;
                  const minY = Math.min(...positions.map((p) => p.y)) - 40;
                  const maxY = Math.max(...positions.map((p) => p.y)) + 40;

                  return (
                    <rect
                      key={groupId}
                      x={minX}
                      y={minY}
                      width={maxX - minX}
                      height={maxY - minY}
                      fill="rgba(59, 130, 246, 0.05)"
                      stroke="rgba(59, 130, 246, 0.3)"
                      strokeWidth="1"
                      strokeDasharray="5,5"
                      rx="8"
                      className="pointer-events-none"
                    />
                  );
                });
              })()}
            </g>

            {/* Bonds */}
            <g className="pointer-events-auto">
              {bonds.map((bond) => {
                const fromEl = canvasElements.find(
                  (el) => el.id === bond.fromElementId
                );
                const toEl = canvasElements.find(
                  (el) => el.id === bond.toElementId
                );

                if (!fromEl?.position || !toEl?.position) return null;

                return (
                  <BondConnector
                    key={bond.id}
                    bond={bond}
                    fromPosition={fromEl.position}
                    toPosition={toEl.position}
                    isSelected={selectedBondId === bond.id}
                    onSelect={() => selectBond(bond.id)}
                    onRemove={() => removeBond(bond.id)}
                  />
                );
              })}
            </g>
          </svg>

          {/* Elements */}
          {canvasElements.map((canvasElement) => {
            // Check if element is bonded
            const isBonded = bonds.some(
              (bond) =>
                bond.fromElementId === canvasElement.id ||
                bond.toElementId === canvasElement.id
            );

            // Get available valence
            const availableValence = getAvailableValence(
              canvasElement.element,
              canvasElement.id,
              bonds
            );

            const isSelected = selectedElementId === canvasElement.id;

            // Debug logging
            if (isSelected) {
              console.log("Selected element:", canvasElement.element.symbol, {
                isBonded,
                availableValence,
                totalBonds: bonds.filter(
                  (b) => b.fromElementId === canvasElement.id || b.toElementId === canvasElement.id
                ).length,
              });
            }

            return (
              <ElementBubble
                key={canvasElement.id}
                id={canvasElement.id}
                element={canvasElement.element}
                position={canvasElement.position!}
                isSelected={isSelected}
                isBonded={isBonded}
                availableValence={availableValence}
                onSelect={() => handleElementSelect(canvasElement.id)}
                onRemove={() => removeElement(canvasElement.id)}
              />
            );
          })}

          {/* Instructions */}
          {canvasElements.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-gray-500 bg-gray-800 bg-opacity-80 p-8 rounded-xl">
                <p className="text-xl mb-3">Click elements from left panel to add</p>
                <div className="text-sm space-y-2">
                  <p>• Drag elements to reposition</p>
                  <p>• Place close together (120px) to auto-bond</p>
                  <p>• Or click one element then another to bond</p>
                  <p>• Element stays selected if it can form more bonds (e.g., O can bond with 2 H)</p>
                  <p>• Click bond to select, then click X to break</p>
                  <p>• Click X on element to remove</p>
                  <p>• Unbonded elements show yellow ! badge</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DndContext>
  );
}
