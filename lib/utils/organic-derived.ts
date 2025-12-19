// PHASE 9: Derived Property Calculations (Extended)
// Additional derived properties and export hub
// All properties are COMPUTED from carbon graph, never stored

import {
  MoleculeGraph,
  AtomNode,
  Bond,
  OrganicElement,
  getNeighbors,
  getTotalBonds,
} from './organic-graph';

import {
  computeFormula,
  computeMolecularWeight,
  computeUnsaturationDegree,
  detectFunctionalGroups,
  countTotalAtoms,
  countCarbonAtoms,
  getDerivedProperties,
  validateMolecule,
  DerivedProperties,
  ValidationSummary,
  DetectedFunctionalGroup,
} from './organic-validation';

// Re-export validation functions
export {
  computeFormula,
  computeMolecularWeight,
  computeUnsaturationDegree,
  detectFunctionalGroups,
  countTotalAtoms,
  countCarbonAtoms,
  getDerivedProperties,
  validateMolecule,
};

export type { DerivedProperties, ValidationSummary, DetectedFunctionalGroup };

/**
 * Generate SMILES string (simplified version)
 * SMILES = Simplified Molecular Input Line Entry System
 * Note: This is a basic implementation. For production, use RDKit.js
 */
export function generateSMILES(graph: MoleculeGraph): string | null {
  if (graph.nodes.length === 0) return null;

  // This is a placeholder for SMILES generation
  // Full implementation requires traversal algorithm with:
  // - Depth-first traversal
  // - Ring closure notation
  // - Branching notation
  // - Bond order notation
  // - Stereochemistry notation

  // For now, return null (to be implemented with RDKit.js)
  return null;
}

/**
 * Calculate molecular symmetry
 * Returns symmetry point group (C1, C2, C3, Ci, Cs, etc.)
 */
export function calculateSymmetry(graph: MoleculeGraph): string {
  // Simplified symmetry detection
  // Full implementation requires graph automorphism detection

  // Check for obvious asymmetry
  const functionalGroups = detectFunctionalGroups(graph);
  if (functionalGroups.length > 0) {
    return 'C1'; // asymmetric (most organic molecules)
  }

  // Check for linear molecules
  if (graph.nodes.length <= 2) {
    return 'D∞h'; // linear symmetry
  }

  // Default to asymmetric
  return 'C1';
}

/**
 * Calculate dipole moment indicator
 * Returns 'polar' or 'nonpolar' based on functional groups and symmetry
 */
export function calculatePolarity(graph: MoleculeGraph): 'polar' | 'nonpolar' {
  const functionalGroups = detectFunctionalGroups(graph);

  // Check for polar functional groups
  const polarGroups = [
    'alcohol',
    'carboxylic-acid',
    'carbonyl',
    'amine',
    'amide',
    'ester',
    'ether',
    'nitro',
  ];

  const hasPolarGroup = functionalGroups.some((g) => polarGroups.includes(g.name));

  if (hasPolarGroup) {
    return 'polar';
  }

  // Check for heteroatoms (O, N, S, P)
  const hasHeteroatom = graph.nodes.some((n) => ['O', 'N', 'S', 'P'].includes(n.element));
  if (hasHeteroatom) {
    return 'polar';
  }

  return 'nonpolar';
}

/**
 * Calculate hydrogen bond donor count
 * Counts -OH and -NH groups (groups that can donate H-bonds)
 */
export function countHydrogenBondDonors(graph: MoleculeGraph): number {
  let count = 0;

  for (const node of graph.nodes) {
    // Oxygen with at least 1 implicit H (alcohol, carboxylic acid)
    if (node.element === 'O' && node.implicitHydrogens > 0) {
      count++;
    }

    // Nitrogen with at least 1 implicit H (amine, amide)
    if (node.element === 'N' && node.implicitHydrogens > 0) {
      count++;
    }
  }

  return count;
}

/**
 * Calculate hydrogen bond acceptor count
 * Counts O and N atoms (groups that can accept H-bonds)
 */
export function countHydrogenBondAcceptors(graph: MoleculeGraph): number {
  let count = 0;

  for (const node of graph.nodes) {
    // Any oxygen can accept H-bonds
    if (node.element === 'O') {
      count++;
    }

    // Nitrogen with lone pair can accept H-bonds
    if (node.element === 'N') {
      const totalBonds = getTotalBonds(node.id, graph.edges);
      if (totalBonds < 4) {
        // has lone pair
        count++;
      }
    }
  }

  return count;
}

/**
 * Calculate rotatable bond count
 * Counts single bonds between non-terminal atoms (excluding rings)
 */
export function countRotatableBonds(graph: MoleculeGraph): number {
  let count = 0;

  for (const bond of graph.edges) {
    // Only single bonds are rotatable
    if (bond.bondOrder !== 1) continue;

    // Skip aromatic bonds
    if (bond.bondType === 'aromatic') continue;

    const fromNode = graph.nodes.find((n) => n.id === bond.from);
    const toNode = graph.nodes.find((n) => n.id === bond.to);

    if (!fromNode || !toNode) continue;

    // Skip terminal bonds (either end is terminal)
    const fromNeighbors = getNeighbors(bond.from, graph.edges);
    const toNeighbors = getNeighbors(bond.to, graph.edges);

    if (fromNeighbors.length <= 1 || toNeighbors.length <= 1) continue;

    count++;
  }

  return count;
}

/**
 * Calculate topological polar surface area (TPSA) estimate
 * Simplified calculation based on polar atoms
 */
export function estimateTPSA(graph: MoleculeGraph): number {
  let tpsa = 0;

  // Approximate surface area contributions (Å²)
  const surfaceAreaContributions: Record<string, number> = {
    'O-single': 20.23, // hydroxyl oxygen
    'O-double': 17.07, // carbonyl oxygen
    'N-amine': 26.02, // amine nitrogen
    'N-amide': 29.1, // amide nitrogen
  };

  for (const node of graph.nodes) {
    if (node.element === 'O') {
      const totalBonds = getTotalBonds(node.id, graph.edges);
      const hasDoubleBond = graph.edges.some(
        (e) =>
          (e.from === node.id || e.to === node.id) &&
          e.bondOrder === 2
      );

      if (hasDoubleBond) {
        tpsa += surfaceAreaContributions['O-double'];
      } else {
        tpsa += surfaceAreaContributions['O-single'];
      }
    }

    if (node.element === 'N') {
      // Check if part of amide group
      const neighbors = getNeighbors(node.id, graph.edges);
      const neighborNodes = neighbors
        .map((id) => graph.nodes.find((n) => n.id === id))
        .filter((n): n is AtomNode => n !== undefined);

      const hasAmideCarbon = neighborNodes.some((n) => {
        if (n.element !== 'C') return false;
        const carbonNeighbors = getNeighbors(n.id, graph.edges)
          .map((id) => graph.nodes.find((node) => node.id === id))
          .filter((node): node is AtomNode => node !== undefined);
        return carbonNeighbors.some((cn) => cn.element === 'O');
      });

      if (hasAmideCarbon) {
        tpsa += surfaceAreaContributions['N-amide'];
      } else {
        tpsa += surfaceAreaContributions['N-amine'];
      }
    }
  }

  return Math.round(tpsa * 100) / 100;
}

/**
 * Calculate Lipinski's Rule of Five parameters
 * Used to estimate drug-likeness
 */
export interface LipinskiParameters {
  molecularWeight: number;
  logP: number | null; // partition coefficient (requires complex calculation)
  hydrogenBondDonors: number;
  hydrogenBondAcceptors: number;
  passesRuleOfFive: boolean;
}

export function calculateLipinskiParameters(graph: MoleculeGraph): LipinskiParameters {
  const molecularWeight = computeMolecularWeight(graph);
  const hbDonors = countHydrogenBondDonors(graph);
  const hbAcceptors = countHydrogenBondAcceptors(graph);

  // LogP calculation is complex and requires fragment contributions
  // Return null for now (would need RDKit.js or similar)
  const logP = null;

  // Rule of Five criteria:
  // - Molecular weight ≤ 500 Da
  // - LogP ≤ 5
  // - Hydrogen bond donors ≤ 5
  // - Hydrogen bond acceptors ≤ 10
  const passesRuleOfFive =
    molecularWeight <= 500 &&
    hbDonors <= 5 &&
    hbAcceptors <= 10;
  // LogP check omitted since we can't calculate it

  return {
    molecularWeight,
    logP,
    hydrogenBondDonors: hbDonors,
    hydrogenBondAcceptors: hbAcceptors,
    passesRuleOfFive,
  };
}

/**
 * Get extended derived properties
 * Includes all basic properties plus advanced calculations
 */
export interface ExtendedDerivedProperties extends DerivedProperties {
  smiles: string | null;
  symmetry: string;
  polarity: 'polar' | 'nonpolar';
  hydrogenBondDonors: number;
  hydrogenBondAcceptors: number;
  rotatableBonds: number;
  tpsa: number;
  lipinski: LipinskiParameters;
}

export function getExtendedDerivedProperties(graph: MoleculeGraph): ExtendedDerivedProperties {
  const baseProperties = getDerivedProperties(graph);

  return {
    ...baseProperties,
    smiles: generateSMILES(graph),
    symmetry: calculateSymmetry(graph),
    polarity: calculatePolarity(graph),
    hydrogenBondDonors: countHydrogenBondDonors(graph),
    hydrogenBondAcceptors: countHydrogenBondAcceptors(graph),
    rotatableBonds: countRotatableBonds(graph),
    tpsa: estimateTPSA(graph),
    lipinski: calculateLipinskiParameters(graph),
  };
}

/**
 * Compare two molecular graphs for equality
 * Checks if graphs represent the same molecule (isomorphism)
 */
export function areGraphsEqual(graphA: MoleculeGraph, graphB: MoleculeGraph): boolean {
  // Simple comparison based on derived properties
  // Full implementation would require graph isomorphism checking

  if (graphA.nodes.length !== graphB.nodes.length) return false;
  if (graphA.edges.length !== graphB.edges.length) return false;

  const formulaA = computeFormula(graphA);
  const formulaB = computeFormula(graphB);

  if (formulaA !== formulaB) return false;

  // If formulas match and node/edge counts match, likely the same molecule
  // (This is not foolproof - stereoisomers would match)
  return true;
}

/**
 * Calculate structural complexity score
 * Higher score = more complex molecule
 */
export function calculateComplexityScore(graph: MoleculeGraph): number {
  let score = 0;

  // Base score from atom count
  score += graph.nodes.length;

  // Add points for heteroatoms (non-carbon atoms)
  const heteroatoms = graph.nodes.filter((n) => n.element !== 'C');
  score += heteroatoms.length * 2;

  // Add points for unsaturation
  const unsaturation = computeUnsaturationDegree(graph);
  score += unsaturation * 3;

  // Add points for functional groups
  const functionalGroups = detectFunctionalGroups(graph);
  score += functionalGroups.length * 5;

  // Add points for branching
  const branchedCarbons = graph.nodes.filter((n) => {
    if (n.element !== 'C') return false;
    const neighbors = getNeighbors(n.id, graph.edges);
    return neighbors.length > 2;
  });
  score += branchedCarbons.length * 3;

  // Add points for rings
  const rings = detectRingsSimple(graph);
  score += rings * 4;

  return score;
}

/**
 * Simple ring detection (counts cycles)
 */
function detectRingsSimple(graph: MoleculeGraph): number {
  // Approximate ring count using: rings = edges - nodes + 1
  // This works for connected graphs
  if (graph.nodes.length === 0) return 0;

  const cycleCount = graph.edges.length - graph.nodes.length + 1;
  return Math.max(0, cycleCount);
}

/**
 * Get molecule classification
 * Returns general category of organic molecule
 */
export function classifyMolecule(graph: MoleculeGraph): string[] {
  const classifications: string[] = [];
  const functionalGroups = detectFunctionalGroups(graph);
  const unsaturation = computeUnsaturationDegree(graph);
  const carbonCount = countCarbonAtoms(graph);

  // Hydrocarbon classification
  const heteroatoms = graph.nodes.filter((n) => n.element !== 'C').length;
  if (heteroatoms === 0) {
    if (unsaturation === 0) {
      classifications.push('alkane');
    } else if (graph.edges.some((e) => e.bondOrder === 2)) {
      classifications.push('alkene');
    } else if (graph.edges.some((e) => e.bondOrder === 3)) {
      classifications.push('alkyne');
    }
  }

  // Aromatic
  if (graph.edges.some((e) => e.bondType === 'aromatic')) {
    classifications.push('aromatic');
  }

  // Functional group classifications
  if (functionalGroups.some((g) => g.name === 'alcohol')) {
    classifications.push('alcohol');
  }
  if (functionalGroups.some((g) => g.name === 'carboxylic-acid')) {
    classifications.push('carboxylic-acid');
  }
  if (functionalGroups.some((g) => g.name === 'ester')) {
    classifications.push('ester');
  }
  if (functionalGroups.some((g) => g.name === 'amine')) {
    classifications.push('amine');
  }
  if (functionalGroups.some((g) => g.name === 'aldehyde')) {
    classifications.push('aldehyde');
  }
  if (functionalGroups.some((g) => g.name === 'ketone')) {
    classifications.push('ketone');
  }
  if (functionalGroups.some((g) => g.name === 'ether')) {
    classifications.push('ether');
  }
  if (functionalGroups.some((g) => g.name === 'amide')) {
    classifications.push('amide');
  }
  if (functionalGroups.some((g) => g.name === 'nitro')) {
    classifications.push('nitro-compound');
  }
  if (functionalGroups.some((g) => g.name === 'alkyl-halide')) {
    classifications.push('alkyl-halide');
  }

  // Size classification
  if (carbonCount <= 4) {
    classifications.push('small-molecule');
  } else if (carbonCount <= 12) {
    classifications.push('medium-molecule');
  } else {
    classifications.push('large-molecule');
  }

  return classifications;
}
