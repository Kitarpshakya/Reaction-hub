import { ElementCategory } from "@/lib/types/element";

// Category colors from the design specification
export function getCategoryColor(category: ElementCategory): string {
  const colors: Record<ElementCategory, string> = {
    "nonmetal": "#4ECDC4",
    "noble-gas": "#95E1D3",
    "alkali-metal": "#F38181",
    "alkaline-earth-metal": "#FDCB6E",
    "transition-metal": "#A29BFE",
    "post-transition-metal": "#74B9FF",
    "metalloid": "#FD79A8",
    "halogen": "#FF7675",
    "lanthanide": "#FFEAA7",
    "actinide": "#DFE6E9",
    "unknown": "#B2BEC3",
  };

  return colors[category] || colors.unknown;
}

// Get next element (for navigation)
export function getNextElement(atomicNumber: number, totalElements: number = 118): number | null {
  return atomicNumber < totalElements ? atomicNumber + 1 : null;
}

// Get previous element (for navigation)
export function getPreviousElement(atomicNumber: number): number | null {
  return atomicNumber > 1 ? atomicNumber - 1 : null;
}

// Format electron configuration with superscripts
export function formatElectronConfiguration(config: string): string {
  return config
    .replace(/(\d+)/g, (match) =>
      match
        .split("")
        .map((d) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[parseInt(d)])
        .join("")
    );
}
