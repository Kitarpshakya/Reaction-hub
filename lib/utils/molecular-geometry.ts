/**
 * Molecular Geometry Utility
 *
 * Generates 3D atomic coordinates from 2D compound data using VSEPR theory.
 * Follows patterns from chemistry-helpers.ts and organic-helpers.ts.
 *
 * @module molecular-geometry
 */

import { Element } from "@/lib/types/element";
import { CompoundElement, Bond, VSEPRGeometry, MolecularGeometry } from "@/lib/types/compound";

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Actual bond lengths from experimental chemistry data (in Ångströms)
 * Source: CRC Handbook of Chemistry and Physics
 *
 * Note: These are average values. Actual bond lengths vary slightly
 * based on molecular environment, hybridization, and other factors.
 */
const BOND_LENGTHS: Record<string, number> = {
  // Carbon bonds (most common in organic chemistry)
  "C-C": 1.54,   // Single bond (sp3-sp3)
  "C=C": 1.34,   // Double bond
  "C≡C": 1.20,   // Triple bond
  "C-H": 1.09,   // Carbon-hydrogen
  "C-N": 1.47,   // Carbon-nitrogen single
  "C=N": 1.29,   // Carbon-nitrogen double
  "C-O": 1.43,   // Carbon-oxygen single
  "C=O": 1.23,   // Carbon-oxygen double (carbonyl)
  "C-S": 1.82,   // Carbon-sulfur
  "C-F": 1.35,   // Carbon-fluorine
  "C-Cl": 1.77,  // Carbon-chlorine
  "C-Br": 1.94,  // Carbon-bromine
  "C-I": 2.14,   // Carbon-iodine

  // Hydrogen bonds
  "H-H": 0.74,   // Hydrogen molecule
  "H-N": 1.01,   // Nitrogen-hydrogen
  "H-O": 0.96,   // Oxygen-hydrogen
  "H-S": 1.34,   // Sulfur-hydrogen
  "H-F": 0.92,   // Hydrogen-fluorine
  "H-Cl": 1.27,  // Hydrogen-chlorine
  "H-Br": 1.41,  // Hydrogen-bromine

  // Nitrogen bonds
  "N-N": 1.45,   // Nitrogen-nitrogen single
  "N=N": 1.25,   // Nitrogen-nitrogen double
  "N≡N": 1.10,   // Nitrogen-nitrogen triple
  "N-O": 1.36,   // Nitrogen-oxygen
  "N=O": 1.22,   // Nitrogen-oxygen double

  // Oxygen bonds
  "O-O": 1.48,   // Oxygen-oxygen single
  "O=O": 1.21,   // Oxygen-oxygen double
  "O-H": 0.96,   // Oxygen-hydrogen

  // Sulfur bonds
  "S-S": 2.05,   // Sulfur-sulfur
  "S-H": 1.34,   // Sulfur-hydrogen
  "S-O": 1.43,   // Sulfur-oxygen

  // Phosphorus bonds
  "P-O": 1.63,   // Phosphorus-oxygen
  "P-H": 1.42,   // Phosphorus-hydrogen
  "P-C": 1.84,   // Phosphorus-carbon

  // Halogens
  "F-F": 1.42,   // Fluorine-fluorine
  "Cl-Cl": 1.99, // Chlorine-chlorine
  "Br-Br": 2.28, // Bromine-bromine
  "I-I": 2.67,   // Iodine-iodine

  // Metal-nonmetal (ionic/polar covalent)
  "Na-Cl": 2.36, // Sodium chloride
  "Mg-O": 2.10,  // Magnesium oxide
  "Ca-O": 2.40,  // Calcium oxide
  "Fe-O": 2.00,  // Iron oxide

  // Metallic bonds (approximate)
  "Au-Au": 2.88,  // Gold
  "Au-Hg": 2.85,  // Gold-mercury
  "Ag-Ag": 2.89,  // Silver
  "Cu-Cu": 2.56,  // Copper
  "Fe-Fe": 2.48,  // Iron
};

/**
 * Visual scaling factor to convert Ångströms to our 3D coordinate space
 * Adjusted so atoms appear properly sized relative to bond lengths
 */
const ANGSTROM_TO_UNITS = 1.2;

/**
 * Calculate the visual radius for an element (same formula as in AtomSphere)
 */
function getAtomRadius(element: Element): number {
  return element.atomicRadius
    ? Math.min(element.atomicRadius / 80, 2.5)
    : Math.min(Math.sqrt(element.atomicMass) * 0.12, 2.5);
}

/**
 * Get actual bond length between two atoms based on chemistry data
 * Falls back to sum of covalent radii if specific bond not in database
 */
function getBondLength(fromElement: Element, toElement: Element, bondType: string = "single"): number {
  const symbol1 = fromElement.symbol;
  const symbol2 = toElement.symbol;

  // Map bondType to bond notation
  let bondNotation = "-"; // Default single bond
  if (bondType === "double") {
    bondNotation = "=";
  } else if (bondType === "triple") {
    bondNotation = "≡";
  }

  // Try to find the bond in our database with bond type
  let bondKey = `${symbol1}${bondNotation}${symbol2}`;
  let bondLength = BOND_LENGTHS[bondKey];

  if (!bondLength) {
    // Try reverse order
    bondKey = `${symbol2}${bondNotation}${symbol1}`;
    bondLength = BOND_LENGTHS[bondKey];
  }

  // If not found with specific bond type, try single bond as fallback
  if (!bondLength && bondNotation !== "-") {
    bondKey = `${symbol1}-${symbol2}`;
    bondLength = BOND_LENGTHS[bondKey];

    if (!bondLength) {
      bondKey = `${symbol2}-${symbol1}`;
      bondLength = BOND_LENGTHS[bondKey];
    }
  }

  // If still not found, use sum of covalent radii as fallback
  if (!bondLength) {
    const covalentRadius1 = fromElement.atomicRadius ? fromElement.atomicRadius / 100 : 1.5;
    const covalentRadius2 = toElement.atomicRadius ? toElement.atomicRadius / 100 : 1.5;
    bondLength = covalentRadius1 + covalentRadius2;

    // Adjust for bond type (double and triple bonds are shorter)
    if (bondType === "double") {
      bondLength *= 0.87; // Double bonds ~13% shorter
    } else if (bondType === "triple") {
      bondLength *= 0.78; // Triple bonds ~22% shorter
    }
  }

  // Convert from Ångströms to our coordinate space
  return bondLength * ANGSTROM_TO_UNITS;
}

// ============================================================================
// VSEPR GEOMETRY TEMPLATES
// ============================================================================

/**
 * VSEPR geometry coordinate generators
 * Returns normalized unit vectors that will be scaled by bond length
 */
const GEOMETRY_TEMPLATES = {
  /**
   * Linear geometry (2 atoms)
   * Example: CO2, HCN
   * Bond angle: 180°
   */
  linear: (index: number): { x: number; y: number; z: number } => {
    return index === 0
      ? { x: -1, y: 0, z: 0 }
      : { x: 1, y: 0, z: 0 };
  },

  /**
   * Bent geometry (2-3 atoms)
   * Example: H2O (104.5°), SO2 (119°)
   * Bond angle: ~104.5° for water
   */
  bent: (index: number, angle: number = 104.5): { x: number; y: number; z: number } => {
    const halfAngle = (angle / 2) * (Math.PI / 180);
    return index === 0
      ? { x: -Math.sin(halfAngle), y: Math.cos(halfAngle), z: 0 }
      : { x: Math.sin(halfAngle), y: Math.cos(halfAngle), z: 0 };
  },

  /**
   * Trigonal planar geometry (3 atoms)
   * Example: BF3, CO3²⁻
   * Bond angle: 120°
   */
  trigonalPlanar: (index: number): { x: number; y: number; z: number } => {
    const angle = index * (120 * Math.PI / 180);
    return {
      x: Math.cos(angle),
      y: Math.sin(angle),
      z: 0,
    };
  },

  /**
   * Tetrahedral geometry (4 atoms)
   * Example: CH4, NH4+
   * Bond angle: 109.5°
   */
  tetrahedral: (index: number): { x: number; y: number; z: number } => {
    const coords = [
      { x: 1, y: 1, z: 1 },
      { x: -1, y: -1, z: 1 },
      { x: -1, y: 1, z: -1 },
      { x: 1, y: -1, z: -1 },
    ];
    const coord = coords[index];
    const length = Math.sqrt(coord.x ** 2 + coord.y ** 2 + coord.z ** 2);
    return {
      x: coord.x / length,
      y: coord.y / length,
      z: coord.z / length,
    };
  },

  /**
   * Trigonal pyramidal geometry (3 atoms around 1 central)
   * Example: NH3
   * Bond angle: ~107°
   */
  trigonalPyramidal: (index: number): { x: number; y: number; z: number } => {
    const angle = index * (120 * Math.PI / 180);
    const elevation = -0.3; // Pyramidal elevation
    return {
      x: Math.cos(angle) * 0.95,
      y: Math.sin(angle) * 0.95,
      z: elevation,
    };
  },

  /**
   * Trigonal bipyramidal geometry (5 atoms)
   * Example: PCl5
   * Bond angles: 90°, 120°
   */
  trigonalBipyramidal: (index: number): { x: number; y: number; z: number } => {
    if (index < 3) {
      // Equatorial positions (120° apart)
      const angle = index * (120 * Math.PI / 180);
      return { x: Math.cos(angle), y: Math.sin(angle), z: 0 };
    } else {
      // Axial positions
      return index === 3
        ? { x: 0, y: 0, z: 1 }
        : { x: 0, y: 0, z: -1 };
    }
  },

  /**
   * Octahedral geometry (6 atoms)
   * Example: SF6
   * Bond angle: 90°
   */
  octahedral: (index: number): { x: number; y: number; z: number } => {
    const coords = [
      { x: 1, y: 0, z: 0 },
      { x: -1, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 0, y: -1, z: 0 },
      { x: 0, y: 0, z: 1 },
      { x: 0, y: 0, z: -1 },
    ];
    return coords[index];
  },
};

// ============================================================================
// GEOMETRY DETECTION
// ============================================================================

/**
 * Determines VSEPR geometry based on bond count and central atom
 *
 * @param bondCount Number of bonds from central atom
 * @param centralElement Element at center (for special cases)
 * @returns VSEPR geometry type
 */
export function determineVSEPRGeometry(
  bondCount: number,
  centralElement?: Element
): VSEPRGeometry {
  // Special case: Water (O with 2 bonds)
  if (bondCount === 2 && centralElement?.symbol === "O") {
    return "bent";
  }

  // Special case: Ammonia (N with 3 bonds)
  if (bondCount === 3 && centralElement?.symbol === "N") {
    return "trigonal-pyramidal";
  }

  // General VSEPR rules
  switch (bondCount) {
    case 2:
      return "linear";
    case 3:
      return "trigonal-planar";
    case 4:
      return "tetrahedral";
    case 5:
      return "trigonal-bipyramidal";
    case 6:
      return "octahedral";
    default:
      return "custom";
  }
}

/**
 * Finds the central atom in a molecule
 * Priority: element with most bonds, then lowest electronegativity
 *
 * @param elements Array of compound elements
 * @param bonds Array of bonds
 * @param allElements Full element data for lookups
 * @returns ID of central atom, or null if no clear center
 */
export function findCentralAtom(
  elements: CompoundElement[],
  bonds: Bond[],
  allElements: Element[]
): string | null {
  if (elements.length === 0) return null;

  // Count bonds per element
  const bondCounts = new Map<string, number>();
  elements.forEach(el => bondCounts.set(el.elementId, 0));

  bonds.forEach(bond => {
    bondCounts.set(bond.fromElementId, (bondCounts.get(bond.fromElementId) || 0) + 1);
    bondCounts.set(bond.toElementId, (bondCounts.get(bond.toElementId) || 0) + 1);
  });

  // Find element(s) with maximum bonds
  const maxBonds = Math.max(...Array.from(bondCounts.values()));
  const candidates = elements.filter(el => bondCounts.get(el.elementId) === maxBonds);

  if (candidates.length === 1) {
    return candidates[0].elementId;
  }

  // Tiebreaker: lowest electronegativity (more metallic = more central)
  const elementLookup = new Map(allElements.map(el => [el.symbol, el]));
  let centralAtom = candidates[0];
  let lowestEN = elementLookup.get(centralAtom.symbol)?.electronegativity || 999;

  candidates.forEach(candidate => {
    const en = elementLookup.get(candidate.symbol)?.electronegativity || 999;
    if (en < lowestEN) {
      lowestEN = en;
      centralAtom = candidate;
    }
  });

  return centralAtom.elementId;
}

// ============================================================================
// CHAIN DETECTION AND GENERATION
// ============================================================================

/**
 * Detects if the molecule is a carbon chain (organic molecule)
 */
function isChainStructure(
  elements: CompoundElement[],
  bonds: Bond[]
): boolean {
  const carbonCount = elements.filter(el => el.symbol === "C").length;

  // Need at least 2 carbons for a chain
  if (carbonCount < 2) return false;

  // Check if carbons are bonded to each other
  const carbonBonds = bonds.filter(bond => {
    const fromEl = elements.find(el => el.elementId === bond.fromElementId);
    const toEl = elements.find(el => el.elementId === bond.toElementId);
    return fromEl?.symbol === "C" && toEl?.symbol === "C";
  });

  // If we have carbon-carbon bonds, it's likely a chain
  return carbonBonds.length >= 1;
}

/**
 * Generates 3D coordinates for carbon chain molecules
 */
function generateChainCoordinates(
  elements: CompoundElement[],
  bonds: Bond[],
  allElements: Element[]
): { elements: CompoundElement[]; geometry: MolecularGeometry } {
  const elementLookup = new Map(allElements.map(el => [el.symbol, el]));

  // Separate carbons and other atoms
  const carbons = elements.filter(el => el.symbol === "C");
  const nonCarbons = elements.filter(el => el.symbol !== "C");

  // Build adjacency list for carbon chain
  const carbonAdjacency = new Map<string, string[]>();
  carbons.forEach(c => carbonAdjacency.set(c.elementId, []));

  bonds.forEach(bond => {
    const fromEl = elements.find(el => el.elementId === bond.fromElementId);
    const toEl = elements.find(el => el.elementId === bond.toElementId);

    if (fromEl?.symbol === "C" && toEl?.symbol === "C") {
      carbonAdjacency.get(bond.fromElementId)?.push(bond.toElementId);
      carbonAdjacency.get(bond.toElementId)?.push(bond.fromElementId);
    }
  });

  // Find chain order using BFS (start from carbon with only 1 carbon neighbor)
  let startCarbon = carbons.find(c => (carbonAdjacency.get(c.elementId)?.length || 0) <= 1);
  if (!startCarbon) startCarbon = carbons[0]; // Fallback to first carbon

  const chainOrder: CompoundElement[] = [];
  const visited = new Set<string>();
  const queue = [startCarbon];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current.elementId)) continue;

    visited.add(current.elementId);
    chainOrder.push(current);

    const neighbors = carbonAdjacency.get(current.elementId) || [];
    neighbors.forEach(neighborId => {
      if (!visited.has(neighborId)) {
        const neighbor = carbons.find(c => c.elementId === neighborId);
        if (neighbor) queue.push(neighbor);
      }
    });
  }

  // Add any missed carbons
  carbons.forEach(c => {
    if (!chainOrder.includes(c)) chainOrder.push(c);
  });

  // Position carbons along x-axis using actual C-C bond length
  const carbonData = elementLookup.get("C");
  if (!carbonData) {
    return generateLinearFallback(elements);
  }

  // Use actual C-C single bond length from chemistry data (1.54 Å)
  const carbonSpacing = getBondLength(carbonData, carbonData);
  const totalLength = (chainOrder.length - 1) * carbonSpacing;
  const startX = -totalLength / 2;

  const positionedElements = new Map<string, CompoundElement>();

  // Position carbons using actual C-C bond length (1.54 Å × scale factor)
  chainOrder.forEach((carbon, index) => {
    positionedElements.set(carbon.elementId, {
      ...carbon,
      position3D: {
        x: startX + index * carbonSpacing,
        y: 0,
        z: 0,
      },
    });
  });

  // Position hydrogens and other atoms around their bonded carbon
  nonCarbons.forEach(atom => {
    // Find which carbon this atom is bonded to
    const bondToCarbon = bonds.find(bond =>
      (bond.fromElementId === atom.elementId && elements.find(el => el.elementId === bond.toElementId)?.symbol === "C") ||
      (bond.toElementId === atom.elementId && elements.find(el => el.elementId === bond.fromElementId)?.symbol === "C")
    );

    if (!bondToCarbon) {
      // No carbon bond found, place at origin
      positionedElements.set(atom.elementId, {
        ...atom,
        position3D: { x: 0, y: 0, z: 0 },
      });
      return;
    }

    const carbonId = bondToCarbon.fromElementId === atom.elementId
      ? bondToCarbon.toElementId
      : bondToCarbon.fromElementId;

    const carbon = positionedElements.get(carbonId);
    if (!carbon || !carbon.position3D) {
      positionedElements.set(atom.elementId, {
        ...atom,
        position3D: { x: 0, y: 0, z: 0 },
      });
      return;
    }

    // Find all atoms bonded to this carbon
    const atomsBondedToCarbon = bonds
      .filter(b => b.fromElementId === carbonId || b.toElementId === carbonId)
      .map(b => {
        const otherId = b.fromElementId === carbonId ? b.toElementId : b.fromElementId;
        return elements.find(el => el.elementId === otherId);
      })
      .filter(el => el !== undefined);

    // Position around carbon using tetrahedral-like arrangement
    const index = atomsBondedToCarbon.findIndex(el => el?.elementId === atom.elementId);
    const atomData = elementLookup.get(atom.symbol);
    const carbonData = elementLookup.get("C");

    if (!atomData || !carbonData) {
      positionedElements.set(atom.elementId, {
        ...atom,
        position3D: { x: carbon.position3D.x, y: 0, z: 0 },
      });
      return;
    }

    // Use actual bond length from chemistry data (e.g., C-H = 1.09 Å)
    const bondLength = getBondLength(carbonData, atomData);

    // Count how many non-carbon atoms are bonded to this carbon
    const nonCarbonNeighbors = atomsBondedToCarbon.filter(el => el?.symbol !== "C");
    const nonCarbonIndex = nonCarbonNeighbors.findIndex(el => el?.elementId === atom.elementId);

    // Determine position based on carbon's neighbors
    // For chain carbons: use tetrahedral geometry perpendicular to chain axis
    let offset: { x: number; y: number; z: number };

    if (nonCarbonNeighbors.length === 1) {
      // Terminal carbon with 3 H - use tetrahedral
      const positions = [
        { x: 0, y: 1, z: 0 },      // Up
        { x: 0, y: 0.5, z: 0.866 }, // 120° in yz plane
        { x: 0, y: -0.5, z: 0.866 }, // 120° in yz plane
      ];
      offset = positions[nonCarbonIndex % positions.length];
    } else if (nonCarbonNeighbors.length === 2) {
      // Middle carbon with 2 H - opposite sides in yz plane
      const positions = [
        { x: 0, y: 1, z: 0 },      // Up
        { x: 0, y: -1, z: 0 },     // Down
      ];
      offset = positions[nonCarbonIndex % positions.length];
    } else {
      // Fallback: distribute around carbon
      const angle = (nonCarbonIndex * 2 * Math.PI) / nonCarbonNeighbors.length;
      offset = {
        x: 0,
        y: Math.cos(angle),
        z: Math.sin(angle),
      };
    }

    positionedElements.set(atom.elementId, {
      ...atom,
      position3D: {
        x: carbon.position3D.x + offset.x * bondLength,
        y: carbon.position3D.y + offset.y * bondLength,
        z: carbon.position3D.z + offset.z * bondLength,
      },
    });
  });

  // Convert map back to array
  const result = elements.map(el => positionedElements.get(el.elementId) || el);

  console.log('[molecular-geometry] Generated chain structure:', {
    carbonCount: chainOrder.length,
    totalAtoms: elements.length,
    chainLength: totalLength,
  });

  return {
    elements: result,
    geometry: {
      type: "custom",
      generatedAt: new Date(),
    },
  };
}

// ============================================================================
// 3D COORDINATE GENERATION
// ============================================================================

/**
 * Generates 3D coordinates for all atoms in a molecule
 *
 * @param elements Array of compound elements
 * @param bonds Array of bonds
 * @param allElements Full element data for lookups
 * @returns Array of elements with position3D populated
 */
export function generate3DCoordinates(
  elements: CompoundElement[],
  bonds: Bond[],
  allElements: Element[]
): { elements: CompoundElement[]; geometry: MolecularGeometry } {
  // Handle edge cases
  if (elements.length === 0) {
    return {
      elements: [],
      geometry: { type: "custom", generatedAt: new Date() },
    };
  }

  if (elements.length === 1) {
    // Single atom at origin
    return {
      elements: elements.map(el => ({
        ...el,
        position3D: { x: 0, y: 0, z: 0 },
      })),
      geometry: { type: "custom", generatedAt: new Date() },
    };
  }

  // Check if it's a carbon chain (organic molecule)
  if (isChainStructure(elements, bonds)) {
    return generateChainCoordinates(elements, bonds, allElements);
  }

  // Find central atom
  const centralAtomId = findCentralAtom(elements, bonds, allElements);
  if (!centralAtomId) {
    // Fallback: linear arrangement
    return generateLinearFallback(elements);
  }

  const centralElement = elements.find(el => el.elementId === centralAtomId)!;
  const elementLookup = new Map(allElements.map(el => [el.symbol, el]));
  const centralElementData = elementLookup.get(centralElement.symbol);

  // Find atoms bonded to central atom
  const bondedAtoms = bonds
    .filter(bond => bond.fromElementId === centralAtomId || bond.toElementId === centralAtomId)
    .map(bond => {
      const atomId = bond.fromElementId === centralAtomId ? bond.toElementId : bond.fromElementId;
      return elements.find(el => el.elementId === atomId)!;
    });

  const bondCount = bondedAtoms.length;

  // Determine geometry
  const geometryType = determineVSEPRGeometry(bondCount, centralElementData);

  console.log('[molecular-geometry] Generated structure:', {
    centralAtom: centralElement.symbol,
    bondCount,
    geometryType,
    bondedAtoms: bondedAtoms.map(a => a.symbol),
    totalElements: elements.length
  });

  // Generate coordinates
  const updatedElements = elements.map(el => {
    if (el.elementId === centralAtomId) {
      // Central atom at origin
      return { ...el, position3D: { x: 0, y: 0, z: 0 } };
    }

    const bondedIndex = bondedAtoms.findIndex(atom => atom.elementId === el.elementId);
    if (bondedIndex === -1) {
      // Not bonded to central atom (shouldn't happen in simple molecules)
      return { ...el, position3D: { x: 0, y: 0, z: 0 } };
    }

    // Get full element data for bond length calculation
    const currentElementData = elementLookup.get(el.symbol);
    if (!currentElementData || !centralElementData) {
      return { ...el, position3D: { x: 0, y: 0, z: 0 } };
    }

    // Calculate bond length based on sum of atomic radii (atoms will touch)
    const bondLength = getBondLength(centralElementData, currentElementData);

    // Get unit vector from geometry template
    let unitVector: { x: number; y: number; z: number };
    switch (geometryType) {
      case "linear":
        unitVector = GEOMETRY_TEMPLATES.linear(bondedIndex);
        break;
      case "bent":
        unitVector = GEOMETRY_TEMPLATES.bent(bondedIndex);
        break;
      case "trigonal-planar":
        unitVector = GEOMETRY_TEMPLATES.trigonalPlanar(bondedIndex);
        break;
      case "tetrahedral":
        unitVector = GEOMETRY_TEMPLATES.tetrahedral(bondedIndex);
        break;
      case "trigonal-pyramidal":
        unitVector = GEOMETRY_TEMPLATES.trigonalPyramidal(bondedIndex);
        break;
      case "trigonal-bipyramidal":
        unitVector = GEOMETRY_TEMPLATES.trigonalBipyramidal(bondedIndex);
        break;
      case "octahedral":
        unitVector = GEOMETRY_TEMPLATES.octahedral(bondedIndex);
        break;
      default:
        unitVector = { x: 1, y: 0, z: 0 };
    }

    // Scale by actual bond length (sum of radii - atoms touch)
    return {
      ...el,
      position3D: {
        x: unitVector.x * bondLength,
        y: unitVector.y * bondLength,
        z: unitVector.z * bondLength,
      },
    };
  });

  return {
    elements: updatedElements,
    geometry: {
      type: geometryType,
      centralAtomId,
      generatedAt: new Date(),
    },
  };
}

/**
 * Fallback: arranges atoms in a line if no central atom detected
 * Uses a default spacing that ensures atoms don't overlap
 */
function generateLinearFallback(
  elements: CompoundElement[]
): { elements: CompoundElement[]; geometry: MolecularGeometry } {
  // Use average atom spacing (approximately 4 units for most atoms)
  const avgSpacing = 4.5;
  const totalWidth = (elements.length - 1) * avgSpacing;
  const startX = -totalWidth / 2;

  console.log('[molecular-geometry] Using linear fallback:', {
    elementCount: elements.length,
    avgSpacing,
    totalWidth,
    startX
  });

  return {
    elements: elements.map((el, index) => ({
      ...el,
      position3D: {
        x: startX + index * avgSpacing,
        y: 0,
        z: 0,
      },
    })),
    geometry: { type: "linear", generatedAt: new Date() },
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculates the bounding box of all atoms
 * Useful for camera positioning
 */
export function calculateBoundingBox(elements: CompoundElement[]): {
  min: { x: number; y: number; z: number };
  max: { x: number; y: number; z: number };
  center: { x: number; y: number; z: number };
  size: number;
} {
  if (elements.length === 0) {
    return {
      min: { x: 0, y: 0, z: 0 },
      max: { x: 0, y: 0, z: 0 },
      center: { x: 0, y: 0, z: 0 },
      size: 0,
    };
  }

  const positions = elements
    .filter(el => el.position3D)
    .map(el => el.position3D!);

  if (positions.length === 0) {
    return {
      min: { x: 0, y: 0, z: 0 },
      max: { x: 0, y: 0, z: 0 },
      center: { x: 0, y: 0, z: 0 },
      size: 0,
    };
  }

  const min = {
    x: Math.min(...positions.map(p => p.x)),
    y: Math.min(...positions.map(p => p.y)),
    z: Math.min(...positions.map(p => p.z)),
  };

  const max = {
    x: Math.max(...positions.map(p => p.x)),
    y: Math.max(...positions.map(p => p.y)),
    z: Math.max(...positions.map(p => p.z)),
  };

  const center = {
    x: (min.x + max.x) / 2,
    y: (min.y + max.y) / 2,
    z: (min.z + max.z) / 2,
  };

  const size = Math.max(
    max.x - min.x,
    max.y - min.y,
    max.z - min.z
  );

  return { min, max, center, size };
}

/**
 * Validates that all elements have 3D coordinates
 */
export function validate3DCoordinates(elements: CompoundElement[]): {
  isValid: boolean;
  missingCoordinates: string[];
} {
  const missing = elements
    .filter(el => !el.position3D)
    .map(el => el.symbol);

  return {
    isValid: missing.length === 0,
    missingCoordinates: missing,
  };
}
