import { Element } from "@/lib/types/element";
import { Bond, BondType } from "@/lib/types/compound";
import { isMetal, isNonmetal } from "./chemistry-helpers";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  compoundName: string;
  formula: string;
  bondType: "ionic" | "covalent" | "metallic" | "mixed";
  status: "valid" | "warning" | "invalid";
  explanation: string;
  suggestions?: string[];
  warnings?: string[];
  details?: {
    chargeBalance?: string;
    oxidationStates?: Record<string, number>;
    bondingPattern?: string;
  };
}

interface PolyatomicIon {
  formula: string;
  name: string;
  charge: number;
  atoms: Record<string, number>;
}

// ============================================================================
// POLYATOMIC ION DATABASE
// ============================================================================

const POLYATOMIC_IONS: PolyatomicIon[] = [
  { formula: "NH4", name: "ammonium", charge: 1, atoms: { N: 1, H: 4 } },
  { formula: "OH", name: "hydroxide", charge: -1, atoms: { O: 1, H: 1 } },
  { formula: "CN", name: "cyanide", charge: -1, atoms: { C: 1, N: 1 } },
  { formula: "NO3", name: "nitrate", charge: -1, atoms: { N: 1, O: 3 } },
  { formula: "NO2", name: "nitrite", charge: -1, atoms: { N: 1, O: 2 } },
  { formula: "SO4", name: "sulfate", charge: -2, atoms: { S: 1, O: 4 } },
  { formula: "SO3", name: "sulfite", charge: -2, atoms: { S: 1, O: 3 } },
  { formula: "PO4", name: "phosphate", charge: -3, atoms: { P: 1, O: 4 } },
  { formula: "PO3", name: "phosphite", charge: -3, atoms: { P: 1, O: 3 } },
  { formula: "CO3", name: "carbonate", charge: -2, atoms: { C: 1, O: 3 } },
  { formula: "HCO3", name: "bicarbonate", charge: -1, atoms: { H: 1, C: 1, O: 3 } },
  { formula: "ClO4", name: "perchlorate", charge: -1, atoms: { Cl: 1, O: 4 } },
  { formula: "ClO3", name: "chlorate", charge: -1, atoms: { Cl: 1, O: 3 } },
  { formula: "ClO2", name: "chlorite", charge: -1, atoms: { Cl: 1, O: 2 } },
  { formula: "ClO", name: "hypochlorite", charge: -1, atoms: { Cl: 1, O: 1 } },
  { formula: "MnO4", name: "permanganate", charge: -1, atoms: { Mn: 1, O: 4 } },
  { formula: "Cr2O7", name: "dichromate", charge: -2, atoms: { Cr: 2, O: 7 } },
  { formula: "CrO4", name: "chromate", charge: -2, atoms: { Cr: 1, O: 4 } },
  { formula: "SCN", name: "thiocyanate", charge: -1, atoms: { S: 1, C: 1, N: 1 } },
];

// ============================================================================
// OXIDATION STATES
// ============================================================================

const OXIDATION_STATES: Record<string, number> = {
  // Group 1: +1
  H: 1, Li: 1, Na: 1, K: 1, Rb: 1, Cs: 1,
  // Group 2: +2
  Be: 2, Mg: 2, Ca: 2, Sr: 2, Ba: 2,
  // Group 13: +3
  B: 3, Al: 3,
  // Group 14: +2/+4
  Sn: 2, Pb: 2,
  // Group 15: -3
  N: -3, P: -3,
  // Group 16: -2
  O: -2, S: -2,
  // Group 17: -1
  F: -1, Cl: -1, Br: -1, I: -1,
  // Transition metals
  Fe: 3, Cu: 2, Zn: 2, Ag: 1,
};

// ============================================================================
// DIATOMIC MOLECULES
// ============================================================================

const DIATOMIC_MOLECULES: Record<string, { bondType: BondType; name: string }> = {
  H2: { bondType: "single", name: "Hydrogen" },
  N2: { bondType: "triple", name: "Nitrogen" },
  O2: { bondType: "double", name: "Oxygen" },
  F2: { bondType: "single", name: "Fluorine" },
  Cl2: { bondType: "single", name: "Chlorine" },
  Br2: { bondType: "single", name: "Bromine" },
  I2: { bondType: "single", name: "Iodine" },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function subscript(num: number): string {
  return num.toString().split("").map(d => "₀₁₂₃₄₅₆₇₈₉"[parseInt(d)]).join("");
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function lcm(a: number, b: number): number {
  return Math.abs(a * b) / gcd(a, b);
}

function isNobleGas(element: Element): boolean {
  return element.category === "noble-gas";
}

// ============================================================================
// POLYATOMIC ION DETECTION
// ============================================================================

interface DetectedIon {
  ion: PolyatomicIon;
  elementIds: string[];
}

function detectPolyatomicIons(
  bondedElements: Array<{ id: string; element: Element; symbol: string }>,
  bonds: Bond[]
): DetectedIon[] {
  const detected: DetectedIon[] = [];
  const used = new Set<string>();

  // Build adjacency graph
  const graph = new Map<string, Set<string>>();
  bonds.forEach(bond => {
    if (!graph.has(bond.fromElementId)) graph.set(bond.fromElementId, new Set());
    if (!graph.has(bond.toElementId)) graph.set(bond.toElementId, new Set());
    graph.get(bond.fromElementId)!.add(bond.toElementId);
    graph.get(bond.toElementId)!.add(bond.fromElementId);
  });

  // Find connected components
  function getComponent(startId: string): string[] {
    const component: string[] = [];
    const queue = [startId];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const id = queue.shift()!;
      if (visited.has(id) || used.has(id)) continue;
      visited.add(id);
      component.push(id);

      const neighbors = graph.get(id) || new Set();
      neighbors.forEach(nId => {
        if (!visited.has(nId) && !used.has(nId)) {
          queue.push(nId);
        }
      });
    }

    return component;
  }

  // Try to match each polyatomic ion
  for (const element of bondedElements) {
    if (used.has(element.id)) continue;

    const component = getComponent(element.id);
    if (component.length === 0) continue;

    // Count atoms in this component
    const atomCounts: Record<string, number> = {};
    component.forEach(id => {
      const el = bondedElements.find(e => e.id === id);
      if (el) {
        atomCounts[el.symbol] = (atomCounts[el.symbol] || 0) + 1;
      }
    });

    // Try to match against known polyatomic ions
    for (const ion of POLYATOMIC_IONS) {
      const ionKeys = Object.keys(ion.atoms).sort();
      const compKeys = Object.keys(atomCounts).sort();

      if (ionKeys.length !== compKeys.length) continue;
      if (!ionKeys.every((k, i) => k === compKeys[i])) continue;
      if (!ionKeys.every(k => ion.atoms[k] === atomCounts[k])) continue;

      // Match found!
      detected.push({ ion, elementIds: component });
      component.forEach(id => used.add(id));
      break;
    }
  }

  return detected;
}

// ============================================================================
// IONIC COMPOUND FORMULA GENERATION
// ============================================================================

function generateIonicFormula(
  bondedElements: Array<{ id: string; element: Element; symbol: string }>,
  detectedIons: DetectedIon[]
): { formula: string; isBalanced: boolean; explanation: string } {
  const usedIds = new Set(detectedIons.flatMap(d => d.elementIds));

  // Separate ions by charge
  const cationIons = detectedIons.filter(d => d.ion.charge > 0);
  const anionIons = detectedIons.filter(d => d.ion.charge < 0);

  // Get simple cations (not in polyatomic ions)
  const simpleCations: Array<{ symbol: string; charge: number; count: number }> = [];
  const simpleAnions: Array<{ symbol: string; charge: number; count: number }> = [];

  bondedElements.forEach(el => {
    if (usedIds.has(el.id)) return;

    const charge = OXIDATION_STATES[el.symbol] || 0;
    if (charge > 0) {
      const existing = simpleCations.find(c => c.symbol === el.symbol);
      if (existing) {
        existing.count++;
      } else {
        simpleCations.push({ symbol: el.symbol, charge, count: 1 });
      }
    } else if (charge < 0) {
      const existing = simpleAnions.find(a => a.symbol === el.symbol);
      if (existing) {
        existing.count++;
      } else {
        simpleAnions.push({ symbol: el.symbol, charge: Math.abs(charge), count: 1 });
      }
    }
  });

  // Determine cation and anion
  let cationCharge: number;
  let anionCharge: number;
  let cationFormula: string;
  let anionFormula: string;
  let cationCount: number;
  let anionCount: number;

  // Get cation info
  if (cationIons.length > 0) {
    const cation = cationIons[0];
    cationCharge = cation.ion.charge;
    cationFormula = cation.ion.formula;
    cationCount = 1;
  } else if (simpleCations.length > 0) {
    const cation = simpleCations[0];
    cationCharge = cation.charge;
    cationFormula = cation.symbol;
    cationCount = cation.count;
  } else {
    return { formula: "", isBalanced: false, explanation: "No cation found" };
  }

  // Get anion info
  if (anionIons.length > 0) {
    const anion = anionIons[0];
    anionCharge = Math.abs(anion.ion.charge);
    anionFormula = anion.ion.formula;
    anionCount = anionIons.length;
  } else if (simpleAnions.length > 0) {
    const anion = simpleAnions[0];
    anionCharge = anion.charge;
    anionFormula = anion.symbol;
    anionCount = anion.count;
  } else {
    return { formula: "", isBalanced: false, explanation: "No anion found" };
  }

  // Calculate correct ratio using LCM
  const commonMultiple = lcm(cationCharge, anionCharge);
  const correctCationCount = commonMultiple / cationCharge;
  const correctAnionCount = commonMultiple / anionCharge;

  // Check if current counts match correct ratio
  const isBalanced = cationCount === correctCationCount && anionCount === correctAnionCount;

  // Build formula: cation first, then anion
  let formula = "";

  // Add cation
  const isPolyatomicCation = cationIons.length > 0;
  if (isPolyatomicCation && correctCationCount > 1) {
    formula += `(${cationFormula})${subscript(correctCationCount)}`;
  } else if (correctCationCount > 1) {
    formula += `${cationFormula}${subscript(correctCationCount)}`;
  } else {
    formula += cationFormula;
  }

  // Add anion
  const isPolyatomicAnion = anionIons.length > 0;
  if (isPolyatomicAnion && correctAnionCount > 1) {
    formula += `(${anionFormula})${subscript(correctAnionCount)}`;
  } else if (correctAnionCount > 1) {
    formula += `${anionFormula}${subscript(correctAnionCount)}`;
  } else {
    formula += anionFormula;
  }

  const explanation = isBalanced
    ? "Charges balanced"
    : `Need ${correctCationCount} ${cationFormula} and ${correctAnionCount} ${anionFormula} for charge balance`;

  return { formula, isBalanced, explanation };
}

// ============================================================================
// COVALENT COMPOUND FORMULA GENERATION
// ============================================================================

function generateCovalentFormula(elementCounts: Record<string, number>): string {
  let formula = "";
  const symbols = Object.keys(elementCounts).sort();
  const hasCarbon = symbols.includes("C");

  if (hasCarbon) {
    // Hill system: C first, then H, then rest alphabetically
    formula += "C" + (elementCounts["C"] > 1 ? subscript(elementCounts["C"]) : "");
    if (symbols.includes("H")) {
      formula += "H" + (elementCounts["H"] > 1 ? subscript(elementCounts["H"]) : "");
    }
    symbols
      .filter(s => s !== "C" && s !== "H")
      .forEach(symbol => {
        formula += symbol + (elementCounts[symbol] > 1 ? subscript(elementCounts[symbol]) : "");
      });
  } else {
    // Alphabetical
    symbols.forEach(symbol => {
      formula += symbol + (elementCounts[symbol] > 1 ? subscript(elementCounts[symbol]) : "");
    });
  }

  return formula;
}

// ============================================================================
// IUPAC NAMING
// ============================================================================

const ELEMENT_PREFIXES: Record<number, string> = {
  1: "mono", 2: "di", 3: "tri", 4: "tetra", 5: "penta",
  6: "hexa", 7: "hepta", 8: "octa", 9: "nona", 10: "deca",
};

function toRomanNumeral(num: number): string {
  const romanNumerals: [number, string][] = [
    [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]
  ];
  let result = "";
  for (const [value, numeral] of romanNumerals) {
    while (num >= value) {
      result += numeral;
      num -= value;
    }
  }
  return result;
}

function generateIonicName(
  cationElement: Element | null,
  anionElement: Element | null,
  detectedIons: DetectedIon[]
): string {
  const cationIon = detectedIons.find(d => d.ion.charge > 0);
  const anionIon = detectedIons.find(d => d.ion.charge < 0);

  let cationName = "";
  let anionName = "";

  // Cation name
  if (cationIon) {
    cationName = cationIon.ion.name.charAt(0).toUpperCase() + cationIon.ion.name.slice(1);
  } else if (cationElement) {
    cationName = cationElement.name;
    const charge = OXIDATION_STATES[cationElement.symbol];
    if (isMetal(cationElement) && charge > 1) {
      cationName += ` (${toRomanNumeral(charge)})`;
    }
  }

  // Anion name
  if (anionIon) {
    anionName = anionIon.ion.name;
  } else if (anionElement) {
    let name = anionElement.name.toLowerCase();
    if (name.endsWith("ine")) {
      name = name.slice(0, -3) + "ide";
    } else if (name.endsWith("gen")) {
      name = name.slice(0, -3) + "ide";
    } else if (name.endsWith("ygen")) {
      name = name.slice(0, -4) + "ide";
    } else if (name.endsWith("ur")) {
      name = name.slice(0, -2) + "ide";
    } else if (name.endsWith("on")) {
      name = name.slice(0, -2) + "ide";
    } else if (name.endsWith("orus")) {
      name = name.slice(0, -4) + "ide";
    } else {
      name += "ide";
    }
    anionName = name;
  }

  return `${cationName} ${anionName}`;
}

function generateCovalentName(elementCounts: Record<string, number>, elementMap: Map<string, Element>): string {
  const symbols = Object.keys(elementCounts);
  if (symbols.length < 2) return "Unknown Compound";

  const elements = symbols.map(s => elementMap.get(s)!);
  const sorted = elements.sort((a, b) => {
    const enA = a.electronegativity || 0;
    const enB = b.electronegativity || 0;
    return enA - enB;
  });

  const first = sorted[0];
  const second = sorted[1];
  const firstCount = elementCounts[first.symbol];
  const secondCount = elementCounts[second.symbol];

  let name = "";

  // First element
  if (firstCount > 1) {
    name += ELEMENT_PREFIXES[firstCount] + first.name.toLowerCase();
  } else {
    name += first.name;
  }

  name += " ";

  // Second element
  name += ELEMENT_PREFIXES[secondCount] || "";

  let secondName = second.name.toLowerCase();
  if (secondName.endsWith("ine")) {
    secondName = secondName.slice(0, -3) + "ide";
  } else if (secondName.endsWith("gen")) {
    secondName = secondName.slice(0, -3) + "ide";
  } else if (secondName.endsWith("ygen")) {
    secondName = secondName.slice(0, -4) + "ide";
  } else if (secondName.endsWith("ur")) {
    secondName = secondName.slice(0, -2) + "ide";
  } else if (secondName.endsWith("on")) {
    secondName = secondName.slice(0, -2) + "ide";
  } else if (secondName.endsWith("orus")) {
    secondName = secondName.slice(0, -4) + "ide";
  } else {
    secondName += "ide";
  }

  name += secondName;

  return name.charAt(0).toUpperCase() + name.slice(1);
}

// ============================================================================
// MAIN VALIDATION FUNCTION
// ============================================================================

export function validateCompound(
  canvasElements: Array<{ id: string; element: Element; symbol: string }>,
  bonds: Bond[]
): ValidationResult {
  // Get bonded elements
  const bondedElementIds = new Set<string>();
  bonds.forEach(bond => {
    bondedElementIds.add(bond.fromElementId);
    bondedElementIds.add(bond.toElementId);
  });

  const bondedElements = canvasElements.filter(el => bondedElementIds.has(el.id));

  if (bondedElements.length === 0) {
    return {
      isValid: false,
      compoundName: "",
      formula: "",
      bondType: "covalent",
      status: "invalid",
      explanation: "No bonded elements found. Add elements and create bonds to form a compound.",
      suggestions: ["Drag elements close together to auto-bond", "Click one element, then another to create a bond"],
    };
  }

  // Count elements
  const elementCounts: Record<string, number> = {};
  const elementMap = new Map<string, Element>();

  bondedElements.forEach(el => {
    elementCounts[el.symbol] = (elementCounts[el.symbol] || 0) + 1;
    elementMap.set(el.symbol, el.element);
  });

  const uniqueElements = Array.from(elementMap.values());
  const symbols = Object.keys(elementCounts);

  // Check for noble gases
  const nobleGases = uniqueElements.filter(isNobleGas);
  if (nobleGases.length > 0) {
    return {
      isValid: false,
      compoundName: "",
      formula: "",
      bondType: "covalent",
      status: "invalid",
      explanation: `Noble gases (${nobleGases.map(e => e.symbol).join(", ")}) do not typically form compounds.`,
      suggestions: ["Remove noble gas elements"],
    };
  }

  // Check for diatomic molecules
  if (symbols.length === 1) {
    const symbol = symbols[0];
    const count = elementCounts[symbol];
    const element = elementMap.get(symbol)!;
    const formulaKey = symbol + count;

    if (count === 2 && DIATOMIC_MOLECULES[formulaKey]) {
      const diatomic = DIATOMIC_MOLECULES[formulaKey];
      return {
        isValid: true,
        compoundName: diatomic.name,
        formula: symbol + subscript(count),
        bondType: "covalent",
        status: "valid",
        explanation: `Valid diatomic molecule. ${element.name} naturally exists as ${formulaKey} with ${diatomic.bondType} bonds.`,
      };
    }

    return {
      isValid: false,
      compoundName: "",
      formula: symbol + (count > 1 ? subscript(count) : ""),
      bondType: "covalent",
      status: "invalid",
      explanation: `This is not a valid compound. ${element.name} alone does not form a stable compound.`,
      suggestions: ["Add different elements to create a compound"],
    };
  }

  // Determine compound type
  const metals = uniqueElements.filter(isMetal);
  const nonmetals = uniqueElements.filter(isNonmetal);

  let compoundType: "ionic" | "covalent" | "metallic" | "mixed";
  let isIonic = false;

  if (metals.length > 0 && nonmetals.length > 0) {
    compoundType = "ionic";
    isIonic = true;
  } else if (metals.length > 1) {
    compoundType = "metallic";
  } else if (nonmetals.length >= 2) {
    compoundType = "covalent";
  } else {
    compoundType = "mixed";
  }

  // Detect polyatomic ions
  const detectedIons = detectPolyatomicIons(bondedElements, bonds);

  // Generate formula
  let formula: string;
  let isBalanced = true;
  let explanation = "";

  if (isIonic) {
    const result = generateIonicFormula(bondedElements, detectedIons);
    formula = result.formula;
    isBalanced = result.isBalanced;
    explanation = result.explanation;

    if (!isBalanced) {
      return {
        isValid: false,
        compoundName: "",
        formula: formula,
        bondType: "ionic",
        status: "invalid",
        explanation: `Charge not balanced. ${explanation}`,
        suggestions: [`Correct formula: ${formula}`],
      };
    }
  } else {
    formula = generateCovalentFormula(elementCounts);
  }

  // Generate IUPAC name
  let compoundName: string;

  if (isIonic) {
    const usedIds = new Set(detectedIons.flatMap(d => d.elementIds));
    const cationEl = bondedElements.find(el => !usedIds.has(el.id) && isMetal(el.element))?.element || null;
    const anionEl = bondedElements.find(el => !usedIds.has(el.id) && isNonmetal(el.element))?.element || null;
    compoundName = generateIonicName(cationEl, anionEl, detectedIons);
  } else {
    compoundName = generateCovalentName(elementCounts, elementMap);
  }

  // Check for warnings
  const warnings: string[] = [];

  if (symbols.includes("S") && symbols.includes("F") && elementCounts["F"] === 6) {
    warnings.push("SF₆ is a rare but stable compound (hypervalent sulfur)");
  }

  if (symbols.includes("O") && elementCounts["O"] >= 2) {
    const oxygenBonds = bonds.filter(bond => {
      const fromEl = bondedElements.find(el => el.id === bond.fromElementId);
      const toEl = bondedElements.find(el => el.id === bond.toElementId);
      return fromEl?.symbol === "O" && toEl?.symbol === "O";
    });

    if (oxygenBonds.length > 0) {
      warnings.push("Contains O-O bond (peroxide)");
    }
  }

  return {
    isValid: true,
    compoundName,
    formula,
    bondType: compoundType,
    status: warnings.length > 0 ? "warning" : "valid",
    explanation: warnings.length > 0
      ? `Valid compound with special properties: ${warnings.join(", ")}`
      : `Chemically valid ${compoundType} compound.`,
    warnings: warnings.length > 0 ? warnings : undefined,
    details: {
      chargeBalance: isIonic ? "Charges balanced ✓" : undefined,
      bondingPattern: `${bonds.length} bond(s) between ${bondedElements.length} atom(s)`,
    },
  };
}
