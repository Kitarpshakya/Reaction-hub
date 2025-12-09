"use client";

import React from "react";
import { useCompoundCanvasStore } from "@/lib/stores/useCompoundCanvasStore";

interface ExampleCompound {
  name: string;
  elements: Array<{ symbol: string; position: { x: number; y: number } }>;
}

export default function QuickExamples() {
  const { reset } = useCompoundCanvasStore();

  const examples: ExampleCompound[] = [
    {
      name: "Water (H₂O)",
      elements: [
        { symbol: "H", position: { x: 300, y: 300 } },
        { symbol: "O", position: { x: 400, y: 300 } },
        { symbol: "H", position: { x: 500, y: 300 } },
      ],
    },
    {
      name: "Carbon Dioxide (CO₂)",
      elements: [
        { symbol: "O", position: { x: 300, y: 300 } },
        { symbol: "C", position: { x: 400, y: 300 } },
        { symbol: "O", position: { x: 500, y: 300 } },
      ],
    },
    {
      name: "Ammonia (NH₃)",
      elements: [
        { symbol: "N", position: { x: 400, y: 280 } },
        { symbol: "H", position: { x: 350, y: 340 } },
        { symbol: "H", position: { x: 400, y: 360 } },
        { symbol: "H", position: { x: 450, y: 340 } },
      ],
    },
  ];

  const loadExample = async (example: ExampleCompound) => {
    try {
      reset();

      // Fetch all needed elements
      const elementsData = await Promise.all(
        example.elements.map(async (el) => {
          const response = await fetch(`/api/elements/${el.symbol}`);
          if (response.ok) {
            const data = await response.json();
            return { element: data.element, position: el.position };
          }
          return null;
        })
      );

      // Add elements to canvas in sequence
      const { addElement } = useCompoundCanvasStore.getState();
      elementsData.forEach((data) => {
        if (data) {
          addElement(data.element, data.position);
        }
      });
    } catch (error) {
      console.error("Error loading example:", error);
    }
  };

  return (
    <div className="bg-gray-800 border-b border-gray-700 px-4 py-2">
      <div className="flex items-center gap-3">
        <span className="text-white font-medium text-sm">Quick:</span>
        <div className="flex gap-2">
          {examples.map((example) => (
            <button
              key={example.name}
              onClick={() => loadExample(example)}
              className="px-3 py-1.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-xs font-medium"
            >
              {example.name}
            </button>
          ))}
        </div>
        <div className="ml-auto text-xs text-gray-400">
          Click to auto-build
        </div>
      </div>
    </div>
  );
}
