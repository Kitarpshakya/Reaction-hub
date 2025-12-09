"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCompoundCanvasStore } from "@/lib/stores/useCompoundCanvasStore";
import { validateCompound } from "@/lib/utils/chemical-validation";
import ValidationPanel from "./ValidationPanel";
import ExternalFactors from "./ExternalFactors";

interface CompoundDetailsProps {
  compoundId?: string; // For editing
}

export default function CompoundDetails({ compoundId }: CompoundDetailsProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const {
    canvasElements,
    bonds,
    externalFactors,
    compoundName,
    compoundDescription,
    setCompoundName,
    setCompoundDescription,
    getFormula,
    getMolarMass,
    reset,
  } = useCompoundCanvasStore();

  // Auto-expand external factors if any are enabled (for edit mode)
  const hasExternalFactors = Object.values(externalFactors).some(factor => factor?.enabled);
  const [showExternalFactors, setShowExternalFactors] = useState(hasExternalFactors);

  // Update showExternalFactors when loading compound data (edit mode)
  useEffect(() => {
    if (hasExternalFactors) {
      setShowExternalFactors(true);
    }
  }, [hasExternalFactors]);

  const formula = getFormula();
  const molarMass = getMolarMass();

  // Real-time validation
  const validation = useMemo(() => {
    return validateCompound(canvasElements, bonds);
  }, [canvasElements, bonds]);

  const handleSave = async () => {
    if (!session?.user) {
      setError("You must be logged in to save compounds");
      return;
    }

    if (!compoundName.trim()) {
      setError("Please enter a compound name");
      return;
    }

    if (canvasElements.length < 2) {
      setError("Please add at least 2 elements to the compound");
      return;
    }

    // Check validation status
    if (!validation.isValid) {
      setError(`Cannot save invalid compound: ${validation.explanation}`);
      return;
    }

    setSaving(true);
    setError("");

    try {
      // Create ID mapping from canvas instance IDs to saved element IDs
      const idMapping = new Map<string, string>();
      const mappedElements = canvasElements.map((el, index) => {
        // Use a stable ID: combination of element ID and index
        const stableId = `${el.elementId}-${index}`;
        idMapping.set(el.id, stableId);

        return {
          elementId: stableId,
          symbol: el.symbol,
          count: 1,
          position: el.position,
        };
      });

      // Map bond IDs to match the saved element IDs
      const mappedBonds = bonds.map(bond => ({
        ...bond,
        fromElementId: idMapping.get(bond.fromElementId) || bond.fromElementId,
        toElementId: idMapping.get(bond.toElementId) || bond.toElementId,
      }));

      // Prepare compound data
      const compoundData = {
        name: compoundName,
        formula,
        molarMass,
        description: compoundDescription || null,
        elements: mappedElements,
        bonds: mappedBonds,
        externalFactors,
        canvasData: {
          width: 800,
          height: 600,
          zoom: 1,
          offset: { x: 0, y: 0 },
        },
      };

      const url = compoundId
        ? `/api/compounds/${compoundId}`
        : "/api/compounds";
      const method = compoundId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(compoundData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save compound");
      }

      const data = await response.json();
      reset();
      router.push("/compounds");
    } catch (err) {
      console.error("Error saving compound:", err);
      setError(err instanceof Error ? err.message : "Failed to save compound");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    reset();
    router.push("/compounds");
  };

  return (
    <div className="bg-gray-800 p-6">
      <h3 className="text-white font-bold text-lg mb-4">Compound Details</h3>

      <div className="space-y-6">
        {/* Validation Panel */}
        <div>
          <h4 className="text-white font-semibold mb-3 text-sm">Chemical Validation</h4>
          <ValidationPanel validation={validation} />
        </div>

        {/* User Input Section */}
        <div className="space-y-4">
          <div>
            <label className="block text-white font-medium mb-2">
              Compound Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder={validation.compoundName || "e.g., Water, Carbon Dioxide"}
              value={compoundName}
              onChange={(e) => setCompoundName(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {validation.compoundName && !compoundName && (
              <p className="text-xs text-blue-400 mt-1">
                Suggested: {validation.compoundName}
              </p>
            )}
          </div>

          <div>
            <label className="block text-white font-medium mb-2">
              Description (optional)
            </label>
            <textarea
              placeholder="Enter a brief description of the compound..."
              value={compoundDescription}
              onChange={(e) => setCompoundDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="text-sm text-gray-400 bg-gray-700 p-3 rounded-lg space-y-1">
            <p className="flex justify-between">
              <span>Total elements:</span>
              <span className="text-white font-medium">{canvasElements.length}</span>
            </p>
            <p className="flex justify-between">
              <span>Bonded elements:</span>
              <span className="text-white font-medium">
                {(() => {
                  const bondedIds = new Set<string>();
                  bonds.forEach((b) => {
                    bondedIds.add(b.fromElementId);
                    bondedIds.add(b.toElementId);
                  });
                  return bondedIds.size;
                })()}
              </span>
            </p>
            <p className="flex justify-between">
              <span>Bonds:</span>
              <span className="text-white font-medium">{bonds.length}</span>
            </p>
            <p className="flex justify-between">
              <span>Molar Mass:</span>
              <span className="text-white font-medium">
                {molarMass > 0 ? `${molarMass.toFixed(3)} g/mol` : "—"}
              </span>
            </p>
            {canvasElements.length > 0 && bonds.length === 0 && (
              <p className="text-yellow-400 text-xs mt-2">
                ⚠️ No bonds yet - place elements close or click to connect
              </p>
            )}
          </div>
        </div>

        {/* External Factors - Collapsible */}
        <div className="bg-gray-700 rounded-lg">
          <button
            onClick={() => setShowExternalFactors(!showExternalFactors)}
            className="w-full flex items-center justify-between p-3 text-white hover:bg-gray-600 rounded-lg transition-colors"
          >
            <span className="font-semibold text-sm">⚙️ Reaction Conditions (Optional)</span>
            <svg
              className={`w-5 h-5 transition-transform ${showExternalFactors ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          {showExternalFactors && (
            <div className="px-3 pb-3">
              <ExternalFactors />
            </div>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-4 p-3 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg text-red-300">
          {error}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex justify-end gap-4 mt-6">
        <button
          onClick={handleCancel}
          disabled={saving}
          className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !validation.isValid || !compoundName.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={!validation.isValid ? "Fix validation errors before saving" : ""}
        >
          {saving ? "Saving..." : compoundId ? "Update Compound" : "Save Compound"}
        </button>
      </div>
    </div>
  );
}
