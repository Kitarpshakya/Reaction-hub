"use client";

import { motion } from "framer-motion";
import { Isotope } from "@/lib/types/element";

interface IsotopesSectionProps {
  isotopes: Isotope[];
}

export default function IsotopesSection({ isotopes }: IsotopesSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8 md:mb-12 bg-gray-800/50 border border-gray-700 rounded-lg p-4 md:p-6"
    >
      <h2 className="text-xl md:text-2xl font-bold text-white mb-3 md:mb-4">Isotopes</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {isotopes.map((isotope, index) => (
          <motion.div
            key={isotope.massNumber}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="bg-gray-700/50 border border-gray-600 rounded-lg p-3 md:p-4"
          >
            <div className="flex items-center justify-between mb-2 gap-2">
              <h3 className="text-base md:text-lg font-semibold text-white truncate">
                {isotope.symbol}
              </h3>
              <span
                className={`px-2 py-1 rounded text-[10px] md:text-xs font-semibold whitespace-nowrap ${
                  isotope.isStable
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : "bg-red-500/20 text-red-400 border border-red-500/30"
                }`}
              >
                {isotope.isStable ? "Stable" : "Unstable"}
              </span>
            </div>

            {isotope.abundance !== null && isotope.abundance > 0 && (
              <div className="text-gray-300 text-xs md:text-sm mb-1">
                Abundance: <span className="font-semibold">{isotope.abundance}%</span>
              </div>
            )}

            {isotope.halfLife && (
              <div className="text-gray-300 text-xs md:text-sm break-words">
                Half-life: <span className="font-semibold">{isotope.halfLife}</span>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
