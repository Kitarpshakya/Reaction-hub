// Organic Chemistry Utility Functions

import { Atom, Bond, OrganicStructure, OrganicTemplate, BondType, Hybridization } from "@/lib/types/organic";
import organicTemplatesData from "@/lib/data/organic-templates.json";

// ============================================================================
// CPK Color Scheme for Atoms
// ============================================================================

export const CPK_COLORS: Record<string, string> = {
  // Common elements
  H: "#FFFFFF",   // Hydrogen - White
  C: "#909090",   // Carbon - Gray
  N: "#3050F8",   // Nitrogen - Blue
  O: "#FF0D0D",   // Oxygen - Red
  F: "#90E050",   // Fluorine - Green
  Cl: "#1FF01F",  // Chlorine - Green
  Br: "#A62929",  // Bromine - Dark Red
  I: "#940094",   // Iodine - Purple
  S: "#FFFF30",   // Sulfur - Yellow
  P: "#FF8000",   // Phosphorus - Orange

  // Less common
  B: "#FFB5B5",   // Boron - Pink
  Si: "#F0C8A0",  // Silicon - Tan
  Na: "#AB5CF2",  // Sodium - Violet
  K: "#8F40D4",   // Potassium - Purple
  Ca: "#3DFF00",  // Calcium - Green
  Mg: "#8AFF00",  // Magnesium - Light Green
  Fe: "#E06633",  // Iron - Orange
  Cu: "#C88033",  // Copper - Copper
  Zn: "#7D80B0",  // Zinc - Gray Blue

  // Default
  DEFAULT: "#FF1493", // Deep Pink for unknown
};

export function getAtomColor(element: string): string {
  return CPK_COLORS[element] || CPK_COLORS.DEFAULT;
}

// ============================================================================
// Molecular Formula Generation
// ============================================================================

/**
 * Generates a molecular formula from an array of atoms
 * Example: [C, C, H, H, H, H, H, H] -> C₂H₆
 */
export function generateMolecularFormula(atoms: Atom[]): string {
  // Count each element
  const elementCounts: Record<string, number> = {};

  atoms.forEach(atom => {
    elementCounts[atom.element] = (elementCounts[atom.element] || 0) + 1;
  });

  // Sort elements: C first, H second, then alphabetically
  const sortedElements = Object.keys(elementCounts).sort((a, b) => {
    if (a === "C") return -1;
    if (b === "C") return 1;
    if (a === "H") return -1;
    if (b === "H") return 1;
    return a.localeCompare(b);
  });

  // Build formula with subscripts
  return sortedElements
    .map(element => {
      const count = elementCounts[element];
      if (count === 1) return element;
      return element + toSubscript(count);
    })
    .join("");
}

/**
 * Converts a number to subscript Unicode characters
 */
export function toSubscript(num: number): string {
  const subscriptMap: Record<string, string> = {
    "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄",
    "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉",
  };

  return num
    .toString()
    .split("")
    .map(digit => subscriptMap[digit])
    .join("");
}

// ============================================================================
// Molecular Weight Calculation
// ============================================================================

const ATOMIC_MASSES: Record<string, number> = {
  H: 1.008,
  C: 12.011,
  N: 14.007,
  O: 15.999,
  F: 18.998,
  Cl: 35.453,
  Br: 79.904,
  I: 126.904,
  S: 32.065,
  P: 30.974,
  B: 10.811,
  Si: 28.086,
  Na: 22.990,
  K: 39.098,
  Ca: 40.078,
  Mg: 24.305,
  Fe: 55.845,
  Cu: 63.546,
  Zn: 65.38,
};

/**
 * Calculates molecular weight from atoms
 */
export function calculateMolecularWeight(atoms: Atom[]): number {
  return atoms.reduce((total, atom) => {
    const mass = ATOMIC_MASSES[atom.element] || 0;
    return total + mass;
  }, 0);
}

/**
 * Gets atomic mass for a single element
 */
export function getAtomicMass(element: string): number {
  return ATOMIC_MASSES[element] || 0;
}

// ============================================================================
// Bond Angle Calculations
// ============================================================================

/**
 * Returns ideal bond angle based on hybridization
 */
export function getIdealBondAngle(hybridization?: Hybridization): number {
  switch (hybridization) {
    case "sp":
      return 180; // Linear
    case "sp2":
      return 120; // Trigonal planar
    case "sp3":
      return 109.5; // Tetrahedral
    default:
      return 120; // Default to trigonal planar
  }
}

/**
 * Calculates the angle between three points (in degrees)
 * Used for validating bond angles in structures
 */
export function calculateBondAngle(
  point1: { x: number; y: number },
  center: { x: number; y: number },
  point2: { x: number; y: number }
): number {
  const angle1 = Math.atan2(point1.y - center.y, point1.x - center.x);
  const angle2 = Math.atan2(point2.y - center.y, point2.x - center.x);

  let angle = Math.abs(angle1 - angle2) * (180 / Math.PI);

  // Normalize to 0-180 range
  if (angle > 180) {
    angle = 360 - angle;
  }

  return angle;
}

// ============================================================================
// 2D Coordinate Generation
// ============================================================================

/**
 * Generates 2D coordinates for atoms based on hybridization and bonding
 * This is a simplified version - a full implementation would use SMILES parsing
 */
export function generate2DCoordinates(
  atoms: Atom[],
  bonds: Bond[],
  bondLength: number = 50
): Atom[] {
  if (atoms.length === 0) return [];

  const positioned = [...atoms];
  const visited = new Set<string>();

  // Start with first atom at origin
  positioned[0].position = { x: 200, y: 200 };
  visited.add(positioned[0].id);

  // Queue of atoms to process
  const queue: string[] = [positioned[0].id];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const currentAtom = positioned.find(a => a.id === currentId)!;

    // Find bonds connected to this atom
    const connectedBonds = bonds.filter(
      b => b.from === currentId || b.to === currentId
    );

    let angleOffset = 0;
    const angleIncrement = getIdealBondAngle(currentAtom.hybridization);

    connectedBonds.forEach(bond => {
      const nextId = bond.from === currentId ? bond.to : bond.from;

      if (!visited.has(nextId)) {
        const nextAtom = positioned.find(a => a.id === nextId)!;

        // Calculate position based on angle
        const angle = (angleOffset * Math.PI) / 180;
        nextAtom.position = {
          x: currentAtom.position.x + bondLength * Math.cos(angle),
          y: currentAtom.position.y + bondLength * Math.sin(angle),
        };

        visited.add(nextId);
        queue.push(nextId);
        angleOffset += angleIncrement;
      }
    });
  }

  return positioned;
}

// ============================================================================
// Template Management
// ============================================================================

/**
 * Loads all organic templates from JSON data
 */
export function loadOrganicTemplates(): OrganicTemplate[] {
  return organicTemplatesData as OrganicTemplate[];
}

/**
 * Gets a specific template by name
 */
export function getTemplateByName(name: string): OrganicTemplate | undefined {
  const templates = loadOrganicTemplates();
  return templates.find(
    t => t.name.toLowerCase() === name.toLowerCase() ||
         t.commonName?.toLowerCase() === name.toLowerCase()
  );
}

/**
 * Gets templates by category
 */
export function getTemplatesByCategory(category: string): OrganicTemplate[] {
  const templates = loadOrganicTemplates();
  return templates.filter(t => t.category === category);
}

/**
 * Gets templates by template category (benzene-derivatives, alkanes, etc.)
 */
export function getTemplatesByTemplateCategory(templateCategory: string): OrganicTemplate[] {
  const templates = loadOrganicTemplates();
  return templates.filter(t => t.templateCategory === templateCategory);
}

// ============================================================================
// Bond Type Utilities
// ============================================================================

/**
 * Gets the visual representation for a bond type
 */
export function getBondStyle(bondType: BondType): {
  strokeWidth: number;
  dashArray?: string;
  offset?: number;
} {
  switch (bondType) {
    case "single":
      return { strokeWidth: 2 };
    case "double":
      return { strokeWidth: 2, offset: 3 };
    case "triple":
      return { strokeWidth: 2, offset: 5 };
    case "aromatic":
      return { strokeWidth: 2, dashArray: "5,5" };
    case "dative":
      return { strokeWidth: 2, dashArray: "3,3" };
    default:
      return { strokeWidth: 2 };
  }
}

/**
 * Returns the number of bonds for bond counting (single=1, double=2, triple=3)
 */
export function getBondCount(bondType: BondType): number {
  switch (bondType) {
    case "single":
    case "dative":
      return 1;
    case "double":
      return 2;
    case "triple":
      return 3;
    case "aromatic":
      return 1.5; // Aromatic bonds are between single and double
    default:
      return 1;
  }
}

// ============================================================================
// Functional Group Detection
// ============================================================================

/**
 * Detects common functional groups in a structure
 * This is a simplified version - full implementation would require SMARTS pattern matching
 */
export function detectFunctionalGroups(atoms: Atom[], bonds: Bond[]): string[] {
  const functionalGroups: Set<string> = new Set();

  // Build adjacency map
  const adjacency = new Map<string, Set<string>>();
  bonds.forEach(bond => {
    if (!adjacency.has(bond.from)) adjacency.set(bond.from, new Set());
    if (!adjacency.has(bond.to)) adjacency.set(bond.to, new Set());
    adjacency.get(bond.from)!.add(bond.to);
    adjacency.get(bond.to)!.add(bond.from);
  });

  atoms.forEach(atom => {
    const neighbors = adjacency.get(atom.id);
    if (!neighbors) return;

    // Hydroxyl (-OH)
    if (atom.element === "O") {
      const connectedAtoms = Array.from(neighbors).map(id =>
        atoms.find(a => a.id === id)
      );
      const hasCarbon = connectedAtoms.some(a => a?.element === "C");
      if (hasCarbon && neighbors.size === 1) {
        functionalGroups.add("hydroxyl");
      }
    }

    // Carbonyl (C=O)
    if (atom.element === "C") {
      const connectedAtoms = Array.from(neighbors).map(id =>
        atoms.find(a => a.id === id)
      );
      const hasDoubleO = connectedAtoms.some(a => {
        if (a?.element !== "O") return false;
        const bond = bonds.find(
          b => (b.from === atom.id && b.to === a.id) ||
               (b.to === atom.id && b.from === a.id)
        );
        return bond?.type === "double";
      });

      if (hasDoubleO) {
        functionalGroups.add("carbonyl");
      }
    }

    // Amino (-NH2)
    if (atom.element === "N") {
      const connectedAtoms = Array.from(neighbors).map(id =>
        atoms.find(a => a.id === id)
      );
      const hasCarbon = connectedAtoms.some(a => a?.element === "C");
      if (hasCarbon) {
        functionalGroups.add("amino");
      }
    }

    // Aromatic ring (simplified detection)
    const aromaticBond = bonds.find(
      b => (b.from === atom.id || b.to === atom.id) && b.type === "aromatic"
    );
    if (aromaticBond) {
      functionalGroups.add("aromatic ring");
    }
  });

  return Array.from(functionalGroups);
}

// ============================================================================
// SMILES Validation
// ============================================================================

/**
 * Basic SMILES validation (checks for valid characters)
 * A full SMILES parser would be much more complex
 */
export function isValidSMILES(smiles: string): boolean {
  if (!smiles || smiles.trim().length === 0) return false;

  // Valid SMILES characters: atoms, bonds, branches, rings
  const validPattern = /^[A-Za-z0-9()\[\]=#@+\-\\/%.]+$/;
  return validPattern.test(smiles);
}

/**
 * Extracts element symbols from a SMILES string
 * This is a simplified extraction
 */
export function extractElementsFromSMILES(smiles: string): string[] {
  const elements: string[] = [];

  // Match uppercase letters followed by optional lowercase (element symbols)
  const matches = smiles.match(/[A-Z][a-z]?/g);

  if (matches) {
    elements.push(...matches);
  }

  return elements;
}

// ============================================================================
// Atom Radius Calculation
// ============================================================================

/**
 * Calculates display radius for an atom based on element type
 */
export function getAtomRadius(element: string, baseRadius: number = 20): number {
  // Scale factor based on atomic number/size
  const scaleFactor: Record<string, number> = {
    H: 0.6,   // Smallest
    C: 1.0,   // Reference
    N: 0.9,
    O: 0.85,
    F: 0.8,
    S: 1.2,
    P: 1.15,
    Cl: 1.1,
    Br: 1.3,
    I: 1.5,
  };

  return baseRadius * (scaleFactor[element] || 1.0);
}

// ============================================================================
// Structure Validation
// ============================================================================

/**
 * Validates if a structure is chemically reasonable
 */
export function validateStructure(atoms: Atom[], bonds: Bond[]): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for atoms
  if (atoms.length === 0) {
    errors.push("Structure must contain at least one atom");
  }

  // Check for duplicate atom IDs
  const atomIds = new Set<string>();
  atoms.forEach(atom => {
    if (atomIds.has(atom.id)) {
      errors.push(`Duplicate atom ID: ${atom.id}`);
    }
    atomIds.add(atom.id);
  });

  // Check bond references
  bonds.forEach(bond => {
    const fromExists = atoms.some(a => a.id === bond.from);
    const toExists = atoms.some(a => a.id === bond.to);

    if (!fromExists) {
      errors.push(`Bond references non-existent atom: ${bond.from}`);
    }
    if (!toExists) {
      errors.push(`Bond references non-existent atom: ${bond.to}`);
    }

    // Check for self-bonds
    if (bond.from === bond.to) {
      errors.push("Atom cannot bond to itself");
    }
  });

  // Check valency (simplified)
  const bondCounts = new Map<string, number>();
  bonds.forEach(bond => {
    const count = getBondCount(bond.type);
    bondCounts.set(bond.from, (bondCounts.get(bond.from) || 0) + count);
    bondCounts.set(bond.to, (bondCounts.get(bond.to) || 0) + count);
  });

  atoms.forEach(atom => {
    const usedBonds = bondCounts.get(atom.id) || 0;

    // Common valencies
    const maxValency: Record<string, number> = {
      H: 1, C: 4, N: 5, O: 2, F: 1,
      Cl: 1, Br: 1, I: 1, S: 6, P: 5,
    };

    const max = maxValency[atom.element];
    if (max !== undefined && usedBonds > max) {
      errors.push(
        `${atom.element} (${atom.id}) exceeds maximum valency: ${usedBonds} > ${max}`
      );
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// Export Utilities
// ============================================================================

/**
 * Converts an OrganicStructure to a simplified display format
 */
export function structureToDisplayString(structure: OrganicStructure): string {
  return `${structure.name} (${structure.molecularFormula}) - ${structure.molecularWeight.toFixed(2)} g/mol`;
}
