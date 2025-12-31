export interface CompoundElement {
  elementId: string; // Element UUID
  symbol: string; // "H", "O"
  count: number; // Number of atoms (2 for H in H₂O)
  position?: { x: number; y: number }; // Position on canvas (Phase 3)
  position3D?: { x: number; y: number; z: number }; // 3D coordinates for visualization
}

// Phase 3: Chemical Bonds
export interface Bond {
  id: string; // Bond UUID
  fromElementId: string; // Element UUID
  toElementId: string; // Element UUID
  bondType: BondType; // Single, double, triple, ionic
  strength?: number; // Bond strength (optional)
}

export type BondType = "single" | "double" | "triple" | "ionic" | "covalent" | "metallic";

// VSEPR Geometry Types (for 3D visualization)
export type VSEPRGeometry =
  | "linear"              // 2 atoms, 180°
  | "bent"                // 2-3 atoms, ~104.5° (water) or ~120° (SO2)
  | "trigonal-planar"     // 3 atoms, 120°
  | "tetrahedral"         // 4 atoms, 109.5°
  | "trigonal-pyramidal"  // 4 atoms, ~107° (ammonia)
  | "trigonal-bipyramidal" // 5 atoms, 90°/120°
  | "octahedral"          // 6 atoms, 90°
  | "custom";             // Fallback for complex molecules

// Phase 3: External Factors
export interface ExternalFactors {
  temperature?: {
    enabled: boolean;
    value?: number; // Temperature in Kelvin or Celsius
    unit?: "K" | "C";
  };
  pressure?: {
    enabled: boolean;
    value?: number; // Pressure in atm or Pa
    unit?: "atm" | "Pa";
  };
  catalyst?: {
    enabled: boolean;
    name?: string; // Catalyst name (optional)
    details?: string; // Additional details
  };
  heat?: {
    enabled: boolean;
    details?: string; // Heat application details
  };
  light?: {
    enabled: boolean;
    wavelength?: number; // Wavelength in nm (optional)
    details?: string;
  };
}

// Phase 3: Canvas Data
export interface CanvasData {
  width: number;
  height: number;
  zoom: number;
  offset: { x: number; y: number };
}

// Molecular Geometry Metadata (for 3D visualization)
export interface MolecularGeometry {
  type: VSEPRGeometry;
  centralAtomId?: string;      // ID of central atom (if applicable)
  bondAngles?: number[];        // Bond angles in degrees
  generatedAt?: Date;           // When 3D coords were generated
}

export interface Compound {
  _id?: string;
  name: string; // "Water", "Carbon Dioxide"
  formula: string; // "H₂O", "CO₂"

  // Composition
  elements: CompoundElement[]; // Elements in compound

  // Properties
  molarMass: number; // g/mol
  description: string | null; // Brief description (optional)

  // Phase 3: Interactive Creation Data
  bonds?: Bond[]; // Chemical bonds between elements
  externalFactors?: ExternalFactors; // Reaction conditions
  canvasData?: CanvasData; // Element positions on canvas
  geometry?: MolecularGeometry; // 3D geometry metadata

  // User info
  createdBy: string; // User ID
  createdByName: string; // User display name

  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}
