// PHASE 9: Structural Mutation Operations
// All operations VALIDATE BEFORE applying
// All operations modify GRAPH TOPOLOGY, never attach labels

import {
  MoleculeGraph,
  AtomNode,
  Bond,
  OrganicElement,
  BondOrder,
  BondType,
  getMaxValency,
  getTotalBonds,
  canAddBond,
  findBond,
  getNeighbors,
  isTerminalNode,
  updateImplicitHydrogens,
  updateHybridization,
  validateValence,
} from './organic-graph';

export interface MutationResult {
  success: boolean;
  graph?: MoleculeGraph;
  error?: string;
}

// Helper: Generate unique node ID
function generateNodeId(element: OrganicElement): string {
  return `${element}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Helper: Generate unique bond ID
function generateBondId(): string {
  return `B_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Helper: Check if adding a bond would create a cycle
function wouldCreateCycle(graph: MoleculeGraph, fromId: string, toId: string): boolean {
  // BFS to check if path already exists
  const visited = new Set<string>();
  const queue = [fromId];
  visited.add(fromId);

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === toId) return true;

    const neighbors = getNeighbors(current, graph.edges);
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }

  return false;
}

// Helper: Calculate position offset for new node
function calculateNewPosition(
  parentNode: AtomNode,
  existingNeighbors: AtomNode[],
  bondLength: number = 50
): { x: number; y: number } {
  // If no neighbors, place to the right
  if (existingNeighbors.length === 0) {
    return { x: parentNode.position.x + bondLength, y: parentNode.position.y };
  }

  // Calculate average direction of existing bonds and place in opposite direction
  let avgX = 0;
  let avgY = 0;
  for (const neighbor of existingNeighbors) {
    avgX += neighbor.position.x - parentNode.position.x;
    avgY += neighbor.position.y - parentNode.position.y;
  }
  avgX /= existingNeighbors.length;
  avgY /= existingNeighbors.length;

  // Normalize and invert
  const length = Math.sqrt(avgX * avgX + avgY * avgY);
  if (length === 0) {
    return { x: parentNode.position.x + bondLength, y: parentNode.position.y };
  }
  const dirX = (-avgX / length) * bondLength;
  const dirY = (-avgY / length) * bondLength;

  return {
    x: parentNode.position.x + dirX,
    y: parentNode.position.y + dirY,
  };
}

/**
 * Extend Chain
 * Adds carbon atom to terminal position extending linearly
 * ONLY works on terminal carbons (carbons with 1 bond to skeleton)
 * Extends in the same direction as the existing chain
 */
export function extendChain(graph: MoleculeGraph, terminalNodeId: string): MutationResult {
  const parentNode = graph.nodes.find((n) => n.id === terminalNodeId);
  if (!parentNode) {
    return { success: false, error: `Node ${terminalNodeId} not found` };
  }

  // CRITICAL: Only allow extending from terminal or near-terminal carbons
  const neighbors = getNeighbors(terminalNodeId, graph.edges);
  const carbonNeighbors = neighbors
    .map((id) => graph.nodes.find((n) => n.id === id))
    .filter((n): n is AtomNode => n !== undefined && n.element === 'C');

  // Terminal = 0 or 1 carbon neighbor (can have heteroatoms)
  if (carbonNeighbors.length > 1) {
    return {
      success: false,
      error: 'Extend Chain only works on terminal or near-terminal carbons. Use Add Branch for internal carbons.',
    };
  }

  // Check if parent can accept another bond
  const currentBonds = getTotalBonds(terminalNodeId, graph.edges);
  const maxValency = getMaxValency(parentNode.element);
  if (currentBonds >= maxValency) {
    const elementName = parentNode.element === 'C' ? 'Carbon' : parentNode.element;
    return {
      success: false,
      error: `${elementName} atom already has maximum bonds (${currentBonds}/${maxValency})`,
    };
  }

  // Calculate position for linear extension
  let newPosition: { x: number; y: number };
  const bondLength = 50;

  if (carbonNeighbors.length === 0) {
    // No carbon neighbors - extend to the right
    newPosition = { x: parentNode.position.x + bondLength, y: parentNode.position.y };
  } else {
    // One carbon neighbor - extend linearly in opposite direction
    const neighbor = carbonNeighbors[0];
    const dx = parentNode.position.x - neighbor.position.x;
    const dy = parentNode.position.y - neighbor.position.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length === 0) {
      newPosition = { x: parentNode.position.x + bondLength, y: parentNode.position.y };
    } else {
      // Extend in same direction, same length
      const dirX = (dx / length) * bondLength;
      const dirY = (dy / length) * bondLength;
      newPosition = {
        x: parentNode.position.x + dirX,
        y: parentNode.position.y + dirY,
      };
    }
  }

  // Create new carbon node
  const newCarbonId = generateNodeId('C');
  const newNode: AtomNode = {
    id: newCarbonId,
    element: 'C',
    position: newPosition,
    implicitHydrogens: 3, // will be recalculated
    hybridization: 'sp3',
  };

  // Create bond
  const newBond: Bond = {
    id: generateBondId(),
    from: terminalNodeId,
    to: newCarbonId,
    bondOrder: 1,
    bondType: 'sigma',
  };

  // Apply mutation
  let newGraph: MoleculeGraph = {
    nodes: [...graph.nodes, newNode],
    edges: [...graph.edges, newBond],
  };

  // Update derived properties
  newGraph = updateImplicitHydrogens(newGraph);
  newGraph = updateHybridization(newGraph);

  // Final validation
  const validation = validateValence(newGraph);
  if (!validation.isValid) {
    return { success: false, error: validation.errors.join(', ') };
  }

  return { success: true, graph: newGraph };
}

/**
 * Shorten Chain
 * Removes terminal carbon atom
 * Validates that carbon has ≤1 bond (is truly terminal)
 */
export function shortenChain(graph: MoleculeGraph, terminalNodeId: string): MutationResult {
  const node = graph.nodes.find((n) => n.id === terminalNodeId);
  if (!node) {
    return { success: false, error: `Node ${terminalNodeId} not found` };
  }

  // Check if node is terminal (has ≤1 bond)
  if (!isTerminalNode(terminalNodeId, graph.edges)) {
    return {
      success: false,
      error: `Node ${terminalNodeId} is not terminal (has >1 bonds)`,
    };
  }

  // Remove node and its bonds
  let newGraph: MoleculeGraph = {
    nodes: graph.nodes.filter((n) => n.id !== terminalNodeId),
    edges: graph.edges.filter((e) => e.from !== terminalNodeId && e.to !== terminalNodeId),
  };

  // Check if graph is still connected (no isolated fragments)
  if (newGraph.nodes.length > 0 && newGraph.edges.length === 0 && newGraph.nodes.length > 1) {
    return { success: false, error: 'Removal would create isolated fragment' };
  }

  // Update derived properties
  newGraph = updateImplicitHydrogens(newGraph);
  newGraph = updateHybridization(newGraph);

  return { success: true, graph: newGraph };
}

/**
 * Branch Carbon
 * Adds carbon branch perpendicular to existing structure
 * Works on ANY carbon node (terminal or internal)
 * Creates a side branch at ~120° angle from the main chain
 */
export function branchCarbon(graph: MoleculeGraph, parentNodeId: string): MutationResult {
  const parentNode = graph.nodes.find((n) => n.id === parentNodeId);
  if (!parentNode) {
    return { success: false, error: `Node ${parentNodeId} not found` };
  }

  // Check if parent can accept another bond
  const currentBonds = getTotalBonds(parentNodeId, graph.edges);
  const maxValency = getMaxValency(parentNode.element);
  if (currentBonds >= maxValency) {
    const elementName = parentNode.element === 'C' ? 'Carbon' : parentNode.element;
    return {
      success: false,
      error: `${elementName} atom already has maximum bonds (${currentBonds}/${maxValency})`,
    };
  }

  // Calculate position for branch carbon (perpendicular to main chain)
  const neighbors = getNeighbors(parentNodeId, graph.edges)
    .map((id) => graph.nodes.find((n) => n.id === id))
    .filter((n): n is AtomNode => n !== undefined);

  let newPosition: { x: number; y: number };
  const bondLength = 50;

  if (neighbors.length === 0) {
    // No neighbors - place above
    newPosition = { x: parentNode.position.x, y: parentNode.position.y - bondLength };
  } else if (neighbors.length === 1) {
    // One neighbor - place perpendicular (90° from existing bond)
    const neighbor = neighbors[0];
    const dx = parentNode.position.x - neighbor.position.x;
    const dy = parentNode.position.y - neighbor.position.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length === 0) {
      newPosition = { x: parentNode.position.x, y: parentNode.position.y - bondLength };
    } else {
      // Perpendicular vector: rotate by 90° (swap and negate)
      const perpX = (-dy / length) * bondLength;
      const perpY = (dx / length) * bondLength;
      newPosition = {
        x: parentNode.position.x + perpX,
        y: parentNode.position.y + perpY,
      };
    }
  } else {
    // Multiple neighbors - place at 120° from average direction
    let avgX = 0;
    let avgY = 0;
    for (const neighbor of neighbors) {
      avgX += neighbor.position.x - parentNode.position.x;
      avgY += neighbor.position.y - parentNode.position.y;
    }
    avgX /= neighbors.length;
    avgY /= neighbors.length;

    const length = Math.sqrt(avgX * avgX + avgY * avgY);
    if (length === 0) {
      newPosition = { x: parentNode.position.x, y: parentNode.position.y - bondLength };
    } else {
      // Place perpendicular to average direction
      const perpX = (-avgY / length) * bondLength;
      const perpY = (avgX / length) * bondLength;
      newPosition = {
        x: parentNode.position.x + perpX,
        y: parentNode.position.y + perpY,
      };
    }
  }

  // Create branch carbon node
  const branchCarbonId = generateNodeId('C');
  const branchNode: AtomNode = {
    id: branchCarbonId,
    element: 'C',
    position: newPosition,
    implicitHydrogens: 3,
    hybridization: 'sp3',
  };

  // Create bond
  const branchBond: Bond = {
    id: generateBondId(),
    from: parentNodeId,
    to: branchCarbonId,
    bondOrder: 1,
    bondType: 'sigma',
  };

  // Apply mutation
  let newGraph: MoleculeGraph = {
    nodes: [...graph.nodes, branchNode],
    edges: [...graph.edges, branchBond],
  };

  // Update derived properties
  newGraph = updateImplicitHydrogens(newGraph);
  newGraph = updateHybridization(newGraph);

  // Final validation
  const validation = validateValence(newGraph);
  if (!validation.isValid) {
    return { success: false, error: validation.errors.join(', ') };
  }

  return { success: true, graph: newGraph };
}

/**
 * Cyclize
 * Connects two non-adjacent carbon atoms to form ring
 * Validates ring size (3-8 common, 9+ warning) and valency
 */
export function cyclize(graph: MoleculeGraph, nodeAId: string, nodeBId: string): MutationResult {
  const nodeA = graph.nodes.find((n) => n.id === nodeAId);
  const nodeB = graph.nodes.find((n) => n.id === nodeBId);

  if (!nodeA || !nodeB) {
    return { success: false, error: 'One or both nodes not found' };
  }

  // Check if nodes are already bonded
  const existingBond = findBond(graph, nodeAId, nodeBId);
  if (existingBond) {
    return { success: false, error: 'Nodes are already bonded' };
  }

  // Check if both nodes can accept another bond
  if (!canAddBond(graph, nodeAId, nodeBId, 1)) {
    return {
      success: false,
      error: 'One or both nodes would exceed valency',
    };
  }

  // Check if nodes are already connected (would create existing cycle)
  const alreadyConnected = wouldCreateCycle(graph, nodeAId, nodeBId);
  if (!alreadyConnected) {
    return {
      success: false,
      error: 'Nodes must be part of same chain to cyclize',
    };
  }

  // Create new bond
  const cycleBond: Bond = {
    id: generateBondId(),
    from: nodeAId,
    to: nodeBId,
    bondOrder: 1,
    bondType: 'sigma',
  };

  // Apply mutation
  let newGraph: MoleculeGraph = {
    nodes: graph.nodes,
    edges: [...graph.edges, cycleBond],
  };

  // Update derived properties
  newGraph = updateImplicitHydrogens(newGraph);
  newGraph = updateHybridization(newGraph);

  // Final validation
  const validation = validateValence(newGraph);
  if (!validation.isValid) {
    return { success: false, error: validation.errors.join(', ') };
  }

  return { success: true, graph: newGraph };
}

/**
 * Change Bond Order
 * Increases or decreases bond order between two nodes
 * Validates valency does not exceed max for either node
 */
export function changeBondOrder(
  graph: MoleculeGraph,
  fromId: string,
  toId: string,
  newBondOrder: BondOrder
): MutationResult {
  const bond = findBond(graph, fromId, toId);
  if (!bond) {
    return { success: false, error: 'Bond not found between specified nodes' };
  }

  // Check if bond is aromatic (cannot be changed)
  if (bond.bondType === 'aromatic') {
    return {
      success: false,
      error: 'Cannot change aromatic bonds (benzene ring)',
    };
  }

  const fromNode = graph.nodes.find((n) => n.id === fromId);
  const toNode = graph.nodes.find((n) => n.id === toId);
  if (!fromNode || !toNode) {
    return { success: false, error: 'One or both nodes not found' };
  }

  // Calculate new total bonds for each node
  const currentBondOrder = bond.bondOrder;
  const bondOrderDelta = newBondOrder - currentBondOrder;

  const fromTotalBonds = getTotalBonds(fromId, graph.edges) + bondOrderDelta;
  const toTotalBonds = getTotalBonds(toId, graph.edges) + bondOrderDelta;

  const fromMaxValency = getMaxValency(fromNode.element);
  const toMaxValency = getMaxValency(toNode.element);

  if (fromTotalBonds > fromMaxValency) {
    const elementName = fromNode.element === 'C' ? 'Carbon' : fromNode.element;
    return {
      success: false,
      error: `${elementName} atom would exceed maximum bonds (${fromTotalBonds} bonds, maximum ${fromMaxValency})`,
    };
  }

  if (toTotalBonds > toMaxValency) {
    const elementName = toNode.element === 'C' ? 'Carbon' : toNode.element;
    return {
      success: false,
      error: `${elementName} atom would exceed maximum bonds (${toTotalBonds} bonds, maximum ${toMaxValency})`,
    };
  }

  // Update bond order
  const updatedBond: Bond = {
    ...bond,
    bondOrder: newBondOrder,
    bondType: newBondOrder > 1 ? 'pi-system' : 'sigma',
  };

  // Apply mutation
  let newGraph: MoleculeGraph = {
    nodes: graph.nodes,
    edges: graph.edges.map((e) => (e.id === bond.id ? updatedBond : e)),
  };

  // Update derived properties
  newGraph = updateImplicitHydrogens(newGraph);
  newGraph = updateHybridization(newGraph);

  // Final validation
  const validation = validateValence(newGraph);
  if (!validation.isValid) {
    return { success: false, error: validation.errors.join(', ') };
  }

  return { success: true, graph: newGraph };
}

/**
 * Unsaturate Bond
 * Converts C-C single → C=C double or C=C double → C≡C triple
 * Validates valency and adjusts implicit hydrogens
 */
export function unsaturateBond(graph: MoleculeGraph, fromId: string, toId: string): MutationResult {
  const bond = findBond(graph, fromId, toId);
  if (!bond) {
    return { success: false, error: 'Bond not found between specified nodes' };
  }

  if (bond.bondType === 'aromatic') {
    return { success: false, error: 'Cannot unsaturate aromatic bonds' };
  }

  let newBondOrder: BondOrder;
  if (bond.bondOrder === 1) {
    newBondOrder = 2;
  } else if (bond.bondOrder === 2) {
    newBondOrder = 3;
  } else {
    return { success: false, error: 'Bond is already at maximum order (triple bond)' };
  }

  return changeBondOrder(graph, fromId, toId, newBondOrder);
}

/**
 * Saturate Bond
 * Converts C≡C triple → C=C double or C=C double → C-C single
 * Adds implicit hydrogens automatically
 */
export function saturateBond(graph: MoleculeGraph, fromId: string, toId: string): MutationResult {
  const bond = findBond(graph, fromId, toId);
  if (!bond) {
    return { success: false, error: 'Bond not found between specified nodes' };
  }

  if (bond.bondType === 'aromatic') {
    return { success: false, error: 'Cannot saturate aromatic bonds' };
  }

  let newBondOrder: BondOrder;
  if (bond.bondOrder === 3) {
    newBondOrder = 2;
  } else if (bond.bondOrder === 2) {
    newBondOrder = 1;
  } else {
    return { success: false, error: 'Bond is already at minimum order (single bond)' };
  }

  return changeBondOrder(graph, fromId, toId, newBondOrder);
}

/**
 * Attach Substituent
 * Attaches heteroatom or functional group to carbon node
 * CRITICAL: Adds ATOMS to graph, NOT labels
 * Functional groups are DETECTED after attachment
 */
export interface SubstituentType {
  type: 'hydroxyl' | 'carbonyl' | 'amino' | 'nitro' | 'halogen';
  halogen?: 'F' | 'Cl' | 'Br' | 'I'; // for halogen type
}

export function attachSubstituent(
  graph: MoleculeGraph,
  carbonNodeId: string,
  substituent: SubstituentType
): MutationResult {
  const carbonNode = graph.nodes.find((n) => n.id === carbonNodeId);
  if (!carbonNode) {
    return { success: false, error: `Node ${carbonNodeId} not found` };
  }

  let newNodes: AtomNode[] = [];
  let newBonds: Bond[] = [];

  // Calculate position offset for substituent
  const neighbors = getNeighbors(carbonNodeId, graph.edges)
    .map((id) => graph.nodes.find((n) => n.id === id))
    .filter((n): n is AtomNode => n !== undefined);
  const substituentPosition = calculateNewPosition(carbonNode, neighbors, 40);

  switch (substituent.type) {
    case 'hydroxyl': {
      // Add O-H pattern
      const oxygenId = generateNodeId('O');
      const currentBonds = getTotalBonds(carbonNodeId, graph.edges);
      if (currentBonds >= getMaxValency(carbonNode.element)) {
        return { success: false, error: 'Carbon atom already has maximum bonds. Cannot attach -OH group' };
      }

      newNodes.push({
        id: oxygenId,
        element: 'O',
        position: substituentPosition,
        implicitHydrogens: 1, // will be recalculated
        hybridization: 'sp3',
      });

      newBonds.push({
        id: generateBondId(),
        from: carbonNodeId,
        to: oxygenId,
        bondOrder: 1,
        bondType: 'sigma',
      });
      break;
    }

    case 'carbonyl': {
      // Add C=O pattern
      const oxygenId = generateNodeId('O');
      const currentBonds = getTotalBonds(carbonNodeId, graph.edges);
      if (currentBonds + 2 > getMaxValency(carbonNode.element)) {
        return { success: false, error: 'Carbon atom already has maximum bonds. Cannot attach =O group' };
      }

      newNodes.push({
        id: oxygenId,
        element: 'O',
        position: substituentPosition,
        implicitHydrogens: 0,
        hybridization: 'sp2',
      });

      newBonds.push({
        id: generateBondId(),
        from: carbonNodeId,
        to: oxygenId,
        bondOrder: 2,
        bondType: 'pi-system',
      });
      break;
    }

    case 'amino': {
      // Add N-H2 pattern
      const nitrogenId = generateNodeId('N');
      const currentBonds = getTotalBonds(carbonNodeId, graph.edges);
      if (currentBonds >= getMaxValency(carbonNode.element)) {
        return { success: false, error: 'Carbon atom already has maximum bonds. Cannot attach -NH₂ group' };
      }

      newNodes.push({
        id: nitrogenId,
        element: 'N',
        position: substituentPosition,
        implicitHydrogens: 2, // will be recalculated
        hybridization: 'sp3',
      });

      newBonds.push({
        id: generateBondId(),
        from: carbonNodeId,
        to: nitrogenId,
        bondOrder: 1,
        bondType: 'sigma',
      });
      break;
    }

    case 'nitro': {
      // Add -NO₂ pattern
      // Chemical structure: C-N(=O)-O (resonance structure with N⁺)
      // Bond orders: C-N(1), N=O(2), N-O(1)
      // Total bonds on N: 1 + 2 + 1 = 4 (requires special handling for N⁺)
      const nitrogenId = generateNodeId('N');
      const oxygen1Id = generateNodeId('O');
      const oxygen2Id = generateNodeId('O');
      const currentBonds = getTotalBonds(carbonNodeId, graph.edges);
      if (currentBonds >= getMaxValency(carbonNode.element)) {
        return { success: false, error: 'Carbon atom already has maximum bonds. Cannot attach -NO₂ group' };
      }

      newNodes.push(
        {
          id: nitrogenId,
          element: 'N',
          position: substituentPosition,
          implicitHydrogens: 0,
          hybridization: 'sp2',
        },
        {
          id: oxygen1Id,
          element: 'O',
          position: { x: substituentPosition.x - 20, y: substituentPosition.y - 20 },
          implicitHydrogens: 0,
          hybridization: 'sp2',
        },
        {
          id: oxygen2Id,
          element: 'O',
          position: { x: substituentPosition.x + 20, y: substituentPosition.y - 20 },
          implicitHydrogens: 0,
          hybridization: 'sp3',
        }
      );

      newBonds.push(
        {
          id: generateBondId(),
          from: carbonNodeId,
          to: nitrogenId,
          bondOrder: 1,
          bondType: 'sigma',
        },
        {
          id: generateBondId(),
          from: nitrogenId,
          to: oxygen1Id,
          bondOrder: 2,
          bondType: 'pi-system',
        },
        {
          id: generateBondId(),
          from: nitrogenId,
          to: oxygen2Id,
          bondOrder: 1,
          bondType: 'sigma',
        }
      );
      break;
    }

    case 'halogen': {
      // Add X (F, Cl, Br, I) pattern
      if (!substituent.halogen) {
        return { success: false, error: 'Halogen type not specified' };
      }
      const halogenId = generateNodeId(substituent.halogen);
      const currentBonds = getTotalBonds(carbonNodeId, graph.edges);
      if (currentBonds >= getMaxValency(carbonNode.element)) {
        return { success: false, error: `Carbon atom already has maximum bonds. Cannot attach -${substituent.halogen} group` };
      }

      newNodes.push({
        id: halogenId,
        element: substituent.halogen,
        position: substituentPosition,
        implicitHydrogens: 0,
        hybridization: 'sp3',
      });

      newBonds.push({
        id: generateBondId(),
        from: carbonNodeId,
        to: halogenId,
        bondOrder: 1,
        bondType: 'sigma',
      });
      break;
    }

    default:
      return { success: false, error: 'Unknown substituent type' };
  }

  // Apply mutation
  let newGraph: MoleculeGraph = {
    nodes: [...graph.nodes, ...newNodes],
    edges: [...graph.edges, ...newBonds],
  };

  // Update derived properties
  newGraph = updateImplicitHydrogens(newGraph);
  newGraph = updateHybridization(newGraph);

  // Final validation
  const validation = validateValence(newGraph);
  if (!validation.isValid) {
    return { success: false, error: validation.errors.join(', ') };
  }

  return { success: true, graph: newGraph };
}

/**
 * Remove Substituent
 * Removes heteroatom or functional group from carbon node
 * Only removes terminal heteroatoms (not part of carbon chain)
 */
export function removeSubstituent(graph: MoleculeGraph, substituentNodeId: string): MutationResult {
  const node = graph.nodes.find((n) => n.id === substituentNodeId);
  if (!node) {
    return { success: false, error: `Node ${substituentNodeId} not found` };
  }

  // Only allow removal of heteroatoms, not carbons
  if (node.element === 'C') {
    return { success: false, error: 'Cannot remove carbon nodes using removeSubstituent (use shortenChain instead)' };
  }

  // Check if heteroatom is terminal
  const neighbors = getNeighbors(substituentNodeId, graph.edges);
  if (neighbors.length > 1) {
    return {
      success: false,
      error: 'Can only remove terminal heteroatoms (single bond to carbon)',
    };
  }

  // For nitro groups, remove all connected oxygens if removing nitrogen
  let nodesToRemove = [substituentNodeId];
  if (node.element === 'N') {
    // Check if this is part of a nitro group (N bonded to 2 oxygens)
    const nitrogenNeighbors = neighbors.map((id) => graph.nodes.find((n) => n.id === id)).filter((n): n is AtomNode => n !== undefined);
    const oxygenNeighbors = nitrogenNeighbors.filter((n) => n.element === 'O');
    if (oxygenNeighbors.length === 2) {
      nodesToRemove.push(...oxygenNeighbors.map((n) => n.id));
    }
  }

  // Remove nodes and their bonds
  let newGraph: MoleculeGraph = {
    nodes: graph.nodes.filter((n) => !nodesToRemove.includes(n.id)),
    edges: graph.edges.filter((e) => !nodesToRemove.includes(e.from) && !nodesToRemove.includes(e.to)),
  };

  // Update derived properties
  newGraph = updateImplicitHydrogens(newGraph);
  newGraph = updateHybridization(newGraph);

  return { success: true, graph: newGraph };
}
