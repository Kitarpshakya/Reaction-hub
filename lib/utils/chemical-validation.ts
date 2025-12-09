import { Element } from "@/lib/types/element";
import { Bond, BondType } from "@/lib/types/compound";

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

interface ElementInfo {
  element: Element;
  count: number;
  oxidationState?: number;
  charge?: number;
}

// ============================================================================
// OXIDATION STATE DATA
// ============================================================================

const OXIDATION_STATES: Record<string, number[]> = {
  // Group 1: Always +1
  H: [1, -1], // H is +1 except in metal hydrides where it's -1
  Li: [1], Na: [1], K: [1], Rb: [1], Cs: [1], Fr: [1],

  // Group 2: Always +2
  Be: [2], Mg: [2], Ca: [2], Sr: [2], Ba: [2], Ra: [2],

  // Group 13
  B: [3], Al: [3], Ga: [3, 1], In: [3, 1], Tl: [3, 1],

  // Group 14
  C: [4, 2, -4], Si: [4, -4], Ge: [4, 2], Sn: [4, 2], Pb: [4, 2],

  // Group 15
  N: [5, 4, 3, 2, 1, -3], P: [5, 3, -3], As: [5, 3, -3], Sb: [5, 3, -3], Bi: [5, 3],

  // Group 16
  O: [-2, -1, 2], // O is -2 except in peroxides (-1) and OF₂ (+2)
  S: [6, 4, 2, -2], Se: [6, 4, 2, -2], Te: [6, 4, 2, -2], Po: [6, 4, 2],

  // Group 17: Halogens
  F: [-1], // F is always -1
  Cl: [7, 5, 3, 1, -1], Br: [7, 5, 3, 1, -1], I: [7, 5, 3, 1, -1], At: [7, 5, 3, 1, -1],

  // Group 18: Noble gases
  He: [0], Ne: [0], Ar: [0], Kr: [2, 4], Xe: [2, 4, 6, 8], Rn: [2, 4, 6],

  // Transition metals (common oxidation states)
  Sc: [3], Ti: [4, 3, 2], V: [5, 4, 3, 2], Cr: [6, 3, 2], Mn: [7, 4, 3, 2],
  Fe: [3, 2], Co: [3, 2], Ni: [2, 3], Cu: [2, 1], Zn: [2],
  Y: [3], Zr: [4], Nb: [5, 3], Mo: [6, 4, 3], Tc: [7, 4],
  Ru: [4, 3, 2], Rh: [3, 2, 1], Pd: [4, 2], Ag: [1], Cd: [2],
  La: [3], Hf: [4], Ta: [5], W: [6, 4, 2], Re: [7, 6, 4],
  Os: [8, 6, 4], Ir: [4, 3, 2], Pt: [4, 2], Au: [3, 1], Hg: [2, 1],
};

// Common oxidation states (most likely)
const COMMON_OXIDATION_STATES: Record<string, number> = {
  H: 1, Li: 1, Na: 1, K: 1, Rb: 1, Cs: 1,
  Be: 2, Mg: 2, Ca: 2, Sr: 2, Ba: 2,
  B: 3, Al: 3,
  C: 4, Si: 4,
  N: -3, P: -3,
  O: -2, S: -2,
  F: -1, Cl: -1, Br: -1, I: -1,
  Fe: 2, Cu: 2, Zn: 2, Ag: 1,
};

// ============================================================================
// POLYATOMIC IONS
// ============================================================================

interface PolyatomicIon {
  formula: string;
  name: string;
  charge: number;
  composition: Record<string, number>;
}

const POLYATOMIC_IONS: PolyatomicIon[] = [
  { formula: "OH", name: "hydroxide", charge: -1, composition: { O: 1, H: 1 } },
  { formula: "NO₃", name: "nitrate", charge: -1, composition: { N: 1, O: 3 } },
  { formula: "NO₂", name: "nitrite", charge: -1, composition: { N: 1, O: 2 } },
  { formula: "SO₄", name: "sulfate", charge: -2, composition: { S: 1, O: 4 } },
  { formula: "SO₃", name: "sulfite", charge: -2, composition: { S: 1, O: 3 } },
  { formula: "PO₄", name: "phosphate", charge: -3, composition: { P: 1, O: 4 } },
  { formula: "CO₃", name: "carbonate", charge: -2, composition: { C: 1, O: 3 } },
  { formula: "HCO₃", name: "bicarbonate", charge: -1, composition: { H: 1, C: 1, O: 3 } },
  { formula: "ClO₄", name: "perchlorate", charge: -1, composition: { Cl: 1, O: 4 } },
  { formula: "ClO₃", name: "chlorate", charge: -1, composition: { Cl: 1, O: 3 } },
  { formula: "ClO₂", name: "chlorite", charge: -1, composition: { Cl: 1, O: 2 } },
  { formula: "ClO", name: "hypochlorite", charge: -1, composition: { Cl: 1, O: 1 } },
  { formula: "MnO₄", name: "permanganate", charge: -1, composition: { Mn: 1, O: 4 } },
  { formula: "Cr₂O₇", name: "dichromate", charge: -2, composition: { Cr: 2, O: 7 } },
  { formula: "CrO₄", name: "chromate", charge: -2, composition: { Cr: 1, O: 4 } },
  { formula: "NH₄", name: "ammonium", charge: 1, composition: { N: 1, H: 4 } },
];

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

function isNonmetal(element: Element): boolean {
  return element.category === "nonmetal" || element.category === "halogen";
}

function isNobleGas(element: Element): boolean {
  return element.category === "noble-gas";
}

function getElectronegativity(element: Element): number {
  return element.electronegativity || 0;
}

// ============================================================================
// OXIDATION STATE CALCULATION
// ============================================================================

function determineOxidationState(
  element: Element,
  partners: Element[],
  bondTypes: BondType[]
): number {
  const symbol = element.symbol;

  // Fixed oxidation states
  if (["Li", "Na", "K", "Rb", "Cs", "Fr"].includes(symbol)) return 1;
  if (["Be", "Mg", "Ca", "Sr", "Ba", "Ra"].includes(symbol)) return 2;
  if (symbol === "F") return -1;
  if (symbol === "Al") return 3;

  // Oxygen is usually -2
  if (symbol === "O") {
    // Check for peroxides (O-O bond)
    const hasOxygenPartner = partners.some(p => p.symbol === "O");
    return hasOxygenPartner ? -1 : -2;
  }

  // Hydrogen is usually +1, except in metal hydrides
  if (symbol === "H") {
    const hasMetal = partners.some(p => isMetal(p));
    return hasMetal ? -1 : 1;
  }

  // Halogens in binary compounds (except with O or other halogens)
  if (["Cl", "Br", "I"].includes(symbol)) {
    const hasOxygenOrHalogen = partners.some(
      p => p.symbol === "O" || ["F", "Cl", "Br", "I"].includes(p.symbol)
    );
    return hasOxygenOrHalogen ? (COMMON_OXIDATION_STATES[symbol] || 1) : -1;
  }

  // Use common oxidation state or first available
  return COMMON_OXIDATION_STATES[symbol] || OXIDATION_STATES[symbol]?.[0] || 0;
}

// ============================================================================
// FORMULA GENERATION (HILL SYSTEM)
// ============================================================================

/**
 * Generates chemical formula following the Hill system:
 * - If contains C: C first, then H, then alphabetical
 * - Otherwise: alphabetical order
 * - For ionic compounds: cation first, then anion
 */
function generateFormula(
  elementCounts: Record<string, number>,
  isIonic: boolean,
  cations: string[],
  anions: string[]
): string {
  let formula = "";

  if (isIonic) {
    // Ionic: Cations first, then anions
    const cationFormula = cations
      .sort()
      .map(symbol => {
        const count = elementCounts[symbol];
        return symbol + (count > 1 ? subscriptNumber(count) : "");
      })
      .join("");

    const anionFormula = anions
      .sort()
      .map(symbol => {
        const count = elementCounts[symbol];
        return symbol + (count > 1 ? subscriptNumber(count) : "");
      })
      .join("");

    formula = cationFormula + anionFormula;
  } else {
    // Covalent: Hill system
    const symbols = Object.keys(elementCounts).sort();
    const hasCarbon = symbols.includes("C");

    if (hasCarbon) {
      // C first, then H, then rest alphabetically
      formula += "C" + (elementCounts["C"] > 1 ? subscriptNumber(elementCounts["C"]) : "");
      if (symbols.includes("H")) {
        formula += "H" + (elementCounts["H"] > 1 ? subscriptNumber(elementCounts["H"]) : "");
      }
      symbols
        .filter(s => s !== "C" && s !== "H")
        .forEach(symbol => {
          formula += symbol + (elementCounts[symbol] > 1 ? subscriptNumber(elementCounts[symbol]) : "");
        });
    } else {
      // Alphabetical
      symbols.forEach(symbol => {
        formula += symbol + (elementCounts[symbol] > 1 ? subscriptNumber(elementCounts[symbol]) : "");
      });
    }
  }

  return formula;
}

function subscriptNumber(num: number): string {
  return num.toString().split("").map(d => "₀₁₂₃₄₅₆₇₈₉"[parseInt(d)]).join("");
}

// ============================================================================
// IUPAC NAMING
// ============================================================================

const ELEMENT_PREFIXES: Record<number, string> = {
  1: "mono", 2: "di", 3: "tri", 4: "tetra", 5: "penta",
  6: "hexa", 7: "hepta", 8: "octa", 9: "nona", 10: "deca",
};

function generateIUPACName(
  elementInfos: ElementInfo[],
  isIonic: boolean,
  isDiatomic: boolean,
  formula: string
): string {
  // Check for diatomic molecules
  if (isDiatomic && DIATOMIC_MOLECULES[formula.replace(/[₀-₉]/g, m => String.fromCharCode(m.charCodeAt(0) - 8272))]) {
    const diatomicKey = formula.replace(/[₀-₉]/g, m => String.fromCharCode(m.charCodeAt(0) - 8272));
    return DIATOMIC_MOLECULES[diatomicKey].name;
  }

  if (isIonic) {
    return generateIonicName(elementInfos);
  } else {
    return generateCovalentName(elementInfos);
  }
}

function generateIonicName(elementInfos: ElementInfo[]): string {
  const cations = elementInfos.filter(info => {
    const oxidationState = info.oxidationState || 0;
    return oxidationState > 0;
  });

  const anions = elementInfos.filter(info => {
    const oxidationState = info.oxidationState || 0;
    return oxidationState < 0;
  });

  if (cations.length === 0 || anions.length === 0) {
    return "Unknown Compound";
  }

  const cation = cations[0];
  const anion = anions[0];

  let cationName = cation.element.name;

  // Add roman numeral for transition metals with variable oxidation states
  if (isMetal(cation.element)) {
    const possibleStates = OXIDATION_STATES[cation.element.symbol];
    if (possibleStates && possibleStates.length > 1) {
      const oxidationState = cation.oxidationState || 0;
      cationName += ` (${toRomanNumeral(oxidationState)})`;
    }
  }

  // Anion name (add -ide suffix)
  let anionName = anion.element.name.toLowerCase();
  if (anionName.endsWith("ine")) {
    anionName = anionName.slice(0, -3) + "ide";
  } else if (anionName.endsWith("gen")) {
    anionName = anionName.slice(0, -3) + "ide";
  } else if (anionName.endsWith("ygen")) {
    anionName = anionName.slice(0, -4) + "ide";
  } else if (anionName.endsWith("ur")) {
    anionName = anionName.slice(0, -2) + "ide";
  } else if (anionName.endsWith("on")) {
    anionName = anionName.slice(0, -2) + "ide";
  } else if (anionName.endsWith("orus")) {
    anionName = anionName.slice(0, -4) + "ide";
  } else {
    anionName += "ide";
  }

  return `${cationName} ${anionName}`;
}

function generateCovalentName(elementInfos: ElementInfo[]): string {
  if (elementInfos.length < 2) return "Unknown Compound";

  // Sort by electronegativity (less electronegative first)
  const sorted = [...elementInfos].sort((a, b) => {
    const enA = getElectronegativity(a.element);
    const enB = getElectronegativity(b.element);
    return enA - enB;
  });

  const first = sorted[0];
  const second = sorted[1];

  let name = "";

  // First element - use prefix only if not mono
  if (first.count > 1) {
    name += ELEMENT_PREFIXES[first.count] + first.element.name.toLowerCase();
  } else {
    name += first.element.name;
  }

  name += " ";

  // Second element - always use prefix
  name += ELEMENT_PREFIXES[second.count] || "";

  // Add -ide suffix
  let secondName = second.element.name.toLowerCase();
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

// ============================================================================
// MAIN VALIDATION FUNCTION
// ============================================================================

export function validateCompound(
  canvasElements: Array<{ id: string; element: Element; symbol: string }>,
  bonds: Bond[]
): ValidationResult {
  // Count elements
  const elementCounts: Record<string, number> = {};
  const elementMap = new Map<string, Element>();

  // Only count bonded elements
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
      suggestions: ["Remove noble gas elements", "Noble gases have full valence shells and are chemically inert"],
    };
  }

  // Check for single element (not a compound)
  if (symbols.length === 1) {
    const symbol = symbols[0];
    const count = elementCounts[symbol];
    const element = elementMap.get(symbol)!;

    // Check if it's a valid diatomic molecule
    const formulaKey = symbol + count;
    if (count === 2 && DIATOMIC_MOLECULES[formulaKey]) {
      const diatomic = DIATOMIC_MOLECULES[formulaKey];
      return {
        isValid: true,
        compoundName: diatomic.name,
        formula: symbol + subscriptNumber(count),
        bondType: "covalent",
        status: "valid",
        explanation: `Valid diatomic molecule. ${element.name} naturally exists as ${formulaKey} with ${diatomic.bondType} bonds.`,
      };
    }

    return {
      isValid: false,
      compoundName: "",
      formula: symbol + (count > 1 ? subscriptNumber(count) : ""),
      bondType: "covalent",
      status: "invalid",
      explanation: `This is not a valid compound. ${element.name} alone does not form a stable compound with this structure.`,
      suggestions: count === 2 ? [
        `${symbol}₂ is not a naturally occurring molecule`,
        `Add different elements to create a compound`
      ] : [
        `Single atoms are not compounds`,
        `Add different elements to create a compound`
      ],
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

  // Calculate oxidation states
  const elementInfos: ElementInfo[] = symbols.map(symbol => {
    const element = elementMap.get(symbol)!;
    const count = elementCounts[symbol];

    // Get bonding partners
    const partners: Element[] = [];
    const elementIds = bondedElements.filter(el => el.symbol === symbol).map(el => el.id);

    bonds.forEach(bond => {
      if (elementIds.includes(bond.fromElementId)) {
        const partnerEl = bondedElements.find(el => el.id === bond.toElementId);
        if (partnerEl) partners.push(partnerEl.element);
      } else if (elementIds.includes(bond.toElementId)) {
        const partnerEl = bondedElements.find(el => el.id === bond.fromElementId);
        if (partnerEl) partners.push(partnerEl.element);
      }
    });

    const bondTypesWithElement = bonds
      .filter(bond => elementIds.includes(bond.fromElementId) || elementIds.includes(bond.toElementId))
      .map(bond => bond.bondType);

    const oxidationState = determineOxidationState(element, partners, bondTypesWithElement);

    return {
      element,
      count,
      oxidationState,
      charge: oxidationState * count,
    };
  });

  // Check charge neutrality for ionic compounds
  if (isIonic) {
    const totalCharge = elementInfos.reduce((sum, info) => sum + (info.charge || 0), 0);

    if (totalCharge !== 0) {
      const cations = elementInfos.filter(info => (info.oxidationState || 0) > 0);
      const anions = elementInfos.filter(info => (info.oxidationState || 0) < 0);

      if (cations.length > 0 && anions.length > 0) {
        const cation = cations[0];
        const anion = anions[0];
        const cationCharge = Math.abs(cation.oxidationState || 1);
        const anionCharge = Math.abs(anion.oxidationState || 1);

        // Calculate correct ratio
        const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
        const divisor = gcd(cationCharge, anionCharge);
        const correctCationCount = anionCharge / divisor;
        const correctAnionCount = cationCharge / divisor;

        return {
          isValid: false,
          compoundName: "",
          formula: generateFormula(elementCounts, isIonic, [cation.element.symbol], [anion.element.symbol]),
          bondType: "ionic",
          status: "invalid",
          explanation: `Charge not balanced. Total charge is ${totalCharge > 0 ? '+' : ''}${totalCharge}.`,
          suggestions: [
            `Correct ratio: ${cation.element.symbol}${correctCationCount > 1 ? subscriptNumber(correctCationCount) : ''}${anion.element.symbol}${correctAnionCount > 1 ? subscriptNumber(correctAnionCount) : ''}`,
            `${cation.element.name} has charge +${cationCharge}, ${anion.element.name} has charge -${anionCharge}`,
            `You need ${correctCationCount} ${cation.element.symbol} and ${correctAnionCount} ${anion.element.symbol} for charge neutrality`,
          ],
          details: {
            chargeBalance: `Total charge: ${totalCharge > 0 ? '+' : ''}${totalCharge}`,
            oxidationStates: Object.fromEntries(
              elementInfos.map(info => [info.element.symbol, info.oxidationState || 0])
            ),
          },
        };
      }
    }
  }

  // Generate formula
  const cations = elementInfos.filter(info => (info.oxidationState || 0) > 0).map(info => info.element.symbol);
  const anions = elementInfos.filter(info => (info.oxidationState || 0) < 0).map(info => info.element.symbol);
  const formula = generateFormula(elementCounts, isIonic, cations, anions);

  // Generate IUPAC name
  const isDiatomic = symbols.length === 1 && elementCounts[symbols[0]] === 2;
  const compoundName = generateIUPACName(elementInfos, isIonic, isDiatomic, formula);

  // Check for warnings (rare but valid compounds)
  const warnings: string[] = [];

  // SF₆ warning
  if (symbols.includes("S") && symbols.includes("F") && elementCounts["F"] === 6) {
    warnings.push("SF₆ is a rare but stable compound (hypervalent sulfur)");
  }

  // Peroxide warning
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
      oxidationStates: Object.fromEntries(
        elementInfos.map(info => [info.element.symbol, info.oxidationState || 0])
      ),
      bondingPattern: `${bonds.length} bond(s) between ${bondedElements.length} atom(s)`,
    },
  };
}
