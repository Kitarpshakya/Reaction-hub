/**
 * SMILES Generation Examples and Tests
 * Run these examples to verify SMILES generation works correctly
 */

import { generateSMILES, isValidSMILES, getSMILESByFormula } from './organic-smiles';
import { MoleculeGraph } from './organic-graph';

// Example 1: Methane (CH4)
export const methaneGraph: MoleculeGraph = {
  nodes: [
    { id: 'c1', element: 'C', position: { x: 100, y: 100 }, implicitHydrogens: 4, hybridization: 'sp3' }
  ],
  edges: []
};
// Expected SMILES: "C"

// Example 2: Ethane (C2H6)
export const ethaneGraph: MoleculeGraph = {
  nodes: [
    { id: 'c1', element: 'C', position: { x: 100, y: 100 }, implicitHydrogens: 3, hybridization: 'sp3' },
    { id: 'c2', element: 'C', position: { x: 150, y: 100 }, implicitHydrogens: 3, hybridization: 'sp3' }
  ],
  edges: [
    { id: 'b1', from: 'c1', to: 'c2', bondOrder: 1, bondType: 'sigma' }
  ]
};
// Expected SMILES: "CC"

// Example 3: Propane (C3H8)
export const propaneGraph: MoleculeGraph = {
  nodes: [
    { id: 'c1', element: 'C', position: { x: 100, y: 100 }, implicitHydrogens: 3, hybridization: 'sp3' },
    { id: 'c2', element: 'C', position: { x: 150, y: 100 }, implicitHydrogens: 2, hybridization: 'sp3' },
    { id: 'c3', element: 'C', position: { x: 200, y: 100 }, implicitHydrogens: 3, hybridization: 'sp3' }
  ],
  edges: [
    { id: 'b1', from: 'c1', to: 'c2', bondOrder: 1, bondType: 'sigma' },
    { id: 'b2', from: 'c2', to: 'c3', bondOrder: 1, bondType: 'sigma' }
  ]
};
// Expected SMILES: "CCC"

// Example 4: Ethanol (C2H5OH)
export const ethanolGraph: MoleculeGraph = {
  nodes: [
    { id: 'c1', element: 'C', position: { x: 100, y: 100 }, implicitHydrogens: 3, hybridization: 'sp3' },
    { id: 'c2', element: 'C', position: { x: 150, y: 100 }, implicitHydrogens: 2, hybridization: 'sp3' },
    { id: 'o1', element: 'O', position: { x: 200, y: 100 }, implicitHydrogens: 1, hybridization: 'sp3' }
  ],
  edges: [
    { id: 'b1', from: 'c1', to: 'c2', bondOrder: 1, bondType: 'sigma' },
    { id: 'b2', from: 'c2', to: 'o1', bondOrder: 1, bondType: 'sigma' }
  ]
};
// Expected SMILES: "CCO"

// Example 5: Ethene (Ethylene, C2H4)
export const etheneGraph: MoleculeGraph = {
  nodes: [
    { id: 'c1', element: 'C', position: { x: 100, y: 100 }, implicitHydrogens: 2, hybridization: 'sp2' },
    { id: 'c2', element: 'C', position: { x: 150, y: 100 }, implicitHydrogens: 2, hybridization: 'sp2' }
  ],
  edges: [
    { id: 'b1', from: 'c1', to: 'c2', bondOrder: 2, bondType: 'pi-system' }
  ]
};
// Expected SMILES: "C=C"

// Example 6: Acetylene (C2H2)
export const acetylenGraph: MoleculeGraph = {
  nodes: [
    { id: 'c1', element: 'C', position: { x: 100, y: 100 }, implicitHydrogens: 1, hybridization: 'sp' },
    { id: 'c2', element: 'C', position: { x: 150, y: 100 }, implicitHydrogens: 1, hybridization: 'sp' }
  ],
  edges: [
    { id: 'b1', from: 'c1', to: 'c2', bondOrder: 3, bondType: 'pi-system' }
  ]
};
// Expected SMILES: "C#C"

// Example 7: Isobutane (Branched C4H10)
export const isobutaneGraph: MoleculeGraph = {
  nodes: [
    { id: 'c1', element: 'C', position: { x: 100, y: 100 }, implicitHydrogens: 3, hybridization: 'sp3' },
    { id: 'c2', element: 'C', position: { x: 150, y: 100 }, implicitHydrogens: 1, hybridization: 'sp3' },
    { id: 'c3', element: 'C', position: { x: 150, y: 150 }, implicitHydrogens: 3, hybridization: 'sp3' },
    { id: 'c4', element: 'C', position: { x: 200, y: 100 }, implicitHydrogens: 3, hybridization: 'sp3' }
  ],
  edges: [
    { id: 'b1', from: 'c1', to: 'c2', bondOrder: 1, bondType: 'sigma' },
    { id: 'b2', from: 'c2', to: 'c3', bondOrder: 1, bondType: 'sigma' },
    { id: 'b3', from: 'c2', to: 'c4', bondOrder: 1, bondType: 'sigma' }
  ]
};
// Expected SMILES: "CC(C)C" (with branch notation)

// Example 8: Benzene (C6H6) - Aromatic
export const benzeneGraph: MoleculeGraph = {
  nodes: [
    { id: 'c1', element: 'C', position: { x: 150, y: 100 }, implicitHydrogens: 1, hybridization: 'sp2' },
    { id: 'c2', element: 'C', position: { x: 175, y: 125 }, implicitHydrogens: 1, hybridization: 'sp2' },
    { id: 'c3', element: 'C', position: { x: 175, y: 175 }, implicitHydrogens: 1, hybridization: 'sp2' },
    { id: 'c4', element: 'C', position: { x: 150, y: 200 }, implicitHydrogens: 1, hybridization: 'sp2' },
    { id: 'c5', element: 'C', position: { x: 125, y: 175 }, implicitHydrogens: 1, hybridization: 'sp2' },
    { id: 'c6', element: 'C', position: { x: 125, y: 125 }, implicitHydrogens: 1, hybridization: 'sp2' }
  ],
  edges: [
    { id: 'b1', from: 'c1', to: 'c2', bondOrder: 1, bondType: 'aromatic' },
    { id: 'b2', from: 'c2', to: 'c3', bondOrder: 1, bondType: 'aromatic' },
    { id: 'b3', from: 'c3', to: 'c4', bondOrder: 1, bondType: 'aromatic' },
    { id: 'b4', from: 'c4', to: 'c5', bondOrder: 1, bondType: 'aromatic' },
    { id: 'b5', from: 'c5', to: 'c6', bondOrder: 1, bondType: 'aromatic' },
    { id: 'b6', from: 'c6', to: 'c1', bondOrder: 1, bondType: 'aromatic' }
  ]
};
// Expected SMILES: "c1ccccc1" (aromatic, lowercase, ring closure)

// Example 9: Acetic Acid (CH3COOH)
export const aceticAcidGraph: MoleculeGraph = {
  nodes: [
    { id: 'c1', element: 'C', position: { x: 100, y: 100 }, implicitHydrogens: 3, hybridization: 'sp3' },
    { id: 'c2', element: 'C', position: { x: 150, y: 100 }, implicitHydrogens: 0, hybridization: 'sp2' },
    { id: 'o1', element: 'O', position: { x: 150, y: 150 }, implicitHydrogens: 0, hybridization: 'sp2' },
    { id: 'o2', element: 'O', position: { x: 200, y: 100 }, implicitHydrogens: 1, hybridization: 'sp3' }
  ],
  edges: [
    { id: 'b1', from: 'c1', to: 'c2', bondOrder: 1, bondType: 'sigma' },
    { id: 'b2', from: 'c2', to: 'o1', bondOrder: 2, bondType: 'pi-system' },
    { id: 'b3', from: 'c2', to: 'o2', bondOrder: 1, bondType: 'sigma' }
  ]
};
// Expected SMILES: "CC(=O)O"

/**
 * Run all example tests
 */
export function runSMILESTests() {
  console.log('=== SMILES Generation Tests ===\n');

  const examples = [
    { name: 'Methane', graph: methaneGraph, expected: 'C' },
    { name: 'Ethane', graph: ethaneGraph, expected: 'CC' },
    { name: 'Propane', graph: propaneGraph, expected: 'CCC' },
    { name: 'Ethanol', graph: ethanolGraph, expected: 'CCO' },
    { name: 'Ethene', graph: etheneGraph, expected: 'C=C' },
    { name: 'Acetylene', graph: acetylenGraph, expected: 'C#C' },
    { name: 'Isobutane', graph: isobutaneGraph, expected: 'CC(C)C' },
    { name: 'Benzene', graph: benzeneGraph, expected: 'c1ccccc1' },
    { name: 'Acetic Acid', graph: aceticAcidGraph, expected: 'CC(=O)O' }
  ];

  for (const example of examples) {
    const generated = generateSMILES(example.graph);
    const valid = isValidSMILES(generated);
    const match = generated === example.expected ? '✓' : '✗';

    console.log(`${example.name}:`);
    console.log(`  Expected: ${example.expected}`);
    console.log(`  Generated: ${generated}`);
    console.log(`  Valid: ${valid ? 'Yes' : 'No'}`);
    console.log(`  Match: ${match}\n`);
  }

  console.log('=== Formula-based SMILES Fallback ===\n');
  const formulas = ['CH4', 'C2H6', 'C6H6', 'CH3OH', 'C2H4O2'];
  for (const formula of formulas) {
    const smiles = getSMILESByFormula(formula);
    console.log(`${formula} → ${smiles}`);
  }
}

// Uncomment to run tests:
// runSMILESTests();
