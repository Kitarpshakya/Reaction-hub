# Reaction Hub - Interactive Periodic Table

## Project Overview
Interactive periodic table and compound management app with 3D visualizations, inspired by Google Arts Experiments.

**Features:**
- Landing page → Periodic Table (118 elements) + Compounds + Organic Chemistry
- Element detail pages with 3D Bohr model visualizations
- Compound browsing (public) and creation (auth required)
- Phase 3: Drag-drop compound builder with smart bonding, valency validation, element repositioning
- Phase 9: Organic Chemistry builder with template-seed system, carbon graph editing, structural modification

**Tech Stack:** Next.js 15, TypeScript, React 19, Tailwind CSS, Framer Motion, Three.js, MongoDB, NextAuth.js, @dnd-kit/core, RDKit.js (for structure rendering)

## Project Structure

```
reaction-hub/
├── app/
│   ├── page.tsx                           # Landing page
│   ├── layout.tsx, globals.css
│   ├── periodic-table/page.tsx            # Periodic table grid
│   ├── elements/[symbol]/page.tsx         # Element detail page
│   ├── compounds/
│   │   ├── page.tsx                       # Compounds list (public)
│   │   └── create/page.tsx                # Create compound (auth required)
│   ├── organic-chemistry/                 # Phase 9
│   │   ├── page.tsx                       # Organic structures library (public)
│   │   ├── create/page.tsx                # Create organic structure (auth required)
│   │   └── [id]/page.tsx                  # Structure detail page
│   ├── login/page.tsx                     # Google OAuth login
│   └── api/
│       ├── auth/[...nextauth]/route.ts    # NextAuth config
│       ├── elements/{route.ts, [symbol]/route.ts, seed/route.ts}
│       ├── compounds/{route.ts, [id]/route.ts}
│       └── organic/{route.ts, [id]/route.ts}  # Phase 9
├── components/
│   ├── layout/{Header, Footer}.tsx
│   ├── home/{Hero, FeatureCard, LandingPageLinks}.tsx
│   ├── periodic-table/{PeriodicTableGrid, ElementCard, TableLegend, TableHeader}.tsx
│   ├── element-detail/{ElementHero, BohrModel3D, PropertyGrid, IsotopesSection, DiscoverySection, NavigationButtons}.tsx
│   ├── compounds/
│   │   ├── {CompoundsList, CompoundCard, CompoundFilters}.tsx
│   │   └── create/  # Phase 3
│   │       ├── {ElementsPanel, CompoundCanvas, ElementBubble, BondConnector, ExternalFactors, CompoundDetails}.tsx
│   ├── organic-chemistry/  # Phase 9
│   │   ├── {OrganicStructuresList, StructureCard, StructureFilters}.tsx
│   │   ├── create/
│   │   │   ├── {FunctionalGroupsPanel, StructureCanvas, MoleculeRenderer, BondingTools}.tsx
│   │   ├── {StructureViewer2D, StructureViewer3D, PropertyDisplay}.tsx
│   │   └── templates/
│   │       └── {BenzeneTemplate, AlkaneTemplates, FunctionalGroupTemplates}.tsx
│   ├── auth/{LoginButton, UserMenu, AuthGuard}.tsx
│   └── ui/{Card, Badge, Button, Skeleton}.tsx
├── lib/
│   ├── db/{mongodb.ts, mongodb-client.ts, models/{Element, User, Compound, OrganicStructure}.ts}
│   ├── auth/{nextauth.config.ts, auth-helpers.ts}
│   ├── data/{elements.json, organic-templates.json}  # Phase 9
│   ├── utils/{element-helpers, compound-helpers, organic-helpers}.ts  # Phase 9
│   └── types/{element, compound, user, organic}.ts  # Phase 9
├── hooks/
│   └── {useElements, useElement, useCompounds, useCompound, useOrganicStructures, useAuth}.ts  # Phase 9
├── scripts/seed.js
└── styles/periodic-table.css
```

## Database Schema

### Element Model
```typescript
interface Element {
  id: string; atomicNumber: number; symbol: string; name: string; atomicMass: number;
  category: ElementCategory; group: number | null; period: number; block: string;
  electronConfiguration: string; electronsPerShell: number[];
  phase: string; meltingPoint: number | null; boilingPoint: number | null; density: number | null;
  electronegativity: number | null; atomicRadius: number | null; ionizationEnergy: number | null;
  oxidationStates: number[]; valency: number | number[]; maxBonds: number;
  discoveredBy: string | null; yearDiscovered: number | null;
  isRadioactive: boolean; halfLife: string | null;
  color: string; summary: string; isotopes?: Isotope[];
}

type ElementCategory = "alkali-metal" | "alkaline-earth-metal" | "transition-metal" |
  "post-transition-metal" | "metalloid" | "nonmetal" | "halogen" | "noble-gas" | "lanthanide" | "actinide" | "unknown";
```

### User & Compound Models
```typescript
interface User {
  id: string; email: string; name: string | null; image: string | null;
  provider: string; providerId: string; createdAt: Date; updatedAt: Date;
}

interface Compound {
  id: string; name: string; formula: string; molarMass: number; description: string | null;
  elements: { elementId: string; symbol: string; count: number; position?: { x: number; y: number } }[];
  bonds?: { id: string; fromElementId: string; toElementId: string;
    bondType: "single" | "double" | "triple" | "ionic" | "covalent" | "metallic" }[];
  externalFactors?: { temperature?, pressure?, catalyst?, heat?, light? };
  canvasData?: { width: number; height: number; zoom: number; offset: { x: number; y: number } };
  createdBy: string; createdByName: string; createdAt: Date; updatedAt: Date;
}

// Phase 9: Organic Chemistry (Template-Seed + Structural Modification System)
interface OrganicStructure {
  id: string;
  name: string;
  iupacName?: string;
  commonName?: string;

  // Template origin (seed used to start construction)
  originTemplate?: {
    type: "alkane-chain" | "alkene-chain" | "alkyne-chain" | "fatty-acid" | "alcohol" |
          "aromatic-ring" | "cycloalkane" | "carbonyl" | "none";
    initialParams?: { chainLength?: number; ringSize?: number };
  };

  // Carbon graph structure (primary representation)
  carbonGraph: {
    nodes: {
      id: string; // unique node identifier
      element: "C" | "O" | "N" | "S" | "P" | "F" | "Cl" | "Br" | "I"; // organic elements only
      position: { x: number; y: number }; // 2D skeletal coordinates
      hybridization: "sp" | "sp2" | "sp3"; // auto-calculated from bonds
      implicitHydrogens: number; // auto-calculated to satisfy valency
    }[];

    edges: {
      id: string;
      from: string; // node id
      to: string; // node id
      bondOrder: 1 | 2 | 3; // single, double, triple
      bondType: "sigma" | "pi-system" | "aromatic"; // aromatic for benzene resonance
      stereo?: "wedge" | "dash" | "wavy"; // 3D stereochemistry representation
    }[];
  };

  // Functional groups (detected subgraphs)
  functionalGroups: {
    name: "hydroxyl" | "carbonyl" | "carboxyl" | "amino" | "nitro" | "alkyl-halide" |
          "ester" | "ether" | "amide" | "nitrile" | "aldehyde" | "ketone";
    nodeIds: string[]; // carbon graph nodes that form this group
    attachmentPoint: string; // primary carbon node where group attaches
  }[];

  // Derived properties (auto-calculated from carbonGraph)
  derived: {
    molecularFormula: string; // Hill notation: CₓHᵧOᵤNᵥ...
    molecularWeight: number; // g/mol
    totalAtoms: number;
    carbonCount: number;
    unsaturationDegree?: number; // rings + double bonds + 2×triple bonds
    smiles?: string; // generated SMILES string
  };

  // Validation state
  validation: {
    isValid: boolean;
    errors: string[]; // "Carbon node C5 exceeds valency (5 bonds)"
    warnings: string[]; // "Unusual bond angle detected at C3"
  };

  // Visual rendering preferences
  renderSettings: {
    showHydrogens: boolean; // display implicit H atoms
    showCarbonLabels: boolean; // show 'C' labels in skeletal formula
    bondLength: number; // pixels
    colorScheme: "cpk" | "monochrome"; // CPK or black/white
  };

  // User metadata
  createdBy: string;
  createdByName: string;
  isPublic: boolean;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

## Page Designs

**Landing:** Header + Hero + 3 feature cards (Periodic Table, Compounds, Organic Chemistry) with hover lift effects

**Periodic Table:** 18-column CSS Grid, element cards (atomic#, symbol, name, mass), category colors, legend, staggered animations

**Element Detail:** Element card + 3D Bohr model, property grids (Physical, Chemical, Discovery, Isotopes), prev/next navigation

**Compounds:** Public grid of compound cards, "Create" button (auth required)

**Create Compound (Phase 3):** 3-panel interface for single compound creation

**Organic Chemistry Library (Phase 9):** Public gallery of organic structures

**Layout:**
- Header with category filters (Alkanes, Alkenes, Aromatic, Functional Groups, etc.)
- Grid of structure cards showing:
  - 2D molecular structure (SVG rendering)
  - IUPAC name + common name
  - Molecular formula and weight
  - Functional groups badges
  - Creator and creation date
- Search bar with autocomplete (name, formula, SMILES)
- "Create Structure" button (auth required)
- Template browser (benzene, cyclohexane, common functional groups)

**Create Organic Structure (Phase 9):** Template-Seed + Structural Modification Builder

**Layout:**
- Left panel: Template Seeds (NOT final molecules)
  - **Structural Scaffolds:**
    - Alkane Chain (C₁-C₂₀) - linear carbon skeleton
    - Alkene Chain - with one C=C, position editable
    - Alkyne Chain - with one C≡C, position editable
    - Fatty Acid Backbone - HOOC-(CH₂)ₙ-CH₃, n editable
    - Alcohol Skeleton - (CH₂)ₙ-OH, n editable
    - Aromatic Ring - benzene ring (C₆)
    - Cycloalkane - saturated ring (C₃-C₈)
    - Carbonyl Backbone - C=O with editable attachments
  - Each template is a STARTING POINT, not a final structure
  - Templates initialize carbon graph, user modifies after

- Center canvas: Carbon Graph Editor
  - **Primary structure (carbon skeleton):**
    - Carbon nodes connected by bonds
    - Click carbon node to select
    - Click bond to change order (single ⇄ double ⇄ triple)
  - **Modification tools:**
    - **Extend**: Add carbon to terminal position
    - **Shorten**: Remove terminal carbon
    - **Branch**: Add carbon branch at selected node
    - **Cyclize**: Connect two nodes to form ring
    - **Unsaturate**: Insert double/triple bond
    - **Saturate**: Remove double/triple bond
  - **Functional group attachment:**
    - Select carbon node → attach -OH, -COOH, -NH₂, -NO₂, -X (halogen)
    - Groups replace implicit hydrogens
    - Cannot exceed carbon valency (max 4 bonds)
  - **Real-time validation:**
    - Valency counter on each carbon node (e.g., "3/4")
    - Red highlight if valency exceeded
    - Implicit H count auto-adjusts
  - **Visual feedback:**
    - Skeletal formula rendering (carbons at vertices)
    - Show/hide implicit hydrogens toggle
    - Bond angles auto-adjust (sp³: 109.5°, sp²: 120°, sp: 180°)

- Right panel: Derived Properties (Auto-calculated)
  - Molecular formula (Hill notation: CₓHᵧ...)
  - Molecular weight (g/mol)
  - Carbon count
  - Functional groups detected (auto-identified)
  - Unsaturation degree
  - Valency validation status
  - SMILES string (if valid)

- Bottom: Save structure, clear canvas, undo/redo

**Workflow:**
1. Select template seed (e.g., "Fatty Acid")
2. Modify carbon skeleton (extend chain, add branches, add double bonds)
3. Attach functional groups (e.g., add -OH to create hydroxy fatty acid)
4. Validate structure (all valencies satisfied)
5. Name structure
6. Save

**Example Workflows:**

*Building Fatty Acids from "Fatty Acid" Template:*
- Template: "Fatty Acid" → HOOC-(CH₂)₁₆-CH₃ (default 16-carbon chain)
- Extend chain: Add 2 carbons → HOOC-(CH₂)₁₈-CH₃ (stearic acid, C₁₈H₃₆O₂)
- Add double bond: At C9-C10 → HOOC-(CH₂)₇-CH=CH-(CH₂)₇-CH₃ (oleic acid, C₁₈H₃₄O₂)
- Add 2nd double bond: At C12-C13 → HOOC-(CH₂)₇-CH=CH-CH₂-CH=CH-(CH₂)₄-CH₃ (linoleic acid, C₁₈H₃₂O₂)
- Add -OH group: At C12 → HOOC-(CH₂)₁₀-CHOH-(CH₂)₅-CH₃ (ricinoleic acid, C₁₈H₃₄O₃)

*Building Aromatics from "Aromatic Ring" Template:*
- Template: "Aromatic Ring" → Benzene (C₆H₆)
- Attach -CH₃: At C1 → Toluene (C₇H₈)
- Attach -OH: At C1 → Phenol (C₆H₆O)
- Attach -NH₂: At C1 → Aniline (C₆H₇N)
- Attach -NO₂: At C1 → Nitrobenzene (C₆H₅NO₂)
- Multi-substitute: -OH at C1, -COOH at C2 → Salicylic acid (C₇H₆O₃)

*Building Alcohols from "Alkane Chain" Template:*
- Template: "Alkane Chain" (C₃) → Propane (C₃H₈)
- Attach -OH: At C2 → Isopropanol (C₃H₈O)
- Branch: Add -CH₃ at C2 → 2-methylpropane (C₄H₁₀)
- Attach -OH: At C2 of branched → tert-butanol (C₄H₁₀O)

---

**Layout:**
- Left: Searchable elements panel (118 draggable element cards)
- Center: Canvas with drag-drop, zoom/pan, collision detection
  - Element bubbles: `radius = sqrt(atomicMass) * scaleFactor`, freely repositionable
  - Click-to-connect bonding with auto bond type suggestion (O-O→O=O, N-N→N≡N)
  - 6 bond types: single, double, triple, ionic, covalent, metallic
  - Smart validation: valency tracking, warnings (red/yellow/green)
  - Auto-spread button: distribute bonded elements optimally
  - Dynamic bond rendering: lines update in real-time as elements move
- Bottom: External factors (temp, pressure, catalyst) + compound details (name, auto-formula, auto-molar mass)

**Workflow:** Drag elements → position → bond → validate → save → clear → repeat
**Tech:** @dnd-kit/core, SVG/Canvas bonds, Zustand state, collision detection

## Chemical Bonding Intelligence (Phase 3)

**Bond Type Suggestions:** H-H→single, O-O→double, N-N→triple, halogens→single, Metal+Nonmetal→ionic (EN diff >1.7)

**Valency Rules:** H(1), C(4), N(3,5), O(2), Halogens(1), S(2,4,6), P(3,5), Alkali(1), Alkaline-earth(2), Noble gases(0)

**Bond Counting:** Single=1, Double=2, Triple=3

**Validation:**
- Red: Valency exceeded, noble gas bonds, impossible combinations
- Yellow: Rare but possible (SF₆), proceed with warning
- Green: Chemically stable, common patterns

**Logic:** Check diatomic (O→double, N→triple), EN difference (>1.7→ionic), default→single

## Organic Chemistry Builder - Canonical Specification (Phase 9)

### Core Philosophy (Non-Negotiable)

**THIS SYSTEM IS NOT:**
- A molecule template selector
- A functional-group sticker tool
- A linear chain decorator

**THIS SYSTEM IS:**
- A **carbon-skeleton graph editor**
- Based on **organic chemistry topology**
- Where **all properties are derived, never stored**

### Two-Step User Model

#### Step 1: Template Seed (NOT a Molecule)

Templates are **INITIAL GRAPH SEEDS**, not final molecules.

A template defines:
- Initial carbon topology
- Mandatory functional backbone (if any)
- Allowed mutation space

**Templates DO NOT:**
- Lock the molecule
- Prevent future mutations
- Define final formula

**Example:**
- "Fatty Acid" template ≠ one specific fatty acid
- It is: **HOOC-(CH₂)ₙ-CH₃** where **n is editable**
- Creates initial graph structure
- User mutates topology to build: palmitic acid, stearic acid, oleic acid, linoleic acid, etc.

#### Step 2: Structural Mutation

User edits the molecule by modifying the **GRAPH**.

Operations mutate topology:
- Extend chain
- Shorten chain
- Branch carbon
- Cyclize
- Change bond order
- Replace substituent
- Oxidize/reduce carbon

**NO operation attaches labels.**
**EVERY operation rewires atoms and bonds.**

### Template Catalog (Graph Seeds)

**Alkane Chain**
- Creates N carbon nodes, all single-bonded
- Length variable (1-20 carbons)

**Alkene Chain**
- Same as alkane, with ONE C=C bond
- Bond position is mutable

**Alkyne Chain**
- Same as alkane, with ONE C≡C bond
- Bond position is mutable

**Fatty Acid**
- HOOC-(CH₂)ₙ-CH₃
- Includes REQUIRED carboxyl carbon
- Chain length variable

**Aromatic Ring**
- Benzene ring graph (6 carbons, alternating bonds)
- Ring carbons locked as aromatic

**Cycloalkane**
- Saturated ring (C₃-C₈)
- Ring size variable

**Blank Canvas**
- Start with single carbon, build from scratch

### Structural Modification Rules

**Carbon Skeleton Operations:**

1. **Extend**
   - Add carbon atom to any terminal position
   - New carbon starts with single bond, valency 1/4
   - User can then add more bonds or functional groups

2. **Shorten**
   - Remove terminal carbon atom
   - Only valid if carbon has ≤1 bond to skeleton
   - Cannot remove if it would break ring or create isolated fragment

3. **Branch**
   - Add carbon branch at any non-terminal carbon
   - Branch carbon connects with single bond
   - Validates that parent carbon does not exceed valency 4

4. **Cyclize**
   - Connect two non-adjacent carbon atoms to form ring
   - Valid ring sizes: 3-8 carbons (common), 9+ (strained, show warning)
   - Cannot cyclize if either carbon exceeds valency 4

5. **Unsaturate**
   - Convert C-C single bond → C=C double bond
   - Convert C=C double bond → C≡C triple bond
   - Validates valency does not exceed 4 on either carbon
   - Adjusts implicit hydrogen count automatically

6. **Saturate**
   - Convert C≡C triple bond → C=C double bond
   - Convert C=C double bond → C-C single bond
   - Adds implicit hydrogens to satisfy valency

**Substituent Attachment Operations:**

**CRITICAL: Functional groups are NOT stored. They are DETECTED.**

When attaching a substituent, the system:
1. Adds heteroatom nodes to the graph
2. Creates bonds between carbon and heteroatoms
3. Recalculates implicit hydrogens
4. Re-detects functional groups from graph topology

**Available Substituent Patterns:**

- **Hydroxyl (-OH)**: Adds O node with single bond to C
- **Carbonyl (=O)**: Adds O node with double bond to C
- **Amino (-NH₂)**: Adds N node with single bond to C
- **Nitro (-NO₂)**: Adds N node + 2 O nodes with appropriate bonds
- **Halogen (-X)**: Adds F/Cl/Br/I node with single bond to C

**Operation Constraints:**
- Can only attach if carbon has available valency
- Operation is rejected if valency exceeded
- After attachment, functional group is DETECTED, not stored

### Chemical Model (Mandatory)

**Molecule = Graph**

- Atom = Node
- Bond = Edge with order (1, 2, 3)
- Hydrogens are implicit
- Carbon valence = 4
- Oxygen valence = 2
- Nitrogen valence = 3
- Halogens = 1

**If a mutation violates valence: operation is REJECTED**

| Element | Max Valence | Allowed Bond Configurations |
|---------|-------------|----------------------------|
| C       | 4           | 4 single, OR 1 double + 2 single, OR 1 triple + 1 single, OR 2 double |
| O       | 2           | 1 double, OR 2 single |
| N       | 3           | 3 single, OR 1 double + 1 single, OR 1 triple |
| S       | 2, 4, 6     | 2 single, OR 1 double, OR 4 single, OR 6 single |
| P       | 3, 5        | 3 single, OR 5 single |
| F, Cl, Br, I | 1    | 1 single (terminal only) |
| H       | 1           | 1 single (implicit) |

**Validation Enforcement:**
- If mutation exceeds valency → operation rejected
- No "invalid but accepted" states allowed
- Implicit hydrogens auto-adjust after every mutation
- Real-time valency display: "3/4" (bonds used / max valence)

### Hydrogen Handling

**Implicit Hydrogen Principle:**

- Hydrogens are **NOT** explicit nodes in the carbon graph
- Hydrogen count is **auto-calculated** to satisfy valency
- Formula: `H_count = max_valency - explicit_bonds`

**Examples:**
- Carbon with 2 single bonds → 2 implicit H → CH₂
- Carbon with 1 double bond + 1 single bond → 1 implicit H → CH
- Carbon with 4 bonds → 0 implicit H → C (quaternary carbon)
- Oxygen with 1 single bond → 1 implicit H → OH
- Nitrogen with 2 single bonds → 1 implicit H → NH

**Display Options:**
- **Skeletal formula (default)**: Hide carbons, hide hydrogens, show heteroatoms
- **Show hydrogens**: Display implicit H count as subscript (e.g., CH₃, CH₂, NH₂)
- **Full structure**: Show all atoms including carbon labels

### Derived Data (Read-Only)

**These are ALWAYS computed from the graph:**

- **Molecular Formula**: Calculated by traversing nodes, counting atoms, summing implicit H
- **Molecular Weight**: Sum of atomic weights (explicit atoms + implicit H)
- **Functional Group List**: Pattern-matched subgraphs
- **Saturation Level**: Degree of unsaturation = rings + double bonds + 2×triple bonds
- **Validity**: Boolean result of valency checking

**Formula Generation Algorithm:**
1. Traverse all nodes in graph
2. Count explicit atoms by element
3. For each node, calculate implicit H: `H = max_valency - sum(bond_orders)`
4. Sum all implicit H
5. Format in Hill notation: C, H, then alphabetical

**Example Derivation:**
```
Graph: C-C-C-OH
Nodes: C1, C2, C3, O1
Edges: C1-C2 (order 1), C2-C3 (order 1), C3-O1 (order 1)

Implicit H calculation:
- C1: 4 - 1 = 3 H
- C2: 4 - 2 = 2 H
- C3: 4 - 2 = 2 H
- O1: 2 - 1 = 1 H

Formula: C₃H₈O (propanol)
```

### Aromaticity Rules

**Benzene Resonance:**

- Aromatic rings (benzene) have special bond type: `bondType: "aromatic"`
- Displayed as circle inside hexagon OR alternating single/double bonds
- All ring carbons are sp² hybridized
- Each carbon contributes 1 π electron (total 6 π electrons)
- Satisfies Hückel's rule: 4n+2 π electrons (n=1)

**Aromatic Template Behavior:**
- Benzene template locks ring as aromatic
- Cannot convert aromatic bonds to single bonds (would break aromaticity)
- Can attach substituents to ring carbons (e.g., -OH → phenol, -CH₃ → toluene)
- Functional groups replace one implicit H per carbon

### Functional Group Detection (Critical)

**FUNCTIONAL GROUPS ARE NOT STORED. THEY ARE DETECTED.**

A functional group exists **ONLY IF** its atom pattern exists in the graph.

**Detection Algorithm:**

The system scans the graph for known subgraph patterns:

- **Alcohol**: C-O-H pattern (oxygen with 1 carbon bond, 1 implicit H)
- **Carbonyl**: C=O pattern (oxygen with 1 double bond to carbon)
- **Carboxylic Acid**: C(=O)-O-H pattern (carbonyl + hydroxyl on same carbon)
- **Amine**: C-N pattern with 2 implicit H on N
- **Ester**: C(=O)-O-C pattern (carbonyl with O bridge to another carbon)
- **Ether**: C-O-C pattern (oxygen bridging two carbons, no carbonyl)
- **Aldehyde**: Terminal C=O pattern (carbonyl on terminal carbon)
- **Ketone**: Internal C=O pattern (carbonyl on non-terminal carbon)

**UI Must NEVER Allow:**
- Overlapping groups on same carbon
- Impossible valence states
- Groups to exist without their atom patterns

### Constraints and Limitations

**NOT ALLOWED:**
- Metals (Na, K, Fe, etc.) - organic builder only
- Ionic bonds - covalent only
- Formal charges (Na⁺, Cl⁻) - neutral molecules only
- Free radicals (special cases only, advanced feature)
- Explicit hydrogen nodes (H is always implicit)
- Valency violations (enforced by validation)

**ALLOWED:**
- Carbon, oxygen, nitrogen, sulfur, phosphorus, halogens (F, Cl, Br, I)
- Single, double, triple covalent bonds
- Aromatic resonance (benzene)
- Rings (3-8 carbons common, 9+ with warning)
- Branched structures
- Multiple functional groups per molecule
- Stereochemistry indicators (wedge/dash bonds for chirality)

### Absolute Failure Conditions

**The system FAILS if:**

1. **A group exists without atoms**
   - Functional group detected but corresponding atom pattern missing from graph

2. **Formula does not change after mutation**
   - Mutation applied but derived formula remains identical (indicates mutation didn't execute)

3. **Carbon exceeds valence**
   - Any carbon node has >4 bonds

4. **Molecule can be "invalid but accepted"**
   - System allows user to save/proceed with valency-violating structure

5. **Functional groups are UI state**
   - Groups stored as labels/properties rather than derived from graph topology

6. **Template locks final molecule**
   - User cannot mutate structure after template selection

7. **Formula is editable**
   - User can manually edit molecular formula field

### Output Expectations

**After Building a Structure, the System Provides:**

1. **Carbon graph** (nodes + edges with bond orders) - PRIMARY DATA
2. **Molecular formula** (Hill notation) - DERIVED, READ-ONLY
3. **Molecular weight** (g/mol) - DERIVED, READ-ONLY
4. **Functional groups** (detected list) - DERIVED, READ-ONLY
5. **Validation status** (valid/invalid) - DERIVED, READ-ONLY
6. **SMILES string** (if valid) - DERIVED, READ-ONLY
7. **2D skeletal rendering** - DERIVED from graph
8. **Optional 3D preview** - DERIVED from graph

### Design Goal

**The user must be able to:**

- Start with "Fatty Acid" template → mutate to build oleic acid, linoleic acid, stearic acid, palmitic acid
- Start with "Aromatic Ring" template → mutate to build toluene, phenol, aniline, nitrobenzene, aspirin
- Start with "Alkane Chain" template → mutate to build branched alkanes, alcohols, amines, halides
- Start with any template → produce chemically diverse molecules through graph mutations

## Visual Specifications

**3D Bohr Model:** Nucleus (sized by atomic#) + electron shells (period count) + orbiting electrons, drag-rotate, scroll-zoom

**Element Bubbles (Phase 3):** Circular, `radius=sqrt(atomicMass)*scale`, category-colored, draggable, collision-prevented
- States: default, hover (scale 1.05), selected (glow), dragging (0.7 opacity)
- Bonds: connect bubble edges, update dynamically on drag
- Valency badge: "2/4" (used/total), color-coded (green/yellow/red)

**Organic Structure Rendering (Phase 9):**

**Skeletal Formula (Default):**
- Carbon atoms at vertices (line junctions and terminals)
- Carbon labels hidden (implicit carbons)
- Heteroatoms labeled (O, N, S, P, F, Cl, Br, I)
- Implicit hydrogens hidden unless "Show H" toggled
- Bonds drawn as lines between atom positions

**Node Rendering:**
- **Carbon nodes**: Vertices only (no label in skeletal mode)
  - Quaternary carbon (4 bonds): intersection point
  - Terminal carbon: end of line
  - Valency badge: "3/4" displayed on hover or when selected
- **Heteroatom nodes**: Element symbol + implicit H count
  - Oxygen: "OH", "O" (in ether/carbonyl)
  - Nitrogen: "NH₂", "NH", "N"
  - Others: "SH", "PH₂", "Cl", "Br", etc.

**Bond Rendering:**
- **Single bond**: Solid line
- **Double bond**: Two parallel lines (spacing: 3-4px)
- **Triple bond**: Three parallel lines (spacing: 3-4px)
- **Aromatic bond**: Circle inscribed in benzene ring OR alternating single/double with dashed style
- **Stereochemistry:**
  - Wedge bond (solid triangle): coming out of plane
  - Dash bond (dashed line): going into plane
  - Wavy bond: undefined stereochemistry

**Bond Angles (Auto-calculated):**
- sp³ hybridization: 109.5° (tetrahedral)
- sp² hybridization: 120° (trigonal planar)
- sp hybridization: 180° (linear)
- Ring strain: adjusted for small rings (cyclopropane ~60°)

**Colors:**
- **CPK color scheme:**
  - Carbon: #404040 (dark gray) - shown only in full structure mode
  - Hydrogen: #FFFFFF (white) - shown when "Show H" enabled
  - Oxygen: #FF0000 (red)
  - Nitrogen: #0000FF (blue)
  - Sulfur: #FFFF00 (yellow)
  - Phosphorus: #FFA500 (orange)
  - Fluorine: #90E050 (light green)
  - Chlorine: #1FF01F (green)
  - Bromine: #A62929 (dark red)
  - Iodine: #940094 (purple)
- **Monochrome mode**: All atoms black, bonds black

**Valency Indicators:**
- Green badge: Valency satisfied (e.g., "4/4")
- Yellow badge: Valency satisfied but unusual (e.g., "6/6" on sulfur)
- Red badge: Valency exceeded (e.g., "5/4" on carbon) - invalid structure

**Canvas:**
- Size: 800x600px (responsive)
- Zoom: Scroll to zoom in/out (0.5x to 3x)
- Pan: Click-drag background to pan
- Grid: Optional dotted grid (toggle on/off)
- Background: White or light gray

**Interactive States:**
- **Node hover**: Highlight node, show valency badge
- **Node selected**: Glow effect, show modification menu
- **Bond hover**: Thicken bond, show bond order
- **Bond selected**: Highlight, show bond order change controls

**Colors:**
- **Elements**: Nonmetal #4ECDC4, Noble-gas #95E1D3, Alkali #F38181, Alkaline-earth #FDCB6E, Transition #A29BFE, Post-transition #74B9FF, Metalloid #FD79A8, Halogen #FF7675, Lanthanide #FFEAA7, Actinide #DFE6E9
- **Organic CPK**: C=#404040, H=#FFFFFF, O=#FF0000, N=#0000FF, S=#FFFF00, P=#FFA500, F=#90E050, Cl=#1FF01F, Br=#A62929
- **Theme**: bg-dark #1A1A2E, accent #6C5CE7, organic-accent #00D9FF

## Implementation Phases

**Phase 1-2 (✓):** Setup, MongoDB, Mongoose models, seed script
**Phase 3 (✓):** API routes (elements, compounds)
**Phase 4 (✓):** Periodic table grid, element cards, animations
**Phase 5 (✓):** Element detail pages, 3D Bohr model
**Phase 6 (✓):** Auth (NextAuth + Google), compound CRUD
**Phase 7 (✓):** Interactive compound builder: @dnd-kit, canvas, bonding intelligence, valency validation, auto-spread, external factors
**Phase 8 (✓):** Polish, error handling, responsive design, unit testing (Jest)
**Phase 9 (NEW):** Organic Chemistry Builder (Template-Seed + Structural Modification)
  - Create OrganicStructure model with carbon graph (nodes + edges), derived formula, validation state
  - Template seed system: structural scaffolds (NOT final molecules)
  - API routes: `GET/POST /api/organic`, `GET /api/organic/[id]`, `GET /api/organic/templates`
  - Organic structures page: `/organic-chemistry` with grid view, filters (by functional groups, formula)
  - Create structure page: `/organic-chemistry/create` with carbon graph editor
  - Structure detail page: `/organic-chemistry/[id]` with 2D skeletal rendering, properties
  - Components:
    - TemplateSeedSelector: Browse and select structural scaffolds
    - CarbonGraphCanvas: Interactive carbon graph editor with node/edge manipulation
    - StructureModificationTools: Extend, shorten, branch, cyclize, unsaturate, saturate
    - FunctionalGroupPalette: Attach/remove functional groups
    - ValencyValidator: Real-time valency checking with visual feedback
    - FormulaDeriver: Auto-calculate molecular formula from carbon graph
    - StructureRenderer2D: Skeletal formula rendering (SVG)
  - Template catalog: Alkane chain, alkene chain, alkyne chain, fatty acid, alcohol, aromatic ring, cycloalkane, carbonyl
  - Carbon graph operations: Add/remove nodes, change bond order, attach functional groups
  - Implicit hydrogen calculation: Auto-adjust H count based on valency
  - Functional group detection: Pattern matching on carbon graph subgraphs
  - Derived properties: Molecular formula (Hill notation), molecular weight, unsaturation degree
  - Real-time validation: Valency checking, error/warning messages
  - Optional: SMILES generation (if RDKit.js integrated)
  - Optional: 3D preview using Three.js (conformer generation)
  - Export options: PNG (2D structure), SVG (vector), SMILES string

## Setup & Configuration

**Environment Variables:** MONGODB_URI, NEXTAUTH_URL, NEXTAUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET

**Commands:** `npm install`, `npm run dev`, `npm run build`, `npm run seed`

**API Routes:**
- `GET /api/elements` → All 118 elements (basic props)
- `GET /api/elements/[symbol]` → Full element details
- `GET /api/compounds` → All compounds
- `POST /api/compounds` (auth) → Create compound with positions, bonds, factors
- `GET /api/organic` → All public organic structures (with filters: category, functionalGroups, search)
- `POST /api/organic` (auth) → Create organic structure with SMILES, atoms, bonds
- `GET /api/organic/[id]` → Full organic structure details
- `PUT /api/organic/[id]` (auth, owner only) → Update structure
- `DELETE /api/organic/[id]` (auth, owner only) → Delete structure
- `GET /api/organic/templates` → Predefined structure templates (benzene, alkanes, etc.)

**Grid Positioning:** 18 columns, 10 rows (lanthanides row 9, actinides row 10)

## Authentication

**Google OAuth Setup:** Create project at [console.cloud.google.com](https://console.cloud.google.com/) → OAuth credentials → redirect URI: `http://localhost:3000/api/auth/callback/google`

**NextAuth Config:** `app/api/auth/[...nextauth]/route.ts` with MongoDBAdapter, GoogleProvider, session callbacks

**Protected Routes:** `/compounds/create` and `/organic-chemistry/create` require auth, others public. Use `useSession()` hook for state management.

---

**Resources:**
- [Periodic Table JSON](https://github.com/Bowserinator/Periodic-Table-JSON)
- [Three.js docs](https://threejs.org/docs)
- [R3F docs](https://docs.pmnd.rs/react-three-fiber)
- [Google Arts Experiments](https://artsexperiments.withgoogle.com/periodic-table/)
- [RDKit.js](https://github.com/rdkit/rdkit-js) - Chemistry toolkit for SMILES parsing (Phase 9)
- [Kekule.js](https://github.com/partridgejiang/Kekule.js) - Alternative JS chemistry library (Phase 9)
- [OpenBabel](https://openbabel.org/) - Chemical file format conversion reference
- [SMILES Tutorial](https://www.daylight.com/dayhtml/doc/theory/theory.smiles.html) - SMILES notation guide

## Organic Chemistry Builder - Architecture (Phase 9)

### Data Flow (Mandatory)

```
Template Seed → Graph Initialization → Structural Mutations → Validation → Derived Properties → (Save if valid)
```

**Graph is Primary, Everything Else is Derived:**
- Carbon graph = source of truth
- Formula = derived from graph
- Functional groups = detected from graph
- Molecular weight = calculated from graph
- Validation = computed from graph topology

### Implementation Requirements

**Validation-First Design:**
- Every modification must pass validation BEFORE being applied
- Invalid operations are PREVENTED, not corrected after the fact
- No "invalid but accepted" states

**Mutation Operations (Graph Rewiring):**
- `extendChain(nodeId)` - adds carbon node with single bond
- `shortenChain(nodeId)` - removes terminal carbon node
- `branchCarbon(nodeId)` - adds branch carbon to existing node
- `cyclize(nodeA, nodeB)` - connects two non-adjacent carbons to form ring
- `addDoubleBond(bondId)` - increases bond order (1→2, 2→3)
- `removeDoubleBond(bondId)` - decreases bond order (3→2, 2→1)
- `attachFunctionalGroup(nodeId, groupType)` - adds heteroatom subgraph
- `removeFunctionalGroup(nodeId)` - removes heteroatom subgraph

**Derived Computation Functions:**
- `calculateImplicitHydrogens(node, edges)` - returns H count for node
- `updateImplicitHydrogens(graph)` - recalculates H for all nodes
- `validateValency(graph)` - returns {isValid, errors, warnings}
- `detectFunctionalGroups(graph)` - returns detected group patterns
- `calculateMolecularFormula(graph)` - returns Hill notation string
- `calculateMolecularWeight(graph)` - returns float (g/mol)

**Storage Model:**
```typescript
interface OrganicStructure {
  carbonGraph: {
    nodes: { id, element, position, implicitHydrogens }[]
    edges: { id, from, to, bondOrder, bondType }[]
  }
  derived: {
    molecularFormula: string    // READ-ONLY
    molecularWeight: number      // READ-ONLY
    functionalGroups: string[]   // READ-ONLY (detected)
  }
  validation: {
    isValid: boolean             // READ-ONLY
    errors: string[]             // READ-ONLY
  }
}
```

*Last Updated: Dec 16, 2025 - Organic Chemistry Builder redefined as graph-based mutation system with derived properties*
