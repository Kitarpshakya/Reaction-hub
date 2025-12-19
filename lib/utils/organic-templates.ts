// PHASE 9: Template Seed System
// Templates are INITIAL GRAPH SEEDS, not final molecules
// Each template creates a starting carbon graph that can be mutated

import {
  MoleculeGraph,
  AtomNode,
  Bond,
  OrganicElement,
  createEmptyGraph,
  updateImplicitHydrogens,
  updateHybridization,
} from './organic-graph';

export type TemplateType =
  | 'alkane-chain'
  | 'alkene-chain'
  | 'alkyne-chain'
  | 'fatty-acid'
  | 'alcohol'
  | 'aromatic-ring'
  | 'cycloalkane'
  | 'carbonyl'
  | 'blank-canvas';

export interface TemplateParams {
  chainLength?: number; // for linear chains (1-20)
  ringSize?: number; // for cycloalkanes (3-8)
  doubleBondPosition?: number; // for alkenes (0-indexed)
  tripleBondPosition?: number; // for alkynes (0-indexed)
}

// Helper: Generate unique node ID
function generateNodeId(element: OrganicElement): string {
  return `${element}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Helper: Generate unique bond ID
function generateBondId(): string {
  return `B_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Helper: Calculate 2D position for linear chain (horizontal layout)
function getLinearPosition(index: number, bondLength: number = 50): { x: number; y: number } {
  return { x: index * bondLength, y: 300 }; // center vertically at y=300
}

// Helper: Calculate 2D position for ring (circular layout)
function getRingPosition(
  index: number,
  totalNodes: number,
  centerX: number = 400,
  centerY: number = 300,
  radius: number = 80
): { x: number; y: number } {
  const angle = (index * 2 * Math.PI) / totalNodes - Math.PI / 2; // start at top
  return {
    x: centerX + radius * Math.cos(angle),
    y: centerY + radius * Math.sin(angle),
  };
}

/**
 * Alkane Chain Template
 * Creates linear chain of N carbon atoms, all single-bonded
 * Example: C3 → C-C-C (propane backbone)
 */
export function createAlkaneChain(params: TemplateParams): MoleculeGraph {
  const length = Math.max(1, Math.min(20, params.chainLength || 3));
  const nodes: AtomNode[] = [];
  const edges: Bond[] = [];

  // Create carbon nodes
  for (let i = 0; i < length; i++) {
    nodes.push({
      id: generateNodeId('C'),
      element: 'C',
      position: getLinearPosition(i),
      implicitHydrogens: 0, // will be calculated
      hybridization: 'sp3',
    });
  }

  // Create single bonds between adjacent carbons
  for (let i = 0; i < length - 1; i++) {
    edges.push({
      id: generateBondId(),
      from: nodes[i].id,
      to: nodes[i + 1].id,
      bondOrder: 1,
      bondType: 'sigma',
    });
  }

  let graph: MoleculeGraph = { nodes, edges };
  graph = updateImplicitHydrogens(graph);
  graph = updateHybridization(graph);

  return graph;
}

/**
 * Alkene Chain Template
 * Creates linear chain with ONE C=C double bond
 * Bond position is editable after creation
 */
export function createAlkeneChain(params: TemplateParams): MoleculeGraph {
  const length = Math.max(2, Math.min(20, params.chainLength || 4));
  const doubleBondPos = Math.max(0, Math.min(length - 2, params.doubleBondPosition || 0));
  const nodes: AtomNode[] = [];
  const edges: Bond[] = [];

  // Create carbon nodes
  for (let i = 0; i < length; i++) {
    nodes.push({
      id: generateNodeId('C'),
      element: 'C',
      position: getLinearPosition(i),
      implicitHydrogens: 0,
      hybridization: 'sp3', // will be updated
    });
  }

  // Create bonds (one double bond at specified position)
  for (let i = 0; i < length - 1; i++) {
    const isDoubleBond = i === doubleBondPos;
    edges.push({
      id: generateBondId(),
      from: nodes[i].id,
      to: nodes[i + 1].id,
      bondOrder: isDoubleBond ? 2 : 1,
      bondType: isDoubleBond ? 'pi-system' : 'sigma',
    });
  }

  let graph: MoleculeGraph = { nodes, edges };
  graph = updateImplicitHydrogens(graph);
  graph = updateHybridization(graph);

  return graph;
}

/**
 * Alkyne Chain Template
 * Creates linear chain with ONE C≡C triple bond
 * Bond position is editable after creation
 */
export function createAlkyneChain(params: TemplateParams): MoleculeGraph {
  const length = Math.max(2, Math.min(20, params.chainLength || 4));
  const tripleBondPos = Math.max(0, Math.min(length - 2, params.tripleBondPosition || 0));
  const nodes: AtomNode[] = [];
  const edges: Bond[] = [];

  // Create carbon nodes
  for (let i = 0; i < length; i++) {
    nodes.push({
      id: generateNodeId('C'),
      element: 'C',
      position: getLinearPosition(i),
      implicitHydrogens: 0,
      hybridization: 'sp3',
    });
  }

  // Create bonds (one triple bond at specified position)
  for (let i = 0; i < length - 1; i++) {
    const isTripleBond = i === tripleBondPos;
    edges.push({
      id: generateBondId(),
      from: nodes[i].id,
      to: nodes[i + 1].id,
      bondOrder: isTripleBond ? 3 : 1,
      bondType: isTripleBond ? 'pi-system' : 'sigma',
    });
  }

  let graph: MoleculeGraph = { nodes, edges };
  graph = updateImplicitHydrogens(graph);
  graph = updateHybridization(graph);

  return graph;
}

/**
 * Fatty Acid Template
 * Creates HOOC-(CH2)n-CH3 backbone
 * INCLUDES REQUIRED CARBOXYL CARBON
 * Chain length is editable (n parameter)
 */
export function createFattyAcid(params: TemplateParams): MoleculeGraph {
  const chainLength = Math.max(1, Math.min(20, params.chainLength || 16)); // default C16
  const nodes: AtomNode[] = [];
  const edges: Bond[] = [];

  // Create carboxylic acid group: C(=O)-O-H
  const carboxylCarbon = generateNodeId('C');
  const carbonylOxygen = generateNodeId('O');
  const hydroxylOxygen = generateNodeId('O');

  nodes.push(
    {
      id: carboxylCarbon,
      element: 'C',
      position: { x: 0, y: 300 },
      implicitHydrogens: 0,
      hybridization: 'sp2',
    },
    {
      id: carbonylOxygen,
      element: 'O',
      position: { x: 0, y: 250 },
      implicitHydrogens: 0,
      hybridization: 'sp2',
    },
    {
      id: hydroxylOxygen,
      element: 'O',
      position: { x: 0, y: 350 },
      implicitHydrogens: 1,
      hybridization: 'sp3',
    }
  );

  // Bonds for carboxyl group
  edges.push(
    {
      id: generateBondId(),
      from: carboxylCarbon,
      to: carbonylOxygen,
      bondOrder: 2,
      bondType: 'pi-system',
    },
    {
      id: generateBondId(),
      from: carboxylCarbon,
      to: hydroxylOxygen,
      bondOrder: 1,
      bondType: 'sigma',
    }
  );

  // Create carbon chain
  const carbonChain: string[] = [carboxylCarbon];
  for (let i = 0; i < chainLength; i++) {
    const carbonId = generateNodeId('C');
    nodes.push({
      id: carbonId,
      element: 'C',
      position: getLinearPosition(i + 1),
      implicitHydrogens: 0,
      hybridization: 'sp3',
    });
    carbonChain.push(carbonId);
  }

  // Create bonds in carbon chain
  for (let i = 0; i < carbonChain.length - 1; i++) {
    edges.push({
      id: generateBondId(),
      from: carbonChain[i],
      to: carbonChain[i + 1],
      bondOrder: 1,
      bondType: 'sigma',
    });
  }

  let graph: MoleculeGraph = { nodes, edges };
  graph = updateImplicitHydrogens(graph);
  graph = updateHybridization(graph);

  return graph;
}

/**
 * Alcohol Template
 * Creates (CH2)n-OH skeleton
 * NOT a complete alcohol - user must modify to create specific alcohols
 */
export function createAlcohol(params: TemplateParams): MoleculeGraph {
  const chainLength = Math.max(1, Math.min(20, params.chainLength || 3));
  const nodes: AtomNode[] = [];
  const edges: Bond[] = [];

  // Create carbon chain
  for (let i = 0; i < chainLength; i++) {
    nodes.push({
      id: generateNodeId('C'),
      element: 'C',
      position: getLinearPosition(i),
      implicitHydrogens: 0,
      hybridization: 'sp3',
    });
  }

  // Create bonds in carbon chain
  for (let i = 0; i < chainLength - 1; i++) {
    edges.push({
      id: generateBondId(),
      from: nodes[i].id,
      to: nodes[i + 1].id,
      bondOrder: 1,
      bondType: 'sigma',
    });
  }

  // Add hydroxyl group (-OH) to terminal carbon
  const oxygenId = generateNodeId('O');
  const terminalCarbon = nodes[nodes.length - 1];

  nodes.push({
    id: oxygenId,
    element: 'O',
    position: { x: terminalCarbon.position.x, y: terminalCarbon.position.y + 50 },
    implicitHydrogens: 1,
    hybridization: 'sp3',
  });

  edges.push({
    id: generateBondId(),
    from: terminalCarbon.id,
    to: oxygenId,
    bondOrder: 1,
    bondType: 'sigma',
  });

  let graph: MoleculeGraph = { nodes, edges };
  graph = updateImplicitHydrogens(graph);
  graph = updateHybridization(graph);

  return graph;
}

/**
 * Aromatic Ring Template
 * Creates benzene ring (C6) with aromatic bonds
 * Ring carbons are locked as aromatic (cannot convert to single bonds)
 */
export function createAromaticRing(): MoleculeGraph {
  const nodes: AtomNode[] = [];
  const edges: Bond[] = [];
  const ringSize = 6;

  // Create 6 carbon nodes in circular arrangement
  for (let i = 0; i < ringSize; i++) {
    nodes.push({
      id: generateNodeId('C'),
      element: 'C',
      position: getRingPosition(i, ringSize),
      implicitHydrogens: 1,
      hybridization: 'sp2',
    });
  }

  // Create aromatic bonds
  for (let i = 0; i < ringSize; i++) {
    edges.push({
      id: generateBondId(),
      from: nodes[i].id,
      to: nodes[(i + 1) % ringSize].id,
      bondOrder: 1, // aromatic bonds are represented as order 1 with bondType 'aromatic'
      bondType: 'aromatic',
    });
  }

  let graph: MoleculeGraph = { nodes, edges };
  graph = updateImplicitHydrogens(graph);
  graph = updateHybridization(graph);

  return graph;
}

/**
 * Cycloalkane Template
 * Creates saturated ring (C3-C8)
 * All single bonds, ring size variable
 */
export function createCycloalkane(params: TemplateParams): MoleculeGraph {
  const ringSize = Math.max(3, Math.min(8, params.ringSize || 6));
  const nodes: AtomNode[] = [];
  const edges: Bond[] = [];

  // Create carbon nodes in circular arrangement
  for (let i = 0; i < ringSize; i++) {
    nodes.push({
      id: generateNodeId('C'),
      element: 'C',
      position: getRingPosition(i, ringSize),
      implicitHydrogens: 0,
      hybridization: 'sp3',
    });
  }

  // Create single bonds
  for (let i = 0; i < ringSize; i++) {
    edges.push({
      id: generateBondId(),
      from: nodes[i].id,
      to: nodes[(i + 1) % ringSize].id,
      bondOrder: 1,
      bondType: 'sigma',
    });
  }

  let graph: MoleculeGraph = { nodes, edges };
  graph = updateImplicitHydrogens(graph);
  graph = updateHybridization(graph);

  return graph;
}

/**
 * Carbonyl Template
 * Creates C=O with editable attachments
 * NOT a complete molecule - user must attach substituents
 */
export function createCarbonyl(): MoleculeGraph {
  const nodes: AtomNode[] = [];
  const edges: Bond[] = [];

  const carbonId = generateNodeId('C');
  const oxygenId = generateNodeId('O');

  nodes.push(
    {
      id: carbonId,
      element: 'C',
      position: { x: 400, y: 300 },
      implicitHydrogens: 0,
      hybridization: 'sp2',
    },
    {
      id: oxygenId,
      element: 'O',
      position: { x: 400, y: 250 },
      implicitHydrogens: 0,
      hybridization: 'sp2',
    }
  );

  edges.push({
    id: generateBondId(),
    from: carbonId,
    to: oxygenId,
    bondOrder: 2,
    bondType: 'pi-system',
  });

  let graph: MoleculeGraph = { nodes, edges };
  graph = updateImplicitHydrogens(graph);
  graph = updateHybridization(graph);

  return graph;
}

/**
 * Blank Canvas Template
 * Starts with single carbon atom
 * User builds entire molecule from scratch
 */
export function createBlankCanvas(): MoleculeGraph {
  const nodes: AtomNode[] = [];

  nodes.push({
    id: generateNodeId('C'),
    element: 'C',
    position: { x: 400, y: 300 },
    implicitHydrogens: 4,
    hybridization: 'sp3',
  });

  return { nodes, edges: [] };
}

/**
 * Template Factory
 * Creates template graph based on type and parameters
 */
export function createTemplate(type: TemplateType, params?: TemplateParams): MoleculeGraph {
  switch (type) {
    case 'alkane-chain':
      return createAlkaneChain(params || {});
    case 'alkene-chain':
      return createAlkeneChain(params || {});
    case 'alkyne-chain':
      return createAlkyneChain(params || {});
    case 'fatty-acid':
      return createFattyAcid(params || {});
    case 'alcohol':
      return createAlcohol(params || {});
    case 'aromatic-ring':
      return createAromaticRing();
    case 'cycloalkane':
      return createCycloalkane(params || {});
    case 'carbonyl':
      return createCarbonyl();
    case 'blank-canvas':
      return createBlankCanvas();
    default:
      return createBlankCanvas();
  }
}

/**
 * Get template metadata
 */
export interface TemplateMetadata {
  type: TemplateType;
  name: string;
  description: string;
  defaultParams?: TemplateParams;
  paramOptions?: {
    chainLength?: { min: number; max: number; default: number };
    ringSize?: { min: number; max: number; default: number };
  };
}

export const TEMPLATE_CATALOG: TemplateMetadata[] = [
  {
    type: 'blank-canvas',
    name: 'Blank Canvas',
    description: 'Start with single carbon, build from scratch',
  },
  {
    type: 'alkane-chain',
    name: 'Alkane Chain',
    description: 'Linear carbon skeleton with all single bonds',
    defaultParams: { chainLength: 3 },
    paramOptions: { chainLength: { min: 1, max: 20, default: 3 } },
  },
  {
    type: 'alkene-chain',
    name: 'Alkene Chain',
    description: 'Linear chain with one C=C double bond',
    defaultParams: { chainLength: 4, doubleBondPosition: 0 },
    paramOptions: { chainLength: { min: 2, max: 20, default: 4 } },
  },
  {
    type: 'alkyne-chain',
    name: 'Alkyne Chain',
    description: 'Linear chain with one C≡C triple bond',
    defaultParams: { chainLength: 4, tripleBondPosition: 0 },
    paramOptions: { chainLength: { min: 2, max: 20, default: 4 } },
  },
  {
    type: 'fatty-acid',
    name: 'Fatty Acid',
    description: 'HOOC-(CH₂)ₙ-CH₃ backbone with carboxyl group',
    defaultParams: { chainLength: 16 },
    paramOptions: { chainLength: { min: 1, max: 20, default: 16 } },
  },
  {
    type: 'alcohol',
    name: 'Alcohol Skeleton',
    description: '(CH₂)ₙ-OH backbone with hydroxyl group',
    defaultParams: { chainLength: 3 },
    paramOptions: { chainLength: { min: 1, max: 20, default: 3 } },
  },
  {
    type: 'aromatic-ring',
    name: 'Aromatic Ring',
    description: 'Benzene ring (C₆) with aromatic bonds',
  },
  {
    type: 'cycloalkane',
    name: 'Cycloalkane',
    description: 'Saturated ring (C₃-C₈)',
    defaultParams: { ringSize: 6 },
    paramOptions: { ringSize: { min: 3, max: 8, default: 6 } },
  },
  {
    type: 'carbonyl',
    name: 'Carbonyl Backbone',
    description: 'C=O with editable attachments',
  },
];
