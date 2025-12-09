export type ElementCategory =
  | "alkali-metal"
  | "alkaline-earth-metal"
  | "transition-metal"
  | "post-transition-metal"
  | "metalloid"
  | "nonmetal"
  | "halogen"
  | "noble-gas"
  | "lanthanide"
  | "actinide"
  | "unknown";

export interface Isotope {
  massNumber: number;
  symbol: string; // e.g., "H-1", "C-14"
  abundance: number | null; // Percentage
  halfLife: string | null;
  isStable: boolean;
}

export interface Element {
  _id?: string;
  atomicNumber: number; // 1-118 (unique)
  symbol: string; // "H", "He", etc. (unique)
  name: string; // "Hydrogen", "Helium"
  atomicMass: number; // 1.008, 4.0026

  // Classification
  category: ElementCategory;
  group: number | null; // 1-18
  period: number; // 1-7
  block: string; // "s", "p", "d", "f"

  // Electronic Structure
  electronConfiguration: string; // "1s²"
  electronsPerShell: number[]; // [2, 8, 18, 32, ...]

  // Physical Properties
  phase: string; // "solid", "liquid", "gas"
  meltingPoint: number | null; // Kelvin
  boilingPoint: number | null; // Kelvin
  density: number | null; // g/cm³

  // Chemical Properties
  electronegativity: number | null;
  atomicRadius: number | null; // pm
  ionizationEnergy: number | null; // kJ/mol
  oxidationStates: number[]; // [-1, +1]

  // Discovery
  discoveredBy: string | null;
  yearDiscovered: number | null;

  // Nuclear
  isRadioactive: boolean;
  halfLife: string | null;

  // Visual
  color: string; // Hex color for UI
  cpkColor?: string; // CPK coloring convention (optional)

  // Content
  summary: string; // Brief description

  // Grid Position
  gridRow: number;
  gridColumn: number;

  // Isotopes
  isotopes?: Isotope[];
}

// Simplified version for periodic table grid display
export interface ElementCard {
  atomicNumber: number;
  symbol: string;
  name: string;
  atomicMass: number;
  category: ElementCategory;
  color: string;
  gridRow: number;
  gridColumn: number;
}

// Category colors mapping
export const CATEGORY_COLORS: Record<ElementCategory, string> = {
  "nonmetal": "#4ECDC4", // Teal
  "noble-gas": "#95E1D3", // Mint
  "alkali-metal": "#F38181", // Coral
  "alkaline-earth-metal": "#FDCB6E", // Yellow
  "transition-metal": "#A29BFE", // Purple
  "post-transition-metal": "#74B9FF", // Blue
  "metalloid": "#FD79A8", // Pink
  "halogen": "#FF7675", // Red
  "lanthanide": "#FFEAA7", // Light Yellow
  "actinide": "#DFE6E9", // Gray
  "unknown": "#B2BEC3", // Light Gray
};
