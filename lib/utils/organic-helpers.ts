// Organic Chemistry Utility Functions

import { Atom, Bond, OrganicStructure, OrganicTemplate, BondType, Hybridization } from "@/lib/types/organic";
import organicTemplatesData from "@/lib/data/organic-templates.json";

// ============================================================================
// CPK Color Scheme for Atoms
// ============================================================================

export const CPK_COLORS: Record<string, string> = {
  // ============================================================================
  // Standard CPK Color Scheme (Complete Periodic Table)
  // ============================================================================

  // Period 1
  H: "#FFFFFF",   // Hydrogen - White
  He: "#D9FFFF",  // Helium - Cyan

  // Period 2
  Li: "#CC80FF",  // Lithium - Violet
  Be: "#C2FF00",  // Beryllium - Yellow-Green
  B: "#FFB5B5",   // Boron - Pink
  C: "#909090",   // Carbon - Gray
  N: "#3050F8",   // Nitrogen - Blue
  O: "#FF0D0D",   // Oxygen - Red
  F: "#90E050",   // Fluorine - Green
  Ne: "#B3E3F5",  // Neon - Light Blue

  // Period 3
  Na: "#AB5CF2",  // Sodium - Violet
  Mg: "#8AFF00",  // Magnesium - Light Green
  Al: "#BFA6A6",  // Aluminum - Gray
  Si: "#F0C8A0",  // Silicon - Tan
  P: "#FF8000",   // Phosphorus - Orange
  S: "#FFFF30",   // Sulfur - Yellow
  Cl: "#1FF01F",  // Chlorine - Green
  Ar: "#80D1E3",  // Argon - Light Blue

  // Period 4
  K: "#8F40D4",   // Potassium - Purple
  Ca: "#3DFF00",  // Calcium - Green
  Sc: "#E6E6E6",  // Scandium - Light Gray
  Ti: "#BFC2C7",  // Titanium - Gray
  V: "#A6A6AB",   // Vanadium - Gray
  Cr: "#8A99C7",  // Chromium - Gray
  Mn: "#9C7AC7",  // Manganese - Gray-Purple
  Fe: "#E06633",  // Iron - Orange
  Co: "#F090A0",  // Cobalt - Pink
  Ni: "#50D050",  // Nickel - Green
  Cu: "#C88033",  // Copper - Copper
  Zn: "#7D80B0",  // Zinc - Gray-Blue
  Ga: "#C28F8F",  // Gallium - Pink
  Ge: "#668F8F",  // Germanium - Gray-Green
  As: "#BD80E3",  // Arsenic - Purple
  Se: "#FFA100",  // Selenium - Orange
  Br: "#A62929",  // Bromine - Dark Red
  Kr: "#5CB8D1",  // Krypton - Light Blue

  // Period 5
  Rb: "#702EB0",  // Rubidium - Purple
  Sr: "#00FF00",  // Strontium - Green
  Y: "#94FFFF",   // Yttrium - Cyan
  Zr: "#94E0E0",  // Zirconium - Cyan
  Nb: "#73C2C9",  // Niobium - Cyan
  Mo: "#54B5B5",  // Molybdenum - Cyan
  Tc: "#3B9E9E",  // Technetium - Cyan
  Ru: "#248F8F",  // Ruthenium - Cyan
  Rh: "#0A7D8C",  // Rhodium - Cyan
  Pd: "#006985",  // Palladium - Cyan
  Ag: "#C0C0C0",  // Silver - Silver
  Cd: "#FFD98F",  // Cadmium - Yellow
  In: "#A67573",  // Indium - Gray
  Sn: "#668080",  // Tin - Gray
  Sb: "#9E63B5",  // Antimony - Purple
  Te: "#D47A00",  // Tellurium - Orange
  I: "#940094",   // Iodine - Purple
  Xe: "#429EB0",  // Xenon - Light Blue

  // Period 6
  Cs: "#57178F",  // Cesium - Purple
  Ba: "#00C900",  // Barium - Green
  La: "#70D4FF",  // Lanthanum - Light Blue
  Ce: "#FFFFC7",  // Cerium - Light Yellow
  Pr: "#D9FFC7",  // Praseodymium - Light Green
  Nd: "#C7FFC7",  // Neodymium - Light Green
  Pm: "#A3FFC7",  // Promethium - Light Green
  Sm: "#8FFFC7",  // Samarium - Light Green
  Eu: "#61FFC7",  // Europium - Light Green
  Gd: "#45FFC7",  // Gadolinium - Light Green
  Tb: "#30FFC7",  // Terbium - Light Green
  Dy: "#1FFFC7",  // Dysprosium - Light Green
  Ho: "#00FF9C",  // Holmium - Green
  Er: "#00E675",  // Erbium - Green
  Tm: "#00D452",  // Thulium - Green
  Yb: "#00BF38",  // Ytterbium - Green
  Lu: "#00AB24",  // Lutetium - Green
  Hf: "#4DC2FF",  // Hafnium - Light Blue
  Ta: "#4DA6FF",  // Tantalum - Blue
  W: "#2194D6",   // Tungsten - Blue
  Re: "#267DAB",  // Rhenium - Blue
  Os: "#266696",  // Osmium - Blue
  Ir: "#175487",  // Iridium - Blue
  Pt: "#D0D0E0",  // Platinum - Light Gray
  Au: "#FFD700",  // Gold - Gold
  Hg: "#B8B8D0",  // Mercury - Light Blue-Gray
  Tl: "#A6544D",  // Thallium - Brown
  Pb: "#575961",  // Lead - Dark Gray
  Bi: "#9E4FB5",  // Bismuth - Purple
  Po: "#AB5C00",  // Polonium - Orange
  At: "#754F45",  // Astatine - Brown
  Rn: "#428296",  // Radon - Blue

  // Period 7
  Fr: "#420066",  // Francium - Purple
  Ra: "#007D00",  // Radium - Green
  Ac: "#70ABFA",  // Actinium - Light Blue
  Th: "#00BAFF",  // Thorium - Blue
  Pa: "#00A1FF",  // Protactinium - Blue
  U: "#008FFF",   // Uranium - Blue
  Np: "#0080FF",  // Neptunium - Blue
  Pu: "#006BFF",  // Plutonium - Blue
  Am: "#545CF2",  // Americium - Blue
  Cm: "#785CE3",  // Curium - Purple
  Bk: "#8A4FE3",  // Berkelium - Purple
  Cf: "#A136D4",  // Californium - Purple
  Es: "#B31FD4",  // Einsteinium - Purple
  Fm: "#B31FBA",  // Fermium - Purple
  Md: "#B30DA6",  // Mendelevium - Purple
  No: "#BD0D87",  // Nobelium - Purple
  Lr: "#C70066",  // Lawrencium - Purple
  Rf: "#CC0059",  // Rutherfordium - Purple
  Db: "#D1004F",  // Dubnium - Purple
  Sg: "#D90045",  // Seaborgium - Purple
  Bh: "#E00038",  // Bohrium - Red
  Hs: "#E6002E",  // Hassium - Red
  Mt: "#EB0026",  // Meitnerium - Red

  // Default for unknown elements
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
 * Van der Waals radii in picometers (pm) - used for space-filling models
 * Source: Bondi, A. (1964). "van der Waals Volumes and Radii"
 */
export const VAN_DER_WAALS_RADII: Record<string, number> = {
  // Period 1
  H: 120,
  He: 140,

  // Period 2
  Li: 182,
  Be: 153,
  B: 192,
  C: 170,
  N: 155,
  O: 152,
  F: 147,
  Ne: 154,

  // Period 3
  Na: 227,
  Mg: 173,
  Al: 184,
  Si: 210,
  P: 180,
  S: 180,
  Cl: 175,
  Ar: 188,

  // Period 4
  K: 275,
  Ca: 231,
  Sc: 211,
  Ti: 187,
  V: 179,
  Cr: 189,
  Mn: 197,
  Fe: 194,
  Co: 192,
  Ni: 163,
  Cu: 140,
  Zn: 139,
  Ga: 187,
  Ge: 211,
  As: 185,
  Se: 190,
  Br: 185,
  Kr: 202,

  // Period 5
  Rb: 303,
  Sr: 249,
  Y: 219,
  Zr: 186,
  Nb: 207,
  Mo: 209,
  Tc: 209,
  Ru: 207,
  Rh: 195,
  Pd: 202,
  Ag: 172,
  Cd: 158,
  In: 193,
  Sn: 217,
  Sb: 206,
  Te: 206,
  I: 198,
  Xe: 216,

  // Period 6
  Cs: 343,
  Ba: 268,
  La: 240,
  Ce: 235,
  Pr: 239,
  Nd: 229,
  Pm: 236,
  Sm: 229,
  Eu: 233,
  Gd: 237,
  Tb: 221,
  Dy: 229,
  Ho: 216,
  Er: 235,
  Tm: 227,
  Yb: 242,
  Lu: 221,
  Hf: 212,
  Ta: 217,
  W: 210,
  Re: 217,
  Os: 216,
  Ir: 202,
  Pt: 209,
  Au: 166,
  Hg: 155,
  Tl: 196,
  Pb: 202,
  Bi: 207,
  Po: 197,
  At: 202,
  Rn: 220,

  // Period 7 (estimated values)
  Fr: 348,
  Ra: 283,
  Ac: 247,
  Th: 245,
  Pa: 243,
  U: 241,
  Np: 239,
  Pu: 243,
  Am: 244,
  Cm: 245,
  Bk: 244,
  Cf: 245,
  Es: 245,
  Fm: 245,
  Md: 246,
  No: 246,
  Lr: 246,
};

/**
 * Gets van der Waals radius for an element (returns pm)
 * Falls back to 170 pm (carbon) for unknown elements
 */
export function getVanDerWaalsRadius(element: string): number {
  return VAN_DER_WAALS_RADII[element] || 170;
}

/**
 * Calculates 3D display radius for an atom
 * @param element - Element symbol
 * @param mode - 'ball-stick' for smaller atoms, 'space-filling' for van der Waals radii
 * @param atomicMass - Fallback for unknown elements in ball-stick mode
 */
export function get3DAtomRadius(
  element: string,
  mode: 'ball-stick' | 'space-filling' = 'ball-stick',
  atomicMass?: number
): number {
  if (mode === 'space-filling') {
    // Van der Waals radii scaled for 3D visualization
    // Divide by 100 to convert pm to reasonable 3D units (1.2-3.5 range)
    return Math.min(getVanDerWaalsRadius(element) / 100, 3.5);
  } else {
    // Ball-and-stick: Moderately sized atoms with visible bonds between them
    // Slightly larger for better visibility while keeping bonds visible
    const ballStickRadii: Record<string, number> = {
      H: 0.35,   // Smallest
      C: 0.55,   // Carbon
      N: 0.52,   // Nitrogen
      O: 0.48,   // Oxygen
      S: 0.60,   // Sulfur
      P: 0.58,   // Phosphorus
      F: 0.42,   // Fluorine
      Cl: 0.58,  // Chlorine
      Br: 0.65,  // Bromine
      I: 0.72,   // Iodine
      // Metals
      Na: 0.68,
      K: 0.72,
      Ca: 0.70,
      Mg: 0.65,
      Fe: 0.68,
      Cu: 0.65,
      Zn: 0.65,
      Au: 0.68,
      Ag: 0.68,
      Hg: 0.70,
      Pt: 0.68,
      Al: 0.62,
    };
    return ballStickRadii[element] || 0.55; // Default
  }
}

/**
 * Calculates display radius for an atom based on element type (2D)
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

  // Count element occurrences for better error messages
  const elementCounts = new Map<string, number>();
  const elementIndices = new Map<string, number>();

  atoms.forEach(atom => {
    const count = (elementCounts.get(atom.element) || 0) + 1;
    elementCounts.set(atom.element, count);
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
      // Create user-friendly element identifier
      const elementCount = elementCounts.get(atom.element) || 1;
      let elementLabel = atom.element;

      if (elementCount > 1) {
        // Multiple of same element - add index
        const currentIndex = (elementIndices.get(atom.element) || 0) + 1;
        elementIndices.set(atom.element, currentIndex);
        elementLabel = `${atom.element} atom #${currentIndex}`;
      } else {
        // Only one of this element
        const elementNames: Record<string, string> = {
          'H': 'Hydrogen', 'C': 'Carbon', 'O': 'Oxygen', 'N': 'Nitrogen', 'S': 'Sulfur',
          'P': 'Phosphorus', 'F': 'Fluorine', 'Cl': 'Chlorine',
          'Br': 'Bromine', 'I': 'Iodine'
        };
        elementLabel = elementNames[atom.element] || atom.element;
      }

      errors.push(
        `${elementLabel} has too many bonds (${usedBonds} bonds, maximum ${max})`
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
