"use client";

import { motion } from "framer-motion";
import { Element } from "@/lib/types/element";

interface PropertyGridProps {
  element: Element;
}

interface PropertyCardProps {
  label: string;
  value: string | number | null;
  unit?: string;
  index: number;
}

function PropertyCard({ label, value, unit, index }: PropertyCardProps) {
  if (value === null || value === undefined) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 md:p-4 hover:border-gray-600 transition-colors min-h-20 flex flex-col justify-between"
    >
      <div className="text-gray-400 text-xs md:text-sm mb-1 leading-tight">{label}</div>
      <div className="text-white text-base md:text-xl font-semibold wrap-break-word">
        {value} {unit && <span className="text-gray-400 text-sm md:text-base">{unit}</span>}
      </div>
    </motion.div>
  );
}

export default function PropertyGrid({ element }: PropertyGridProps) {
  const properties = [
    { label: "Phase", value: element.phase, unit: "" },
    { label: "Group", value: element.group, unit: "" },
    { label: "Period", value: element.period, unit: "" },
    { label: "Block", value: element.block, unit: "" },
    { label: "Melting Point", value: element.meltingPoint, unit: "K" },
    { label: "Boiling Point", value: element.boilingPoint, unit: "K" },
    { label: "Density", value: element.density, unit: "g/cm³" },
    { label: "Electronegativity", value: element.electronegativity, unit: "" },
    { label: "Atomic Radius", value: element.atomicRadius, unit: "pm" },
    {
      label: "Ionization Energy",
      value: element.ionizationEnergy,
      unit: "kJ/mol",
    },
    {
      label: "Oxidation States",
      value: element.oxidationStates.join(", "),
      unit: "",
    },
    {
      label: "Radioactive",
      value: element.isRadioactive ? "Yes" : "No",
      unit: "",
    },
  ];

  return (
    <div className="mb-12">
      <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 md:mb-6">Properties</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
        {properties.map((prop, index) => (
          <PropertyCard
            key={prop.label}
            label={prop.label}
            value={prop.value}
            unit={prop.unit}
            index={index}
          />
        ))}
      </div>

      {/* Electrons per Shell */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.6 }}
        className="mt-4 md:mt-6 bg-gray-800/50 border border-gray-700 rounded-lg p-4 md:p-6"
      >
        <h3 className="text-lg md:text-xl font-semibold text-white mb-3 md:mb-4">
          Electrons per Shell
        </h3>
        <div className="flex flex-wrap gap-2 md:gap-3">
          {element.electronsPerShell.map((count, index) => (
            <div
              key={index}
              className="bg-gray-700/50 px-3 md:px-4 py-2 rounded-lg border border-gray-600"
            >
              <span className="text-gray-400 text-xs md:text-sm">Shell {index + 1}:</span>{" "}
              <span className="text-white font-semibold text-sm md:text-base">{count}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
