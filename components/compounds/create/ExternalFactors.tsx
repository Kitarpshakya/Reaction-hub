"use client";

import React from "react";
import { useCompoundCanvasStore } from "@/lib/stores/useCompoundCanvasStore";

export default function ExternalFactors() {
  const { externalFactors, setExternalFactors } = useCompoundCanvasStore();

  const toggleFactor = (factor: keyof typeof externalFactors) => {
    const current = externalFactors[factor];
    setExternalFactors({
      [factor]: {
        ...current,
        enabled: !current?.enabled,
      },
    });
  };

  const updateFactorValue = (
    factor: keyof typeof externalFactors,
    field: string,
    value: any
  ) => {
    const current = externalFactors[factor];
    setExternalFactors({
      [factor]: {
        ...current,
        [field]: value,
      },
    });
  };

  return (
    <div className="space-y-3">
        {/* Temperature */}
        <div className="bg-gray-700 rounded-lg p-3">
          <label className="flex items-center text-white cursor-pointer">
            <input
              type="checkbox"
              checked={externalFactors.temperature?.enabled || false}
              onChange={() => toggleFactor("temperature")}
              className="mr-2 cursor-pointer"
            />
            <span className="text-sm font-medium">🌡️ Temperature</span>
          </label>
          {externalFactors.temperature?.enabled && (
            <div className="mt-3 space-y-2 pl-6">
              <input
                type="number"
                placeholder="Value"
                value={externalFactors.temperature?.value || ""}
                onChange={(e) =>
                  updateFactorValue("temperature", "value", parseFloat(e.target.value))
                }
                className="w-full px-3 py-2 rounded-lg bg-gray-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={externalFactors.temperature?.unit || "K"}
                onChange={(e) => updateFactorValue("temperature", "unit", e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-gray-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="K">Kelvin (K)</option>
                <option value="C">Celsius (°C)</option>
              </select>
            </div>
          )}
        </div>

        {/* Pressure */}
        <div className="bg-gray-700 rounded-lg p-3">
          <label className="flex items-center text-white cursor-pointer">
            <input
              type="checkbox"
              checked={externalFactors.pressure?.enabled || false}
              onChange={() => toggleFactor("pressure")}
              className="mr-2 cursor-pointer"
            />
            <span className="text-sm font-medium">💨 Pressure</span>
          </label>
          {externalFactors.pressure?.enabled && (
            <div className="mt-3 space-y-2 pl-6">
              <input
                type="number"
                placeholder="Value"
                value={externalFactors.pressure?.value || ""}
                onChange={(e) =>
                  updateFactorValue("pressure", "value", parseFloat(e.target.value))
                }
                className="w-full px-3 py-2 rounded-lg bg-gray-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={externalFactors.pressure?.unit || "atm"}
                onChange={(e) => updateFactorValue("pressure", "unit", e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-gray-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="atm">Atmosphere (atm)</option>
                <option value="Pa">Pascal (Pa)</option>
              </select>
            </div>
          )}
        </div>

        {/* Catalyst */}
        <div className="bg-gray-700 rounded-lg p-3">
          <label className="flex items-center text-white cursor-pointer">
            <input
              type="checkbox"
              checked={externalFactors.catalyst?.enabled || false}
              onChange={() => toggleFactor("catalyst")}
              className="mr-2 cursor-pointer"
            />
            <span className="text-sm font-medium">⚗️ Catalyst</span>
          </label>
          {externalFactors.catalyst?.enabled && (
            <div className="mt-3 space-y-2 pl-6">
              <input
                type="text"
                placeholder="Catalyst name (e.g., Pt, Fe₂O₃)"
                value={externalFactors.catalyst?.name || ""}
                onChange={(e) => updateFactorValue("catalyst", "name", e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-gray-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                placeholder="Details (optional)"
                value={externalFactors.catalyst?.details || ""}
                onChange={(e) => updateFactorValue("catalyst", "details", e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-lg bg-gray-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          )}
        </div>

        {/* Heat */}
        <div className="bg-gray-700 rounded-lg p-3">
          <label className="flex items-center text-white cursor-pointer">
            <input
              type="checkbox"
              checked={externalFactors.heat?.enabled || false}
              onChange={() => toggleFactor("heat")}
              className="mr-2 cursor-pointer"
            />
            <span className="text-sm font-medium">🔥 Heat</span>
          </label>
          {externalFactors.heat?.enabled && (
            <div className="mt-3 pl-6">
              <textarea
                placeholder="Heat application details (optional)"
                value={externalFactors.heat?.details || ""}
                onChange={(e) => updateFactorValue("heat", "details", e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-lg bg-gray-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          )}
        </div>

        {/* Light */}
        <div className="bg-gray-700 rounded-lg p-3">
          <label className="flex items-center text-white cursor-pointer">
            <input
              type="checkbox"
              checked={externalFactors.light?.enabled || false}
              onChange={() => toggleFactor("light")}
              className="mr-2 cursor-pointer"
            />
            <span className="text-sm font-medium">💡 Light</span>
          </label>
          {externalFactors.light?.enabled && (
            <div className="mt-3 space-y-2 pl-6">
              <input
                type="number"
                placeholder="Wavelength (nm)"
                value={externalFactors.light?.wavelength || ""}
                onChange={(e) =>
                  updateFactorValue("light", "wavelength", parseFloat(e.target.value))
                }
                className="w-full px-3 py-2 rounded-lg bg-gray-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                placeholder="Details (optional)"
                value={externalFactors.light?.details || ""}
                onChange={(e) => updateFactorValue("light", "details", e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-lg bg-gray-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          )}
        </div>
    </div>
  );
}
