"use client";

import React from "react";
import { ValidationResult } from "@/lib/utils/chemical-validation";

interface ValidationPanelProps {
  validation: ValidationResult;
}

export default function ValidationPanel({ validation }: ValidationPanelProps) {
  const getStatusColor = () => {
    switch (validation.status) {
      case "valid":
        return {
          bg: "bg-green-500 bg-opacity-20",
          border: "border-green-500",
          text: "text-green-300",
          icon: "✓",
        };
      case "warning":
        return {
          bg: "bg-yellow-500 bg-opacity-20",
          border: "border-yellow-500",
          text: "text-yellow-300",
          icon: "⚠",
        };
      case "invalid":
        return {
          bg: "bg-red-500 bg-opacity-20",
          border: "border-red-500",
          text: "text-red-300",
          icon: "✗",
        };
      default:
        return {
          bg: "bg-gray-500 bg-opacity-20",
          border: "border-gray-500",
          text: "text-gray-300",
          icon: "○",
        };
    }
  };

  const statusColor = getStatusColor();

  return (
    <div className="space-y-4">
      {/* Status Header */}
      <div
        className={`${statusColor.bg} ${statusColor.border} border rounded-lg p-4`}
      >
        <div className="flex items-start gap-3">
          <div className={`text-2xl ${statusColor.text}`}>{statusColor.icon}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className={`font-bold text-lg ${statusColor.text}`}>
                {validation.status === "valid"
                  ? "Valid Compound"
                  : validation.status === "warning"
                  ? "Valid with Warnings"
                  : "Invalid Compound"}
              </h4>
              <span className={`text-xs px-2 py-1 rounded ${statusColor.bg} ${statusColor.border} border ${statusColor.text}`}>
                {validation.bondType.toUpperCase()}
              </span>
            </div>
            <p className={`text-sm ${statusColor.text}`}>{validation.explanation}</p>
          </div>
        </div>
      </div>

      {/* Compound Name & Formula */}
      {validation.compoundName && (
        <div className="bg-gray-800 rounded-lg p-4 space-y-3">
          <div>
            <label className="text-gray-400 text-xs font-medium uppercase tracking-wide">
              IUPAC Name
            </label>
            <div className="text-white text-xl font-semibold mt-1">
              {validation.compoundName}
            </div>
          </div>

          <div>
            <label className="text-gray-400 text-xs font-medium uppercase tracking-wide">
              Chemical Formula
            </label>
            <div className="text-white text-2xl font-mono font-bold mt-1">
              {validation.formula}
            </div>
          </div>
        </div>
      )}

      {/* Details */}
      {validation.details && (
        <div className="bg-gray-800 rounded-lg p-4">
          <h5 className="text-white font-semibold mb-3 text-sm">Details</h5>
          <div className="space-y-2 text-sm">
            {validation.details.oxidationStates && (
              <div>
                <span className="text-gray-400">Oxidation States: </span>
                <span className="text-white font-mono">
                  {Object.entries(validation.details.oxidationStates)
                    .map(([symbol, state]) => {
                      const sign = state > 0 ? "+" : state < 0 ? "" : "";
                      return `${symbol}: ${sign}${state}`;
                    })
                    .join(", ")}
                </span>
              </div>
            )}

            {validation.details.chargeBalance && (
              <div>
                <span className="text-gray-400">Charge Balance: </span>
                <span className="text-green-300">{validation.details.chargeBalance}</span>
              </div>
            )}

            {validation.details.bondingPattern && (
              <div>
                <span className="text-gray-400">Bonding Pattern: </span>
                <span className="text-white">{validation.details.bondingPattern}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Warnings */}
      {validation.warnings && validation.warnings.length > 0 && (
        <div className="bg-yellow-500 bg-opacity-10 border border-yellow-500 rounded-lg p-4">
          <h5 className="text-yellow-300 font-semibold mb-2 text-sm flex items-center gap-2">
            <span>⚠</span> Warnings
          </h5>
          <ul className="space-y-1 text-sm text-yellow-200">
            {validation.warnings.map((warning, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-yellow-400">•</span>
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggestions */}
      {validation.suggestions && validation.suggestions.length > 0 && (
        <div className="bg-blue-500 bg-opacity-10 border border-blue-500 rounded-lg p-4">
          <h5 className="text-blue-300 font-semibold mb-2 text-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            Suggestions
          </h5>
          <ul className="space-y-1 text-sm text-blue-200">
            {validation.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-blue-400">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Bond Type Info */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h5 className="text-white font-semibold mb-3 text-sm">Bond Type Information</h5>
        <div className="text-sm text-gray-300">
          {validation.bondType === "ionic" && (
            <p>
              <strong className="text-blue-400">Ionic Bond:</strong> Formed between a metal and
              non-metal through transfer of electrons. One atom loses electrons (becomes cation),
              another gains electrons (becomes anion).
            </p>
          )}
          {validation.bondType === "covalent" && (
            <p>
              <strong className="text-green-400">Covalent Bond:</strong> Formed between non-metals
              through sharing of electron pairs. Atoms share electrons to achieve stable electron
              configurations.
            </p>
          )}
          {validation.bondType === "metallic" && (
            <p>
              <strong className="text-yellow-400">Metallic Bond:</strong> Formed between metal
              atoms through a sea of delocalized electrons. Electrons are shared among all atoms in
              the metallic lattice.
            </p>
          )}
          {validation.bondType === "mixed" && (
            <p>
              <strong className="text-purple-400">Mixed Bonding:</strong> Contains multiple types
              of chemical bonds. May include ionic, covalent, or metallic character.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
