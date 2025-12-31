/**
 * SMILES Generation for Organic Molecules
 * SMILES = Simplified Molecular Input Line Entry System
 *
 * This is a basic implementation that handles common organic structures.
 * For production use with complex molecules, consider using RDKit.js:
 * https://github.com/rdkit/rdkit-js
 */

import { MoleculeGraph, AtomNode, Bond } from './organic-graph';

/**
 * Generate SMILES notation from molecular graph
 *
 * Supports:
 * - Linear chains and branches
 * - Single, double, triple bonds
 * - Aromatic rings (benzene)
 * - Common heteroatoms (O, N, S, P, halogens)
 * - Ring closures
 *
 * Limitations:
 * - Stereochemistry not fully supported
 * - Complex ring systems may not be canonical
 * - For advanced features, use RDKit.js
 */
export function generateSMILES(graph: MoleculeGraph): string {
  if (!graph.nodes || graph.nodes.length === 0) {
    return '';
  }

  // Single atom case
  if (graph.nodes.length === 1) {
    return formatAtomSymbol(graph.nodes[0], graph.edges);
  }

  // Start from a good starting node (prefer carbon with single bond)
  const startNode = findStartingNode(graph);

  const visited = new Set<string>();
  const ringClosures = new Map<string, number>();
  let ringCounter = 1;

  /**
   * Depth-first traversal to build SMILES string
   */
  function traverse(nodeId: string, parentNodeId: string | null = null): string {
    if (visited.has(nodeId)) {
      // Ring closure - use number notation
      const existingRing = ringClosures.get(nodeId);
      if (existingRing !== undefined) {
        return existingRing.toString();
      }

      // New ring closure
      const ringNum = ringCounter++;
      ringClosures.set(nodeId, ringNum);
      return ringNum.toString();
    }

    visited.add(nodeId);

    const node = graph.nodes.find(n => n.id === nodeId);
    if (!node) return '';

    let smiles = '';

    // Add atom symbol
    const atomSymbol = formatAtomSymbol(node, graph.edges);
    smiles += atomSymbol;

    // Check if this node has a ring closure number already assigned
    if (ringClosures.has(nodeId)) {
      smiles += ringClosures.get(nodeId);
    }

    // Get all bonds from this node
    const bonds = graph.edges.filter(e =>
      (e.from === nodeId || e.to === nodeId)
    );

    // Separate bonds into: to parent, and to children
    const childBonds = bonds.filter(bond => {
      const neighborId = bond.from === nodeId ? bond.to : bond.from;
      return neighborId !== parentNodeId;
    });

    // Process first child inline (no branch)
    if (childBonds.length > 0) {
      const firstBond = childBonds[0];
      const firstNeighborId = firstBond.from === nodeId ? firstBond.to : firstBond.from;

      // Add bond notation if needed
      const bondNotation = getBondNotation(firstBond);
      smiles += bondNotation;

      // Traverse to first child
      smiles += traverse(firstNeighborId, nodeId);

      // Process remaining children as branches
      for (let i = 1; i < childBonds.length; i++) {
        const bond = childBonds[i];
        const neighborId = bond.from === nodeId ? bond.to : bond.from;

        // Check if it's a ring closure
        if (visited.has(neighborId)) {
          const bondNotation = getBondNotation(bond);
          const existingRing = ringClosures.get(neighborId);

          if (existingRing !== undefined) {
            smiles += bondNotation + existingRing;
          } else {
            const ringNum = ringCounter++;
            ringClosures.set(neighborId, ringNum);
            smiles += bondNotation + ringNum;
          }
        } else {
          // Branch notation
          const bondNotation = getBondNotation(bond);
          smiles += '(' + bondNotation + traverse(neighborId, nodeId) + ')';
        }
      }
    }

    return smiles;
  }

  return traverse(startNode.id);
}

/**
 * Format atom symbol for SMILES
 * Handles implicit hydrogens and brackets when needed
 */
function formatAtomSymbol(node: AtomNode, edges: Bond[]): string {
  const element = node.element;

  // Check if aromatic
  const isAromatic = edges.some(e =>
    (e.from === node.id || e.to === node.id) && e.bondType === 'aromatic'
  );

  // Organic subset elements (B, C, N, O, P, S, F, Cl, Br, I) can be written without brackets
  const organicSubset = ['B', 'C', 'N', 'O', 'P', 'S', 'F', 'Cl', 'Br', 'I'];

  if (organicSubset.includes(element)) {
    // Aromatic atoms use lowercase
    if (isAromatic) {
      return element.toLowerCase();
    }

    // Carbon can be implicit in many cases, but we'll be explicit
    return element;
  }

  // Non-organic subset requires brackets
  return `[${element}]`;
}

/**
 * Get bond notation for SMILES
 * Single bonds are implicit (empty string)
 */
function getBondNotation(bond: Bond): string {
  // Aromatic bonds are implicit (lowercase atoms indicate aromaticity)
  if (bond.bondType === 'aromatic') {
    return '';
  }

  // Single bonds are implicit
  if (bond.bondOrder === 1) {
    return '';
  }

  // Double bond
  if (bond.bondOrder === 2) {
    return '=';
  }

  // Triple bond
  if (bond.bondOrder === 3) {
    return '#';
  }

  return '';
}

/**
 * Find the best starting node for SMILES generation
 * Prefers terminal carbons or leftmost carbon
 */
function findStartingNode(graph: MoleculeGraph): AtomNode {
  // Count bonds for each node
  const bondCounts = new Map<string, number>();

  for (const node of graph.nodes) {
    const bonds = graph.edges.filter(e => e.from === node.id || e.to === node.id);
    bondCounts.set(node.id, bonds.length);
  }

  // Prefer terminal nodes (only 1 bond)
  const terminalNodes = graph.nodes.filter(node => bondCounts.get(node.id) === 1);
  if (terminalNodes.length > 0) {
    // Prefer terminal carbon
    const terminalCarbon = terminalNodes.find(n => n.element === 'C');
    if (terminalCarbon) return terminalCarbon;
    return terminalNodes[0];
  }

  // Otherwise, start with first carbon
  const carbonNode = graph.nodes.find(n => n.element === 'C');
  if (carbonNode) return carbonNode;

  // Last resort: first node
  return graph.nodes[0];
}

/**
 * Validate SMILES string (basic check)
 */
export function isValidSMILES(smiles: string): boolean {
  if (!smiles || smiles.trim().length === 0) return false;

  // Valid SMILES characters
  const validPattern = /^[A-Za-z0-9()\[\]=#@+\-\\/%.]+$/;
  return validPattern.test(smiles);
}

/**
 * Get a simple SMILES string for common molecules by formula
 * Fallback when graph traversal fails
 */
export function getSMILESByFormula(formula: string): string {
  const commonMolecules: Record<string, string> = {
    'CH4': 'C',
    'C2H6': 'CC',
    'C3H8': 'CCC',
    'C4H10': 'CCCC',
    'C6H6': 'c1ccccc1', // Benzene
    'CH3OH': 'CO', // Methanol
    'C2H5OH': 'CCO', // Ethanol
    'CH2O': 'C=O', // Formaldehyde
    'C2H4O2': 'CC(=O)O', // Acetic acid
    'C7H8': 'Cc1ccccc1', // Toluene
  };

  return commonMolecules[formula] || 'C';
}

/**
 * Generate canonical SMILES (simplified version)
 * Note: True canonicalization requires complex graph algorithms
 * For production, use RDKit.js which provides canonical SMILES
 */
export function generateCanonicalSMILES(graph: MoleculeGraph): string {
  // For now, just return regular SMILES
  // TODO: Implement proper canonicalization algorithm or use RDKit.js
  return generateSMILES(graph);
}
