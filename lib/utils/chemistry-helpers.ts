import { Element } from "@/lib/types/element";
import { BondType } from "@/lib/types/compound";

/**
 * Determines the bond type between two elements based on chemistry laws
 */
export function determineBondType(element1: Element, element2: Element): BondType {
  // Get electronegativities
  const en1 = element1.electronegativity || 0;
  const en2 = element2.electronegativity || 0;

  // If either element has no electronegativity data, default to single covalent
  if (en1 === 0 || en2 === 0) {
    return "single";
  }

  const enDifference = Math.abs(en1 - en2);

  // Check if either element is a metal
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

  // Polar covalent or non-polar covalent (0.4 - 1.7 difference)
  // For simplicity, we'll classify all covalent bonds
  // Could be single, double, or triple based on valence electrons

  // Check for potential multiple bonds based on elements
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
function isMetal(element: Element): boolean {
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
 * Estimates bond order (1, 2, or 3) based on elements
 * This is a simplified heuristic
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

  // Check for triple bonds
  for (const [a, b] of tripleBondPairs) {
    if ((symbol1 === a && symbol2 === b) || (symbol1 === b && symbol2 === a)) {
      return 3;
    }
  }

  // Check for double bonds
  for (const [a, b] of doubleBondPairs) {
    if ((symbol1 === a && symbol2 === b) || (symbol1 === b && symbol2 === a)) {
      return 2;
    }
  }

  // Default to single bond
  return 1;
}

/**
 * Gets the typical valence (bonding capacity) of an element
 */
export function getValence(element: Element): number {
  const symbol = element.symbol;

  // Common valences based on periodic table groups
  const valenceMap: Record<string, number> = {
    // Group 1: Alkali metals
    H: 1, Li: 1, Na: 1, K: 1, Rb: 1, Cs: 1, Fr: 1,

    // Group 2: Alkaline earth metals
    Be: 2, Mg: 2, Ca: 2, Sr: 2, Ba: 2, Ra: 2,

    // Group 13
    B: 3, Al: 3, Ga: 3, In: 3, Tl: 3,

    // Group 14
    C: 4, Si: 4, Ge: 4, Sn: 4, Pb: 4,

    // Group 15
    N: 3, P: 3, As: 3, Sb: 3, Bi: 3,

    // Group 16
    O: 2, S: 2, Se: 2, Te: 2, Po: 2,

    // Group 17: Halogens
    F: 1, Cl: 1, Br: 1, I: 1, At: 1,

    // Group 18: Noble gases (typically 0, but can form compounds)
    He: 0, Ne: 0, Ar: 0, Kr: 0, Xe: 0, Rn: 0,
  };

  const valence = valenceMap[symbol];

  // Log for debugging
  if (valence === undefined) {
    console.warn(`No valence defined for element ${symbol}, using default 2`);
    return 2; // Default to 2 for unknown elements
  }

  return valence;
}

/**
 * Gets the bond value (number of valence electrons used) for a bond type
 */
function getBondValue(bondType: BondType): number {
  switch (bondType) {
    case "single":
      return 1;
    case "double":
      return 2;
    case "triple":
      return 3;
    case "ionic":
    case "covalent":
    case "metallic":
      return 1;
    default:
      return 1;
  }
}

/**
 * Gets the number of valence electrons used by an element's bonds
 * Accounts for bond types: single=1, double=2, triple=3
 */
export function countElementBonds(
  elementId: string,
  bonds: Array<{ fromElementId: string; toElementId: string; bondType?: BondType }>
): number {
  const elementBonds = bonds.filter(
    (bond) => bond.fromElementId === elementId || bond.toElementId === elementId
  );

  const totalBondValue = elementBonds.reduce((total, bond) => {
    const bondValue = getBondValue(bond.bondType || "single");
    console.log(`  Bond ${bond.fromElementId}-${bond.toElementId} type: ${bond.bondType || "single"} = ${bondValue} valence`);
    return total + bondValue;
  }, 0);

  console.log(`Total valence used by element ${elementId}: ${totalBondValue}`);
  return totalBondValue;
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
 * Validates if a bond between two elements is chemically reasonable
 */
export function canFormBond(
  element1: Element,
  element2: Element,
  elementId1: string,
  elementId2: string,
  bonds: Array<{ fromElementId: string; toElementId: string; bondType?: BondType }>
): boolean {
  const symbol1 = element1.symbol;
  const symbol2 = element2.symbol;

  // Noble gases generally don't bond (with rare exceptions)
  if (element1.category === "noble-gas" || element2.category === "noble-gas") {
    console.log(`Cannot bond ${symbol1}-${symbol2}: noble gas`);
    return false;
  }

  // Check if bond already exists
  if (bondExists(elementId1, elementId2, bonds)) {
    console.log(`Cannot bond ${symbol1}-${symbol2}: bond already exists`);
    return false;
  }

  // Check if both elements have available valence
  const available1 = getAvailableValence(element1, elementId1, bonds);
  const available2 = getAvailableValence(element2, elementId2, bonds);

  console.log(`Bond check ${symbol1}-${symbol2}:`, {
    valence1: getValence(element1),
    valence2: getValence(element2),
    available1,
    available2,
    currentBonds1: countElementBonds(elementId1, bonds),
    currentBonds2: countElementBonds(elementId2, bonds),
  });

  if (available1 <= 0 || available2 <= 0) {
    console.log(
      `Cannot bond ${symbol1}-${symbol2}: insufficient valence (${available1}, ${available2})`
    );
    return false;
  }

  // All other checks passed
  console.log(`✓ Can bond ${symbol1}-${symbol2}`);
  return true;
}

/**
 * Calculates the distance between two points
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

  console.log(`Checking auto-bond proximity (threshold: ${threshold}px)`);

  for (const el of elements) {
    if (el.id !== newElement.id) {
      const distance = calculateDistance(el.position, newElement.position);
      const isClose = distance <= threshold;

      console.log(`  Distance to ${el.id}: ${distance.toFixed(1)}px ${isClose ? "✓ NEARBY" : ""}`);

      if (isClose) {
        nearbyElements.push(el.id);
      }
    }
  }

  console.log(`Found ${nearbyElements.length} nearby elements for auto-bonding`);

  return nearbyElements;
}
