// PHASE 9: Derived Property Calculations
// All properties are COMPUTED from carbon graph
// NO properties are stored - everything is derived

import {
  MoleculeGraph,
  AtomNode,
  Bond,
  OrganicElement,
  getNeighbors,
  getTotalBonds,
  findBond,
} from './organic-graph';

/**
 * Atomic weights (g/mol) for organic elements and hydrogen
 */
const ATOMIC_WEIGHTS: Record<OrganicElement | 'H', number> = {
  C: 12.011,
  H: 1.008,
  O: 15.999,
  N: 14.007,
  S: 32.065,
  P: 30.974,
  F: 18.998,
  Cl: 35.453,
  Br: 79.904,
  I: 126.904,
};

/**
 * Functional group detection patterns
 */
export type FunctionalGroupType =
  | 'alcohol'
  | 'carbonyl'
  | 'carboxylic-acid'
  | 'amine'
  | 'ester'
  | 'ether'
  | 'aldehyde'
  | 'ketone'
  | 'nitro'
  | 'alkyl-halide'
  | 'amide'
  | 'nitrile';

export interface DetectedFunctionalGroup {
  name: FunctionalGroupType;
  nodeIds: string[]; // atom nodes that form this group
  attachmentPoint: string; // primary carbon node where group attaches
}

/**
 * Compute Molecular Formula
 * Returns Hill notation: C, H, then alphabetical
 * Example: C3H8O (propanol)
 */
export function computeFormula(graph: MoleculeGraph): string {
  const elementCounts: Partial<Record<OrganicElement | 'H', number>> = {};

  // Count explicit atoms
  for (const node of graph.nodes) {
    elementCounts[node.element] = (elementCounts[node.element] || 0) + 1;
  }

  // Count implicit hydrogens
  let totalImplicitH = 0;
  for (const node of graph.nodes) {
    totalImplicitH += node.implicitHydrogens;
  }
  if (totalImplicitH > 0) {
    elementCounts['H'] = (elementCounts['H'] || 0) + totalImplicitH;
  }

  // Format in Hill notation
  const formula: string[] = [];

  // Carbon first
  if (elementCounts['C']) {
    formula.push('C');
    if (elementCounts['C'] > 1) {
      formula.push(subscriptNumber(elementCounts['C']));
    }
  }

  // Hydrogen second
  if (elementCounts['H']) {
    formula.push('H');
    if (elementCounts['H'] > 1) {
      formula.push(subscriptNumber(elementCounts['H']));
    }
  }

  // Other elements alphabetically
  const otherElements: (OrganicElement | 'H')[] = ['Br', 'Cl', 'F', 'I', 'N', 'O', 'P', 'S'];
  for (const element of otherElements) {
    if (element !== 'H' && elementCounts[element as OrganicElement]) {
      formula.push(element);
      const count = elementCounts[element as OrganicElement]!;
      if (count > 1) {
        formula.push(subscriptNumber(count));
      }
    }
  }

  return formula.join('');
}

/**
 * Convert number to subscript Unicode
 */
function subscriptNumber(n: number): string {
  const subscripts: Record<string, string> = {
    '0': '₀',
    '1': '₁',
    '2': '₂',
    '3': '₃',
    '4': '₄',
    '5': '₅',
    '6': '₆',
    '7': '₇',
    '8': '₈',
    '9': '₉',
  };
  return n
    .toString()
    .split('')
    .map((digit) => subscripts[digit] || digit)
    .join('');
}

/**
 * Compute Molecular Weight
 * Returns sum of atomic weights (explicit atoms + implicit H)
 */
export function computeMolecularWeight(graph: MoleculeGraph): number {
  let weight = 0;

  // Add explicit atoms
  for (const node of graph.nodes) {
    weight += ATOMIC_WEIGHTS[node.element];
  }

  // Add implicit hydrogens
  for (const node of graph.nodes) {
    weight += node.implicitHydrogens * ATOMIC_WEIGHTS.H;
  }

  return Math.round(weight * 1000) / 1000; // round to 3 decimal places
}

/**
 * Compute Unsaturation Degree
 * Formula: (2C + 2 + N - H - X) / 2
 * Where C = carbons, N = nitrogens, H = hydrogens, X = halogens
 * Represents: rings + double bonds + 2×triple bonds
 */
export function computeUnsaturationDegree(graph: MoleculeGraph): number {
  let carbonCount = 0;
  let nitrogenCount = 0;
  let hydrogenCount = 0;
  let halogenCount = 0;

  for (const node of graph.nodes) {
    switch (node.element) {
      case 'C':
        carbonCount++;
        break;
      case 'N':
        nitrogenCount++;
        break;
      case 'F':
      case 'Cl':
      case 'Br':
      case 'I':
        halogenCount++;
        break;
    }
    hydrogenCount += node.implicitHydrogens;
  }

  const degree = (2 * carbonCount + 2 + nitrogenCount - hydrogenCount - halogenCount) / 2;
  return Math.max(0, degree);
}

/**
 * Detect Functional Groups
 * Pattern-matches subgraphs to identify functional groups
 * Groups are DETECTED, not stored
 */
export function detectFunctionalGroups(graph: MoleculeGraph): DetectedFunctionalGroup[] {
  const groups: DetectedFunctionalGroup[] = [];

  for (const node of graph.nodes) {
    const neighbors = getNeighbors(node.id, graph.edges);
    const neighborNodes = neighbors
      .map((id) => graph.nodes.find((n) => n.id === id))
      .filter((n): n is AtomNode => n !== undefined);

    // Carboxylic Acid: C(=O)-O-H pattern
    if (node.element === 'C') {
      const oxygenNeighbors = neighborNodes.filter((n) => n.element === 'O');
      if (oxygenNeighbors.length >= 2) {
        let hasDoubleBondO = false;
        let hasSingleBondOH = false;
        const groupNodeIds = [node.id];

        for (const oxygen of oxygenNeighbors) {
          const bond = findBond(graph, node.id, oxygen.id);
          if (bond) {
            if (bond.bondOrder === 2) {
              hasDoubleBondO = true;
              groupNodeIds.push(oxygen.id);
            } else if (bond.bondOrder === 1 && oxygen.implicitHydrogens === 1) {
              hasSingleBondOH = true;
              groupNodeIds.push(oxygen.id);
            }
          }
        }

        if (hasDoubleBondO && hasSingleBondOH) {
          groups.push({
            name: 'carboxylic-acid',
            nodeIds: groupNodeIds,
            attachmentPoint: node.id,
          });
          continue; // Don't detect carbonyl or alcohol for this carbon
        }
      }
    }

    // Ester: C(=O)-O-C pattern
    if (node.element === 'C') {
      const oxygenNeighbors = neighborNodes.filter((n) => n.element === 'O');
      if (oxygenNeighbors.length >= 2) {
        let hasDoubleBondO = false;
        let hasSingleBondOC = false;
        const groupNodeIds = [node.id];

        for (const oxygen of oxygenNeighbors) {
          const bond = findBond(graph, node.id, oxygen.id);
          if (bond) {
            if (bond.bondOrder === 2) {
              hasDoubleBondO = true;
              groupNodeIds.push(oxygen.id);
            } else if (bond.bondOrder === 1 && oxygen.implicitHydrogens === 0) {
              // Check if oxygen is bonded to another carbon
              const oxygenNeighbors = getNeighbors(oxygen.id, graph.edges);
              if (oxygenNeighbors.length === 2) {
                hasSingleBondOC = true;
                groupNodeIds.push(oxygen.id);
              }
            }
          }
        }

        if (hasDoubleBondO && hasSingleBondOC) {
          groups.push({
            name: 'ester',
            nodeIds: groupNodeIds,
            attachmentPoint: node.id,
          });
          continue;
        }
      }
    }

    // Amide: C(=O)-N pattern
    if (node.element === 'C') {
      let hasCarbonyl = false;
      let hasAmine = false;
      const groupNodeIds = [node.id];

      for (const neighbor of neighborNodes) {
        const bond = findBond(graph, node.id, neighbor.id);
        if (bond) {
          if (neighbor.element === 'O' && bond.bondOrder === 2) {
            hasCarbonyl = true;
            groupNodeIds.push(neighbor.id);
          }
          if (neighbor.element === 'N' && bond.bondOrder === 1) {
            hasAmine = true;
            groupNodeIds.push(neighbor.id);
          }
        }
      }

      if (hasCarbonyl && hasAmine) {
        groups.push({
          name: 'amide',
          nodeIds: groupNodeIds,
          attachmentPoint: node.id,
        });
        continue;
      }
    }

    // Aldehyde: Terminal C=O pattern
    if (node.element === 'C') {
      const oxygenNeighbors = neighborNodes.filter((n) => n.element === 'O');
      for (const oxygen of oxygenNeighbors) {
        const bond = findBond(graph, node.id, oxygen.id);
        if (bond && bond.bondOrder === 2) {
          // Check if carbon is terminal or has only one other carbon neighbor
          const carbonNeighbors = neighborNodes.filter((n) => n.element === 'C');
          if (carbonNeighbors.length <= 1) {
            groups.push({
              name: 'aldehyde',
              nodeIds: [node.id, oxygen.id],
              attachmentPoint: node.id,
            });
            break;
          }
        }
      }
    }

    // Ketone: Internal C=O pattern
    if (node.element === 'C') {
      const oxygenNeighbors = neighborNodes.filter((n) => n.element === 'O');
      for (const oxygen of oxygenNeighbors) {
        const bond = findBond(graph, node.id, oxygen.id);
        if (bond && bond.bondOrder === 2) {
          // Check if carbon is internal (has 2+ carbon neighbors)
          const carbonNeighbors = neighborNodes.filter((n) => n.element === 'C');
          if (carbonNeighbors.length >= 2) {
            groups.push({
              name: 'ketone',
              nodeIds: [node.id, oxygen.id],
              attachmentPoint: node.id,
            });
            break;
          }
        }
      }
    }

    // Carbonyl (generic): C=O pattern (if not already classified)
    if (node.element === 'C') {
      const oxygenNeighbors = neighborNodes.filter((n) => n.element === 'O');
      const alreadyClassified = groups.some((g) => g.nodeIds.includes(node.id));
      if (!alreadyClassified) {
        for (const oxygen of oxygenNeighbors) {
          const bond = findBond(graph, node.id, oxygen.id);
          if (bond && bond.bondOrder === 2) {
            groups.push({
              name: 'carbonyl',
              nodeIds: [node.id, oxygen.id],
              attachmentPoint: node.id,
            });
            break;
          }
        }
      }
    }

    // Alcohol: C-O-H pattern
    if (node.element === 'C') {
      const oxygenNeighbors = neighborNodes.filter((n) => n.element === 'O');
      for (const oxygen of oxygenNeighbors) {
        const bond = findBond(graph, node.id, oxygen.id);
        if (bond && bond.bondOrder === 1 && oxygen.implicitHydrogens === 1) {
          const alreadyClassified = groups.some((g) => g.nodeIds.includes(oxygen.id));
          if (!alreadyClassified) {
            groups.push({
              name: 'alcohol',
              nodeIds: [node.id, oxygen.id],
              attachmentPoint: node.id,
            });
          }
        }
      }
    }

    // Ether: C-O-C pattern
    if (node.element === 'O' && node.implicitHydrogens === 0) {
      const carbonNeighbors = neighborNodes.filter((n) => n.element === 'C');
      if (carbonNeighbors.length === 2) {
        const alreadyClassified = groups.some((g) => g.nodeIds.includes(node.id));
        if (!alreadyClassified) {
          groups.push({
            name: 'ether',
            nodeIds: [carbonNeighbors[0].id, node.id, carbonNeighbors[1].id],
            attachmentPoint: carbonNeighbors[0].id,
          });
        }
      }
    }

    // Amine: C-N pattern with implicit H on N
    if (node.element === 'C') {
      const nitrogenNeighbors = neighborNodes.filter((n) => n.element === 'N');
      for (const nitrogen of nitrogenNeighbors) {
        const bond = findBond(graph, node.id, nitrogen.id);
        if (bond && bond.bondOrder === 1 && nitrogen.implicitHydrogens > 0) {
          const alreadyClassified = groups.some((g) => g.nodeIds.includes(nitrogen.id));
          if (!alreadyClassified) {
            groups.push({
              name: 'amine',
              nodeIds: [node.id, nitrogen.id],
              attachmentPoint: node.id,
            });
          }
        }
      }
    }

    // Nitrile: C≡N pattern
    if (node.element === 'C') {
      const nitrogenNeighbors = neighborNodes.filter((n) => n.element === 'N');
      for (const nitrogen of nitrogenNeighbors) {
        const bond = findBond(graph, node.id, nitrogen.id);
        if (bond && bond.bondOrder === 3) {
          groups.push({
            name: 'nitrile',
            nodeIds: [node.id, nitrogen.id],
            attachmentPoint: node.id,
          });
        }
      }
    }

    // Nitro: N bonded to 2 oxygens pattern
    if (node.element === 'N') {
      const oxygenNeighbors = neighborNodes.filter((n) => n.element === 'O');
      if (oxygenNeighbors.length === 2) {
        const carbonNeighbors = neighborNodes.filter((n) => n.element === 'C');
        if (carbonNeighbors.length === 1) {
          groups.push({
            name: 'nitro',
            nodeIds: [carbonNeighbors[0].id, node.id, ...oxygenNeighbors.map((n) => n.id)],
            attachmentPoint: carbonNeighbors[0].id,
          });
        }
      }
    }

    // Alkyl Halide: C-X pattern (X = F, Cl, Br, I)
    if (node.element === 'C') {
      const halogenNeighbors = neighborNodes.filter((n) =>
        ['F', 'Cl', 'Br', 'I'].includes(n.element)
      );
      for (const halogen of halogenNeighbors) {
        groups.push({
          name: 'alkyl-halide',
          nodeIds: [node.id, halogen.id],
          attachmentPoint: node.id,
        });
      }
    }
  }

  return groups;
}

/**
 * Count total atoms (explicit + implicit H)
 */
export function countTotalAtoms(graph: MoleculeGraph): number {
  let count = graph.nodes.length; // explicit atoms

  // Add implicit hydrogens
  for (const node of graph.nodes) {
    count += node.implicitHydrogens;
  }

  return count;
}

/**
 * Count carbon atoms
 */
export function countCarbonAtoms(graph: MoleculeGraph): number {
  return graph.nodes.filter((n) => n.element === 'C').length;
}

/**
 * Get derived properties (all computed from graph)
 */
export interface DerivedProperties {
  molecularFormula: string;
  molecularWeight: number;
  totalAtoms: number;
  carbonCount: number;
  unsaturationDegree: number;
  functionalGroups: DetectedFunctionalGroup[];
}

export function getDerivedProperties(graph: MoleculeGraph): DerivedProperties {
  return {
    molecularFormula: computeFormula(graph),
    molecularWeight: computeMolecularWeight(graph),
    totalAtoms: countTotalAtoms(graph),
    carbonCount: countCarbonAtoms(graph),
    unsaturationDegree: computeUnsaturationDegree(graph),
    functionalGroups: detectFunctionalGroups(graph),
  };
}

/**
 * Validation summary
 */
export interface ValidationSummary {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Comprehensive validation
 * Includes valency checking and chemical plausibility
 */
export function validateMolecule(graph: MoleculeGraph): ValidationSummary {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check valency (from organic-graph.ts)
  const valenceValidation = require('./organic-graph').validateValence(graph);
  errors.push(...valenceValidation.errors);
  warnings.push(...valenceValidation.warnings);

  // Check for isolated fragments (disconnected components)
  if (graph.nodes.length > 1) {
    const visited = new Set<string>();
    const startNode = graph.nodes[0];

    const dfs = (nodeId: string) => {
      visited.add(nodeId);
      const neighbors = getNeighbors(nodeId, graph.edges);
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          dfs(neighbor);
        }
      }
    };

    dfs(startNode.id);

    if (visited.size !== graph.nodes.length) {
      errors.push('Molecule has isolated fragments (disconnected components)');
    }
  }

  // Check for unusual bond angles in small rings
  const rings = detectRings(graph);
  for (const ring of rings) {
    if (ring.length === 3) {
      warnings.push('Cyclopropane detected - high ring strain');
    } else if (ring.length === 4) {
      warnings.push('Cyclobutane detected - significant ring strain');
    } else if (ring.length > 8) {
      warnings.push(`Large ring detected (${ring.length} atoms) - may be strained`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Detect rings (cycles) in the molecular graph
 * Returns array of ring node IDs
 */
function detectRings(graph: MoleculeGraph): string[][] {
  const rings: string[][] = [];
  const visited = new Set<string>();

  for (const startNode of graph.nodes) {
    if (visited.has(startNode.id)) continue;

    const path: string[] = [];
    const pathSet = new Set<string>();

    const dfs = (nodeId: string, parent: string | null) => {
      if (pathSet.has(nodeId)) {
        // Found a cycle
        const cycleStart = path.indexOf(nodeId);
        const ring = path.slice(cycleStart);
        rings.push(ring);
        return;
      }

      path.push(nodeId);
      pathSet.add(nodeId);
      visited.add(nodeId);

      const neighbors = getNeighbors(nodeId, graph.edges);
      for (const neighbor of neighbors) {
        if (neighbor !== parent) {
          dfs(neighbor, nodeId);
        }
      }

      path.pop();
      pathSet.delete(nodeId);
    };

    dfs(startNode.id, null);
  }

  return rings;
}

/**
 * Export IUPAC naming function
 */
export { computeIUPACName } from './organic-iupac';
