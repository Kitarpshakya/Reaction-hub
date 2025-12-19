// PHASE 1: Graph Core

export type OrganicElement = 'C' | 'O' | 'N' | 'S' | 'P' | 'F' | 'Cl' | 'Br' | 'I';
export type Hybridization = 'sp' | 'sp2' | 'sp3';
export type BondOrder = 1 | 2 | 3;
export type BondType = 'sigma' | 'pi-system' | 'aromatic';

export interface AtomNode {
  id: string;
  element: OrganicElement;
  position: { x: number; y: number };
  implicitHydrogens: number;
  hybridization: Hybridization;
}

export interface Bond {
  id: string;
  from: string;
  to: string;
  bondOrder: BondOrder;
  bondType: BondType;
  stereo?: 'wedge' | 'dash' | 'wavy';
}

export interface MoleculeGraph {
  nodes: AtomNode[];
  edges: Bond[];
}

const VALENCY_MAP: Record<OrganicElement, number> = {
  C: 4, O: 2, N: 5, S: 2, P: 3, F: 1, Cl: 1, Br: 1, I: 1,
};

export function getMaxValency(element: OrganicElement): number {
  return VALENCY_MAP[element];
}

export function getTotalBonds(nodeId: string, edges: Bond[]): number {
  return edges.filter(e => e.from === nodeId || e.to === nodeId).reduce((sum, e) => sum + e.bondOrder, 0);
}

export function calculateImplicitHydrogens(node: AtomNode, edges: Bond[]): number {
  return Math.max(0, getMaxValency(node.element) - getTotalBonds(node.id, edges));
}

export function updateImplicitHydrogens(graph: MoleculeGraph): MoleculeGraph {
  return { ...graph, nodes: graph.nodes.map(node => ({ ...node, implicitHydrogens: calculateImplicitHydrogens(node, graph.edges) })) };
}

export function calculateHybridization(nodeId: string, edges: Bond[]): Hybridization {
  const nodeBonds = edges.filter(e => e.from === nodeId || e.to === nodeId);
  if (nodeBonds.some(b => b.bondOrder === 3)) return 'sp';
  if (nodeBonds.some(b => b.bondOrder === 2 || b.bondType === 'aromatic')) return 'sp2';
  return 'sp3';
}

export function updateHybridization(graph: MoleculeGraph): MoleculeGraph {
  return { ...graph, nodes: graph.nodes.map(node => ({ ...node, hybridization: calculateHybridization(node.id, graph.edges) })) };
}

export function addCarbon(graph: MoleculeGraph, position: { x: number; y: number }): MoleculeGraph {
  const id = 'C' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  return { nodes: [...graph.nodes, { id, element: 'C' as const, position, implicitHydrogens: 4, hybridization: 'sp3' as const }], edges: graph.edges };
}

export function removeCarbon(graph: MoleculeGraph, nodeId: string): MoleculeGraph {
  return { nodes: graph.nodes.filter(n => n.id !== nodeId), edges: graph.edges.filter(e => e.from !== nodeId && e.to !== nodeId) };
}

export function addBond(graph: MoleculeGraph, fromId: string, toId: string, bondOrder: BondOrder, bondType: BondType = 'sigma'): MoleculeGraph {
  const id = 'B' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  return { nodes: graph.nodes, edges: [...graph.edges, { id, from: fromId, to: toId, bondOrder, bondType }] };
}

export function removeBond(graph: MoleculeGraph, fromId: string, toId: string): MoleculeGraph {
  return { nodes: graph.nodes, edges: graph.edges.filter(e => !((e.from === fromId && e.to === toId) || (e.from === toId && e.to === fromId))) };
}

export function validateValence(graph: MoleculeGraph): { isValid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [], warnings: string[] = [];

  // Count element occurrences for better error messages
  const elementCounts = new Map<string, number>();
  const elementIndices = new Map<string, number>();

  for (const node of graph.nodes) {
    const count = (elementCounts.get(node.element) || 0) + 1;
    elementCounts.set(node.element, count);
  }

  for (const node of graph.nodes) {
    const max = getMaxValency(node.element);
    const total = getTotalBonds(node.id, graph.edges);

    // Create user-friendly element identifier
    const elementCount = elementCounts.get(node.element) || 1;
    let elementLabel = node.element;

    if (elementCount > 1) {
      // Multiple of same element - add index
      const currentIndex = (elementIndices.get(node.element) || 0) + 1;
      elementIndices.set(node.element, currentIndex);
      elementLabel = `${node.element} atom #${currentIndex}`;
    } else {
      // Only one of this element
      const elementNames: Record<string, string> = {
        'C': 'Carbon', 'O': 'Oxygen', 'N': 'Nitrogen', 'S': 'Sulfur',
        'P': 'Phosphorus', 'F': 'Fluorine', 'Cl': 'Chlorine',
        'Br': 'Bromine', 'I': 'Iodine'
      };
      elementLabel = elementNames[node.element] || node.element;
    }

    if (total > max) {
      errors.push(`${elementLabel} has too many bonds (${total} bonds, maximum ${max})`);
    }

    if (node.element === 'N' && total > 3 && total <= 5) {
      warnings.push(`${elementLabel} has ${total} bonds (expanded valence, likely N⁺)`);
    }

    if (node.element === 'S' && total > 2 && total <= 6) {
      warnings.push(`${elementLabel} has ${total} bonds (expanded valence)`);
    }

    if (node.element === 'P' && total > 3 && total <= 5) {
      warnings.push(`${elementLabel} has ${total} bonds (expanded valence)`);
    }
  }

  return { isValid: errors.length === 0, errors, warnings };
}

export function getNeighbors(nodeId: string, edges: Bond[]): string[] {
  const n: string[] = [];
  edges.forEach(e => { if (e.from === nodeId) n.push(e.to); if (e.to === nodeId) n.push(e.from); });
  return n;
}

export function isTerminalNode(nodeId: string, edges: Bond[]): boolean {
  return getNeighbors(nodeId, edges).length <= 1;
}

export function findBond(graph: MoleculeGraph, fromId: string, toId: string): Bond | undefined {
  return graph.edges.find(e => (e.from === fromId && e.to === toId) || (e.from === toId && e.to === fromId));
}

export function getCarbonNodes(graph: MoleculeGraph): AtomNode[] {
  return graph.nodes.filter(n => n.element === 'C');
}

export function getTerminalCarbons(graph: MoleculeGraph): AtomNode[] {
  return graph.nodes.filter(n => n.element === 'C' && isTerminalNode(n.id, graph.edges));
}

export function canAddBond(graph: MoleculeGraph, fromId: string, toId: string, bondOrder: BondOrder): boolean {
  const from = graph.nodes.find(n => n.id === fromId), to = graph.nodes.find(n => n.id === toId);
  if (!from || !to) return false;
  return getTotalBonds(fromId, graph.edges) + bondOrder <= getMaxValency(from.element) &&
    getTotalBonds(toId, graph.edges) + bondOrder <= getMaxValency(to.element);
}

export function createEmptyGraph(): MoleculeGraph {
  return { nodes: [], edges: [] };
}
