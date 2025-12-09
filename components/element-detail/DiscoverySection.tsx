"use client";

import { motion } from "framer-motion";
import { Element } from "@/lib/types/element";

interface DiscoverySectionProps {
  element: Element;
}

export default function DiscoverySection({ element }: DiscoverySectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8 md:mb-12 bg-gray-800/50 border border-gray-700 rounded-lg p-4 md:p-6"
    >
      <h2 className="text-xl md:text-2xl font-bold text-white mb-3 md:mb-4">Discovery</h2>
      <div className="space-y-3">
        {element.discoveredBy && (
          <div className="flex items-start gap-2 md:gap-3">
            <svg
              className="w-5 h-5 md:w-6 md:h-6 text-gray-400 mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <div className="min-w-0 flex-1">
              <div className="text-gray-400 text-xs md:text-sm">Discovered by</div>
              <div className="text-white text-base md:text-lg font-semibold break-words">
                {element.discoveredBy}
              </div>
            </div>
          </div>
        )}

        {element.yearDiscovered && (
          <div className="flex items-start gap-2 md:gap-3">
            <svg
              className="w-5 h-5 md:w-6 md:h-6 text-gray-400 mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <div>
              <div className="text-gray-400 text-xs md:text-sm">Year discovered</div>
              <div className="text-white text-base md:text-lg font-semibold">
                {element.yearDiscovered}
              </div>
            </div>
          </div>
        )}

        {!element.yearDiscovered && !element.discoveredBy && (
          <div className="text-gray-400 italic text-sm md:text-base">
            This element has been known since ancient times.
          </div>
        )}
      </div>
    </motion.div>
  );
}
