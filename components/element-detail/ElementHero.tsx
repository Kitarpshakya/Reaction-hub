"use client";

import { motion } from "framer-motion";
import { Element } from "@/lib/types/element";

interface ElementHeroProps {
  element: Element;
}

export default function ElementHero({ element }: ElementHeroProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 md:p-8 flex flex-col items-center justify-center text-center min-h-[400px]"
      style={{
        background: `linear-gradient(135deg, ${element.color}15 0%, ${element.color}05 100%)`,
        borderColor: `${element.color}40`,
      }}
    >
      {/* Atomic Number */}
      <div className="text-base md:text-xl font-semibold text-gray-400 mb-2">
        Atomic Number
      </div>
      <div className="text-4xl md:text-6xl font-bold mb-4 md:mb-6" style={{ color: element.color }}>
        {element.atomicNumber}
      </div>

      {/* Symbol */}
      <div
        className="text-6xl md:text-8xl lg:text-9xl font-bold mb-4"
        style={{ color: element.color }}
      >
        {element.symbol}
      </div>

      {/* Name */}
      <h1 className="text-2xl md:text-4xl font-bold text-white mb-2 break-words">{element.name}</h1>

      {/* Atomic Mass */}
      <div className="text-lg md:text-2xl text-gray-300 mb-4">
        {element.atomicMass.toFixed(4)} u
      </div>

      {/* Category Badge */}
      <div
        className="px-4 md:px-6 py-2 rounded-full text-gray-900 font-semibold text-xs md:text-sm uppercase tracking-wider break-words max-w-full"
        style={{ backgroundColor: element.color }}
      >
        {element.category.replace(/-/g, " ")}
      </div>

      {/* Electron Configuration */}
      <div className="mt-6 text-gray-400 text-sm md:text-lg">
        <span className="font-semibold">Electron Configuration:</span>
        <div className="text-white mt-1 break-all">{element.electronConfiguration}</div>
      </div>
    </motion.div>
  );
}
