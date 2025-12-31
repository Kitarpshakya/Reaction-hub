import { Element } from "@/lib/types/element";
import { BondType } from "@/lib/types/compound";

/**
 * Determines the bond type between two elements based on chemistry laws
 */
export function determineBondType(element1: Element, element2: Element): BondType {
  const en1 = element1.electronegativity || 0;
  const en2 = element2.electronegativity || 0;

  if (en1 === 0 || en2 === 0) {
    return "single";
  }

  const enDifference = Math.abs(en1 - en2);
  const isMetal1 = isMetal(element1);
  const isMetal2 = isMetal(element2);

  // Metallic bond: both are metals
  if (isMetal1 && isMetal2) {
    return "metallic";
  }

  // Ionic bond: large electronegativity difference (> 1.7)
  if (enDifference > 1.7) {
    return "ionic";
  }

  // Covalent bonds: check for potential multiple bonds
  const bondOrder = estimateBondOrder(element1, element2);

  if (bondOrder === 3) {
    return "triple";
  } else if (bondOrder === 2) {
    return "double";
  } else {
    return "single";
  }
}

/**
 * Checks if an element is a metal
 */
export function isMetal(element: Element): boolean {
  const metalCategories = [
    "alkali-metal",
    "alkaline-earth-metal",
    "transition-metal",
    "post-transition-metal",
    "lanthanide",
    "actinide",
  ];
  return metalCategories.includes(element.category);
}

/**
 * Checks if an element is a nonmetal
 */
export function isNonmetal(element: Element): boolean {
  return element.category === "nonmetal" || element.category === "halogen";
}

/**
 * Estimates bond order (1, 2, or 3) based on elements
 */
function estimateBondOrder(element1: Element, element2: Element): number {
  const symbol1 = element1.symbol;
  const symbol2 = element2.symbol;

  // Known triple bonds
  const tripleBondPairs = [
    ["N", "N"], // N≡N
    ["C", "N"], // C≡N
    ["C", "C"], // C≡C (alkynes)
  ];

  // Known double bonds
  const doubleBondPairs = [
    ["O", "O"], // O=O
    ["C", "O"], // C=O
    ["C", "C"], // C=C (alkenes)
    ["S", "O"], // S=O
    ["N", "O"], // N=O
  ];

  for (const [a, b] of tripleBondPairs) {
    if ((symbol1 === a && symbol2 === b) || (symbol1 === b && symbol2 === a)) {
      return 3;
    }
  }

  for (const [a, b] of doubleBondPairs) {
    if ((symbol1 === a && symbol2 === b) || (symbol1 === b && symbol2 === a)) {
      return 2;
    }
  }

  return 1;
}

/**
 * Gets the typical valence (bonding capacity) of an element
 */
export function getValence(element: Element): number {
  const symbol = element.symbol;

  const valenceMap: Record<string, number> = {
    H: 1, Li: 1, Na: 1, K: 1, Rb: 1, Cs: 1, Fr: 1,
    Be: 2, Mg: 2, Ca: 2, Sr: 2, Ba: 2, Ra: 2,
    B: 3, Al: 3, Ga: 3, In: 3, Tl: 3,
    C: 4, Si: 4, Ge: 4, Sn: 4, Pb: 4,
    N: 3, P: 5, As: 5, Sb: 5, Bi: 5, // P can form 5 bonds (e.g., H₃PO₄)
    O: 2, S: 6, Se: 6, Te: 6, Po: 6, // S can form 6 bonds (e.g., H₂SO₄)
    F: 1, Cl: 7, Br: 7, I: 7, At: 7, // Halogens can expand (e.g., ClO₄⁻)
    He: 0, Ne: 0, Ar: 0, Kr: 0, Xe: 0, Rn: 0,
    Fe: 3, Cu: 2, Zn: 2, Ag: 1, Au: 3,
    Ni: 2, Co: 2, Cr: 3, Mn: 2, Ti: 4,
  };

  return valenceMap[symbol] ?? 2;
}

/**
 * Gets the bond value for a bond type
 */
function getBondValue(bondType: BondType): number {
  switch (bondType) {
    case "single": return 1;
    case "double": return 2;
    case "triple": return 3;
    case "ionic":
    case "covalent":
    case "metallic":
    default: return 1;
  }
}

/**
 * Counts total valence electrons used by an element's bonds
 */
export function countElementBonds(
  elementId: string,
  bonds: Array<{ fromElementId: string; toElementId: string; bondType?: BondType }>
): number {
  const elementBonds = bonds.filter(
    (bond) => bond.fromElementId === elementId || bond.toElementId === elementId
  );

  return elementBonds.reduce((total, bond) => {
    return total + getBondValue(bond.bondType || "single");
  }, 0);
}

/**
 * Gets remaining bonding capacity for an element
 */
export function getAvailableValence(
  element: Element,
  elementId: string,
  bonds: Array<{ fromElementId: string; toElementId: string; bondType?: BondType }>
): number {
  const maxValence = getValence(element);
  const currentBonds = countElementBonds(elementId, bonds);
  return Math.max(0, maxValence - currentBonds);
}

/**
 * Checks if a bond already exists between two elements
 */
export function bondExists(
  elementId1: string,
  elementId2: string,
  bonds: Array<{ fromElementId: string; toElementId: string; bondType?: BondType }>
): boolean {
  return bonds.some(
    (bond) =>
      (bond.fromElementId === elementId1 && bond.toElementId === elementId2) ||
      (bond.fromElementId === elementId2 && bond.toElementId === elementId1)
  );
}

/**
 * Validates if a bond can be formed between two elements
 */
export function canFormBond(
  element1: Element,
  element2: Element,
  elementId1: string,
  elementId2: string,
  bonds: Array<{ fromElementId: string; toElementId: string; bondType?: BondType }>
): boolean {
  if (element1.category === "noble-gas" || element2.category === "noble-gas") {
    return false;
  }

  if (bondExists(elementId1, elementId2, bonds)) {
    return false;
  }

  const available1 = getAvailableValence(element1, elementId1, bonds);
  const available2 = getAvailableValence(element2, elementId2, bonds);

  return available1 > 0 && available2 > 0;
}

/**
 * Calculates distance between two points
 */
export function calculateDistance(
  pos1: { x: number; y: number },
  pos2: { x: number; y: number }
): number {
  const dx = pos2.x - pos1.x;
  const dy = pos2.y - pos1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Checks if two elements are close enough to auto-bond
 */
export function areElementsClose(
  pos1: { x: number; y: number },
  pos2: { x: number; y: number },
  threshold: number = 100
): boolean {
  return calculateDistance(pos1, pos2) <= threshold;
}

/**
 * Gets bond display name
 */
export function getBondDisplayName(bondType: BondType): string {
  const names: Record<BondType, string> = {
    single: "Single Bond",
    double: "Double Bond",
    triple: "Triple Bond",
    ionic: "Ionic Bond",
    covalent: "Covalent Bond",
    metallic: "Metallic Bond",
  };
  return names[bondType] || bondType;
}

/**
 * Determines if elements should auto-group based on proximity
 */
export function shouldAutoGroup(
  elements: Array<{ position: { x: number; y: number }; id: string }>,
  newElement: { position: { x: number; y: number }; id: string },
  threshold: number = 80
): string[] {
  const nearbyElements: string[] = [];

  for (const el of elements) {
    if (el.id !== newElement.id) {
      const distance = calculateDistance(el.position, newElement.position);
      if (distance <= threshold) {
        nearbyElements.push(el.id);
      }
    }
  }

  return nearbyElements;
}

/**
 * Get element category color
 */
export function getElementCategoryColor(category: string): string {
  const colorMap: Record<string, string> = {
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
  return colorMap[category] || colorMap["unknown"];
}

/**
 * Calculate element bubble radius based on atomic mass
 */
export function calculateBubbleRadius(atomicMass: number, scaleFactor: number = 3): number {
  return Math.sqrt(atomicMass) * scaleFactor;
}
