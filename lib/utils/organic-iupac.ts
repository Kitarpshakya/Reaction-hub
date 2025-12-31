// lib/utils/organic-iupac.ts

import { MoleculeGraph, AtomNode, getNeighbors, findBond } from './organic-graph';

enum FunctionalGroupPriority {
  CARBOXYLIC_ACID = 1,
  ALDEHYDE = 2,
  KETONE = 3,
  ALCOHOL = 4,
  ALKENE = 5,
  ALKYNE = 6,
  ALKANE = 7,
}

interface FunctionalGroup {
  type: 'carboxylic_acid' | 'aldehyde' | 'ketone' | 'alcohol';
  priority: number;
  carbonId: string;
}

interface Substituent {
  name: string;
  locant: number;
}

function getCarbonNodes(graph: MoleculeGraph): AtomNode[] {
  return graph.nodes.filter(n => n.element === 'C');
}

function hasAromaticRing(graph: MoleculeGraph): boolean {
  return graph.edges.some(e => e.bondType === 'aromatic');
}

// Detect if structure contains a ring (cycle)
function detectRing(graph: MoleculeGraph): string[] | null {
  const carbons = getCarbonNodes(graph);
  if (carbons.length < 3) return null;

  // Try to find a cycle using DFS
  for (const startNode of carbons) {
    const visited = new Set<string>();
    const path: string[] = [];

    const dfs = (nodeId: string, parent: string | null): string[] | null => {
      visited.add(nodeId);
      path.push(nodeId);

      const neighbors = getNeighbors(nodeId, graph.edges).filter(id => {
        const node = graph.nodes.find(n => n.id === id);
        return node && node.element === 'C'; // Only follow carbon atoms
      });

      for (const neighbor of neighbors) {
        if (neighbor === parent) continue; // Skip coming back to parent

        if (visited.has(neighbor)) {
          // Found a cycle - return the cycle nodes
          const cycleStart = path.indexOf(neighbor);
          if (cycleStart !== -1) {
            return path.slice(cycleStart);
          }
        } else {
          const cycle = dfs(neighbor, nodeId);
          if (cycle) return cycle;
        }
      }

      path.pop();
      return null;
    };

    const cycle = dfs(startNode.id, null);
    if (cycle && cycle.length >= 3) {
      return cycle;
    }
  }

  return null;
}

function detectFunctionalGroupAtCarbon(graph: MoleculeGraph, carbonId: string): FunctionalGroup | null {
  const neighbors = getNeighbors(carbonId, graph.edges);
  const neighborNodes = neighbors
    .map(id => graph.nodes.find(n => n.id === id))
    .filter((n): n is AtomNode => n !== undefined);

  const oxygens = neighborNodes.filter(n => n.element === 'O');
  const carbons = neighborNodes.filter(n => n.element === 'C');

  if (oxygens.length === 2) {
    const b1 = findBond(graph, carbonId, oxygens[0].id);
    const b2 = findBond(graph, carbonId, oxygens[1].id);
    if (b1 && b2 && ((b1.bondOrder === 2 && b2.bondOrder === 1) || (b1.bondOrder === 1 && b2.bondOrder === 2))) {
      return { type: 'carboxylic_acid', priority: FunctionalGroupPriority.CARBOXYLIC_ACID, carbonId };
    }
  }

  if (oxygens.length === 1) {
    const bond = findBond(graph, carbonId, oxygens[0].id);
    if (bond && bond.bondOrder === 2) {
      if (carbons.length <= 1) {
        return { type: 'aldehyde', priority: FunctionalGroupPriority.ALDEHYDE, carbonId };
      } else {
        return { type: 'ketone', priority: FunctionalGroupPriority.KETONE, carbonId };
      }
    }
    if (bond && bond.bondOrder === 1) {
      return { type: 'alcohol', priority: FunctionalGroupPriority.ALCOHOL, carbonId };
    }
  }

  return null;
}

function findLongestChain(graph: MoleculeGraph, mustInclude?: string): string[] {
  const carbons = getCarbonNodes(graph);
  if (carbons.length === 0) return [];

  let longest: string[] = [];

  const dfs = (path: string[], visited: Set<string>) => {
    if (path.length > longest.length || (path.length === longest.length && mustInclude && path.includes(mustInclude) && !longest.includes(mustInclude))) {
      longest = [...path];
    }

    const current = path[path.length - 1];
    const neighbors = getNeighbors(current, graph.edges).filter(id => {
      const node = graph.nodes.find(n => n.id === id);
      return node && node.element === 'C' && !visited.has(id);
    });

    for (const neighbor of neighbors) {
      visited.add(neighbor);
      path.push(neighbor);
      dfs(path, visited);
      path.pop();
      visited.delete(neighbor);
    }
  };

  for (const carbon of carbons) {
    dfs([carbon.id], new Set([carbon.id]));
  }

  if (mustInclude && !longest.includes(mustInclude)) {
    return [];
  }

  return longest;
}

function numberChain(chain: string[], graph: MoleculeGraph, fgCarbon?: string): Map<string, number> {
  const forward = new Map<string, number>();
  const reverse = new Map<string, number>();

  chain.forEach((id, i) => {
    forward.set(id, i + 1);
    reverse.set(id, chain.length - i);
  });

  if (!fgCarbon) {
    const forwardUnsatSum = getUnsaturationSum(chain, graph, forward);
    const reverseUnsatSum = getUnsaturationSum(chain, graph, reverse);
    return forwardUnsatSum <= reverseUnsatSum ? forward : reverse;
  }

  const fwdLocant = forward.get(fgCarbon) || Infinity;
  const revLocant = reverse.get(fgCarbon) || Infinity;

  if (fwdLocant !== revLocant) {
    return fwdLocant < revLocant ? forward : reverse;
  }

  const forwardUnsatSum = getUnsaturationSum(chain, graph, forward);
  const reverseUnsatSum = getUnsaturationSum(chain, graph, reverse);
  return forwardUnsatSum <= reverseUnsatSum ? forward : reverse;
}

function getUnsaturationSum(chain: string[], graph: MoleculeGraph, numbering: Map<string, number>): number {
  let sum = 0;
  for (let i = 0; i < chain.length - 1; i++) {
    const bond = findBond(graph, chain[i], chain[i + 1]);
    if (bond && bond.bondOrder > 1 && bond.bondType !== 'aromatic') {
      sum += Math.min(numbering.get(chain[i]) || 0, numbering.get(chain[i + 1]) || 0);
    }
  }
  return sum;
}

function getSubstituents(graph: MoleculeGraph, chain: string[], numbering: Map<string, number>): Substituent[] {
  const subs: Substituent[] = [];
  const chainSet = new Set(chain);

  for (const carbonId of chain) {
    const locant = numbering.get(carbonId) || 0;
    const neighbors = getNeighbors(carbonId, graph.edges);

    for (const nId of neighbors) {
      const node = graph.nodes.find(n => n.id === nId);
      if (!node) continue;

      if (node.element === 'C' && !chainSet.has(nId)) {
        const size = getBranchSize(graph, nId, chainSet);
        if (size === 1) subs.push({ name: 'methyl', locant });
        else if (size === 2) subs.push({ name: 'ethyl', locant });
        else if (size === 3) subs.push({ name: 'propyl', locant });
      }

      if (node.element === 'F') subs.push({ name: 'fluoro', locant });
      if (node.element === 'Cl') subs.push({ name: 'chloro', locant });
      if (node.element === 'Br') subs.push({ name: 'bromo', locant });
      if (node.element === 'I') subs.push({ name: 'iodo', locant });
    }
  }

  return subs;
}

function getBranchSize(graph: MoleculeGraph, start: string, exclude: Set<string>): number {
  let count = 0;
  const queue = [start];
  const visited = new Set([start]);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const node = graph.nodes.find(n => n.id === current);
    if (node && node.element === 'C') count++;

    const neighbors = getNeighbors(current, graph.edges);
    for (const nId of neighbors) {
      const n = graph.nodes.find(nd => nd.id === nId);
      if (n && n.element === 'C' && !visited.has(nId) && !exclude.has(nId)) {
        visited.add(nId);
        queue.push(nId);
      }
    }
  }

  return count;
}

function getParentName(count: number): string {
  const names: Record<number, string> = {
    1: 'meth', 2: 'eth', 3: 'prop', 4: 'but', 5: 'pent',
    6: 'hex', 7: 'hept', 8: 'oct', 9: 'non', 10: 'dec',
    11: 'undec', 12: 'dodec', 13: 'tridec', 14: 'tetradec', 15: 'pentadec',
    16: 'hexadec', 17: 'heptadec', 18: 'octadec', 19: 'nonadec', 20: 'icos'
  };
  return names[count] || `C${count}`;
}

function detectUnsaturation(graph: MoleculeGraph, chain: string[], numbering: Map<string, number>): { type: 'ene' | 'yne' | 'ane', locant?: number } {
  for (let i = 0; i < chain.length - 1; i++) {
    const bond = findBond(graph, chain[i], chain[i + 1]);
    if (bond && bond.bondType !== 'aromatic') {
      if (bond.bondOrder === 2) {
        return { type: 'ene', locant: Math.min(numbering.get(chain[i]) || 0, numbering.get(chain[i + 1]) || 0) };
      }
      if (bond.bondOrder === 3) {
        return { type: 'yne', locant: Math.min(numbering.get(chain[i]) || 0, numbering.get(chain[i + 1]) || 0) };
      }
    }
  }
  return { type: 'ane' };
}

function formatSubstituents(subs: Substituent[]): string {
  if (subs.length === 0) return '';

  const grouped = new Map<string, number[]>();
  for (const sub of subs) {
    if (!grouped.has(sub.name)) grouped.set(sub.name, []);
    grouped.get(sub.name)!.push(sub.locant);
  }

  const sorted = Array.from(grouped.keys()).sort();
  const parts: string[] = [];

  for (const name of sorted) {
    const locants = grouped.get(name)!.sort((a, b) => a - b);
    const locantStr = locants.join(',');
    const prefix = locants.length === 2 ? 'di' : locants.length === 3 ? 'tri' : locants.length === 4 ? 'tetra' : '';
    parts.push(prefix ? `${locantStr}-${prefix}${name}` : `${locantStr}-${name}`);
  }

  return parts.join('-');
}

export function computeIUPACName(graph: MoleculeGraph): string {
  if (!graph || graph.nodes.length === 0) return 'Invalid structure';

  const carbons = getCarbonNodes(graph);
  if (carbons.length === 0) return 'Unsupported structure for IUPAC naming';

  // Check for aromatic ring (benzene)
  if (hasAromaticRing(graph)) {
    const aromaticCarbons = carbons.filter(c => {
      const neighbors = getNeighbors(c.id, graph.edges);
      return graph.edges.some(e => e.bondType === 'aromatic' && (e.from === c.id || e.to === c.id));
    });

    if (aromaticCarbons.length === 6) {
      // Check for substituents on benzene ring
      const substituents: { name: string; locant: number }[] = [];
      let fgOnRing: FunctionalGroup | null = null;

      // Simple numbering around the ring
      const ringNumbering = new Map<string, number>();
      aromaticCarbons.forEach((c, i) => {
        ringNumbering.set(c.id, i + 1);
      });

      for (const c of aromaticCarbons) {
        const fg = detectFunctionalGroupAtCarbon(graph, c.id);
        if (fg) {
          if (!fgOnRing || fg.priority < fgOnRing.priority) {
            fgOnRing = fg;
          }
        }

        // Detect substituents (non-ring carbons attached)
        const neighbors = getNeighbors(c.id, graph.edges);
        for (const nId of neighbors) {
          const node = graph.nodes.find(n => n.id === nId);
          if (!node) continue;
          if (node.element === 'C' && !aromaticCarbons.find(ac => ac.id === nId)) {
            const locant = ringNumbering.get(c.id) || 1;
            substituents.push({ name: 'methyl', locant });
          }
          if (node.element === 'F') substituents.push({ name: 'fluoro', locant: ringNumbering.get(c.id) || 1 });
          if (node.element === 'Cl') substituents.push({ name: 'chloro', locant: ringNumbering.get(c.id) || 1 });
          if (node.element === 'Br') substituents.push({ name: 'bromo', locant: ringNumbering.get(c.id) || 1 });
          if (node.element === 'I') substituents.push({ name: 'iodo', locant: ringNumbering.get(c.id) || 1 });
        }
      }

      const subStr = formatSubstituents(substituents);
      if (fgOnRing && fgOnRing.type === 'carboxylic_acid') {
        return subStr ? `${subStr}-benzoic acid` : 'benzoic acid';
      }
      if (fgOnRing && fgOnRing.type === 'alcohol') {
        return subStr ? `${subStr}-phenol` : 'phenol';
      }
      return subStr ? `${subStr}-benzene` : 'benzene';
    }
  }

  // Check for non-aromatic ring (cycloalkane/cycloalkene)
  const ring = detectRing(graph);
  if (ring) {
    const ringSet = new Set(ring);

    // Find highest priority functional group
    let highestFG: FunctionalGroup | null = null;
    for (const carbonId of ring) {
      const fg = detectFunctionalGroupAtCarbon(graph, carbonId);
      if (fg && (!highestFG || fg.priority < highestFG.priority)) {
        highestFG = fg;
      }
    }

    // Number the ring (start from functional group if present)
    const numbering = new Map<string, number>();
    const startIdx = highestFG ? ring.indexOf(highestFG.carbonId) : 0;
    for (let i = 0; i < ring.length; i++) {
      const idx = (startIdx + i) % ring.length;
      numbering.set(ring[idx], i + 1);
    }

    // Get substituents (carbons attached to ring but not in ring)
    const subs = getSubstituents(graph, ring, numbering);

    // Detect unsaturation in ring
    const unsat = detectUnsaturation(graph, ring, numbering);

    const parent = getParentName(ring.length);
    const subStr = formatSubstituents(subs);
    const parts: string[] = [];

    if (subStr) parts.push(subStr);

    if (highestFG) {
      const locant = numbering.get(highestFG.carbonId);

      if (highestFG.type === 'carboxylic_acid') {
        parts.push(unsat.type === 'ane' ? `cyclo${parent}anecarboxylic acid` : `cyclo${parent}-${unsat.locant}-${unsat.type}carboxylic acid`);
      } else if (highestFG.type === 'alcohol') {
        if (locant === 1) {
          parts.push(unsat.type === 'ane' ? `cyclo${parent}anol` : `cyclo${parent}-${unsat.locant}-${unsat.type}ol`);
        } else {
          parts.push(unsat.type === 'ane' ? `cyclo${parent}an-${locant}-ol` : `cyclo${parent}-${unsat.locant}-${unsat.type}-${locant}-ol`);
        }
      } else if (highestFG.type === 'ketone') {
        parts.push(unsat.type === 'ane' ? `cyclo${parent}an-${locant}-one` : `cyclo${parent}-${unsat.locant}-${unsat.type}-${locant}-one`);
      }
    } else {
      // No functional group, just cycloalkane or cycloalkene
      if (unsat.type === 'ane') {
        parts.push(`cyclo${parent}ane`);
      } else {
        parts.push(`cyclo${parent}-${unsat.locant}-${unsat.type}`);
      }
    }

    return parts.join('-');
  }

  // No ring detected - use linear chain logic
  let highestFG: FunctionalGroup | null = null;
  for (const c of carbons) {
    const fg = detectFunctionalGroupAtCarbon(graph, c.id);
    if (fg && (!highestFG || fg.priority < highestFG.priority)) {
      highestFG = fg;
    }
  }

  const chain = highestFG ? findLongestChain(graph, highestFG.carbonId) : findLongestChain(graph);
  if (chain.length === 0) return 'Invalid structure';

  const numbering = numberChain(chain, graph, highestFG?.carbonId);
  const subs = getSubstituents(graph, chain, numbering);
  const unsat = detectUnsaturation(graph, chain, numbering);
  const parent = getParentName(chain.length);

  const subStr = formatSubstituents(subs);
  const parts: string[] = [];

  if (subStr) parts.push(subStr);

  if (highestFG) {
    const locant = numbering.get(highestFG.carbonId);

    if (highestFG.type === 'carboxylic_acid') {
      parts.push(unsat.type === 'ane' ? `${parent}anoic acid` : `${parent}-${unsat.locant}-${unsat.type}oic acid`);
    } else if (highestFG.type === 'aldehyde') {
      parts.push(unsat.type === 'ane' ? `${parent}anal` : `${parent}-${unsat.locant}-${unsat.type}al`);
    } else if (highestFG.type === 'ketone') {
      parts.push(unsat.type === 'ane' ? `${parent}an-${locant}-one` : `${parent}-${unsat.locant}-${unsat.type}-${locant}-one`);
    } else if (highestFG.type === 'alcohol') {
      if (chain.length <= 2 || locant === 1) {
        parts.push(unsat.type === 'ane' ? `${parent}anol` : `${parent}-${unsat.locant}-${unsat.type}ol`);
      } else {
        parts.push(unsat.type === 'ane' ? `${parent}an-${locant}-ol` : `${parent}-${unsat.locant}-${unsat.type}-${locant}-ol`);
      }
    }
  } else {
    if (unsat.type === 'ane') {
      parts.push(`${parent}ane`);
    } else {
      parts.push(`${parent}-${unsat.locant}-${unsat.type}`);
    }
  }

  return parts.join('-');
}
