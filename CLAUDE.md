# Reaction Hub - Interactive Periodic Table

## Project Overview
Interactive periodic table and compound management app with 3D visualizations, inspired by Google Arts Experiments.

**Features:**
- Landing page → Periodic Table (118 elements) + Compounds + Organic Chemistry
- Element detail pages with 3D Bohr model visualizations
- Compound browsing (public) and creation (auth required)
- Phase 3: Drag-drop compound builder with smart bonding, valency validation, element repositioning
- Phase 9: Organic Chemistry library with common structures (benzene, functional groups), 2D structure visualization

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

// Phase 9: Organic Chemistry
interface OrganicStructure {
  id: string; name: string; iupacName?: string; commonName?: string;
  category: "alkane" | "alkene" | "alkyne" | "aromatic" | "alcohol" | "aldehyde" | "ketone" |
    "carboxylic-acid" | "ester" | "ether" | "amine" | "amide" | "halide" | "custom";

  // Structure representation
  smiles: string; // Simplified Molecular Input Line Entry System
  molFile?: string; // MDL Molfile format (for 2D/3D rendering)
  inchi?: string; // International Chemical Identifier

  // Atoms and bonds (similar to Compound but with organic-specific features)
  atoms: {
    id: string; element: string; charge?: number; radical?: boolean;
    position: { x: number; y: number; z?: number }; // 2D or 3D coordinates
    hybridization?: "sp" | "sp2" | "sp3"; // Orbital hybridization
  }[];

  bonds: {
    id: string; from: string; to: string;
    type: "single" | "double" | "triple" | "aromatic" | "dative";
    stereo?: "wedge" | "dash" | "wavy"; // Stereochemistry indicators
  }[];

  // Functional groups present
  functionalGroups: {
    name: string; // "hydroxyl", "carbonyl", "amino", etc.
    position: number[]; // Atom indices
  }[];

  // Chemical properties
  molecularFormula: string; // C₆H₁₂O₆
  molecularWeight: number; // g/mol
  logP?: number; // Lipophilicity (partition coefficient)
  pKa?: number; // Acidity constant

  // Template information (for predefined structures)
  isTemplate: boolean;
  templateCategory?: "benzene-derivatives" | "alkanes" | "cyclic" | "functional-groups";

  // Visual rendering data
  renderData?: {
    bondLength: number; // Standard bond length in pixels
    angle: number; // Standard bond angle (120° for benzene, 109.5° for sp3)
    showHydrogens: boolean; // Display implicit hydrogens
    colorScheme: "cpk" | "element" | "custom"; // CPK coloring, element-based, or custom
  };

  // User metadata
  createdBy: string; createdByName: string;
  isPublic: boolean; // Can other users view this structure
  tags?: string[]; // For categorization and search
  createdAt: Date; updatedAt: Date;
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

**Create Organic Structure (Phase 9):** Advanced organic molecule builder

**Layout:**
- Left panel: Templates and building blocks
  - Common structures: Benzene, Cyclohexane, Naphthalene, etc.
  - Functional groups: -OH, -COOH, -NH₂, -CHO, -CO-, -X (halogens)
  - Carbon chains: Linear (C1-C20), branched, cyclic
  - Quick insert buttons
- Center canvas: 2D structure editor
  - Click-to-place atoms (C, H, O, N, S, P, halogens)
  - Click-to-bond (single, double, triple, aromatic)
  - Drag to adjust bond angles
  - Automatic hybridization detection (sp, sp2, sp3)
  - Show/hide hydrogens toggle
  - Stereochemistry tools (wedge, dash bonds for chirality)
  - Ring templates (3-8 membered rings)
- Right panel: Structure properties
  - Molecular formula (auto-calculated)
  - Molecular weight (auto-calculated)
  - SMILES notation (auto-generated)
  - Functional groups detected
  - IUPAC name suggestions (if possible)
  - 3D preview (optional, using Three.js)
- Bottom: Save structure, export options (PNG, SVG, MOL file)

**Workflow:** Select template OR build from scratch → place atoms → create bonds → add functional groups → adjust stereochemistry → validate structure → name → save

**Tech:** Canvas API or SVG for 2D drawing, RDKit.js (or similar) for SMILES generation and validation, Three.js for optional 3D preview

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

## Organic Chemistry Features (Phase 9)

**Structure Categories:**
- **Hydrocarbons**: Alkanes (C-C single), Alkenes (C=C double), Alkynes (C≡C triple), Aromatic (benzene rings)
- **Oxygen-containing**: Alcohols (-OH), Aldehydes (-CHO), Ketones (C=O), Carboxylic acids (-COOH), Esters (-COO-), Ethers (C-O-C)
- **Nitrogen-containing**: Amines (-NH₂, -NH-, -N<), Amides (-CONH₂), Nitriles (-CN)
- **Halogen-containing**: Alkyl halides (C-X where X = F, Cl, Br, I)
- **Custom**: User-created structures

**Predefined Templates:**
- **Benzene ring** (C₆H₆) - 6-membered aromatic ring with alternating double bonds
- **Cyclohexane** (C₆H₁₂) - 6-membered saturated ring (chair/boat conformations)
- **Naphthalene** - Fused benzene rings
- **Common functional groups**: Hydroxyl, Carbonyl, Carboxyl, Amino, Methyl, Ethyl, Phenyl
- **Linear alkanes**: Methane (CH₄), Ethane (C₂H₆), Propane (C₃H₈), up to C₂₀
- **Common pharmaceuticals**: Aspirin, Caffeine, Ibuprofen (as examples)

**Bonding Rules (Organic-specific):**
- Carbon: 4 bonds (tetrahedral sp3, trigonal sp2, linear sp)
- Oxygen: 2 bonds (bent sp3 or linear sp2)
- Nitrogen: 3 bonds (pyramidal sp3 or trigonal sp2)
- Hydrogen: 1 bond
- Aromatic resonance: Benzene bonds shown as circle inside ring or alternating single/double

**Structure Validation:**
- Valency checking (ensure all atoms have correct bond count)
- Aromaticity detection (Hückel's rule: 4n+2 π electrons)
- Stereochemistry validation (chiral centers marked with wedge/dash bonds)
- SMILES generation to verify structure is chemically valid

**Rendering Options:**
- **2D Skeletal Formula**: Standard organic chemistry representation (no C labels, implicit H)
- **2D Full Structure**: Show all atoms including carbons and hydrogens
- **3D Ball-and-Stick**: Three.js 3D view with rotatable molecule
- **Space-Filling**: van der Waals radii representation

**Search & Filters:**
- By name (IUPAC, common name)
- By functional groups (structures containing -OH, -COOH, etc.)
- By molecular formula (C₆H₁₂O₆)
- By category (alkane, aromatic, etc.)
- By molecular weight range
- By creator (my structures, public structures)

## Visual Specifications

**3D Bohr Model:** Nucleus (sized by atomic#) + electron shells (period count) + orbiting electrons, drag-rotate, scroll-zoom

**Element Bubbles (Phase 3):** Circular, `radius=sqrt(atomicMass)*scale`, category-colored, draggable, collision-prevented
- States: default, hover (scale 1.05), selected (glow), dragging (0.7 opacity)
- Bonds: connect bubble edges, update dynamically on drag
- Valency badge: "2/4" (used/total), color-coded (green/yellow/red)

**Organic Structure Rendering (Phase 9):**
- **Atoms**: CPK color scheme (C=black/gray, O=red, N=blue, H=white, S=yellow, P=orange, halogens=green/purple)
- **Bonds**: Single (solid line), Double (parallel lines), Triple (3 parallel lines), Aromatic (circle in ring or dashed)
- **Stereochemistry**: Wedge bonds (coming out), Dash bonds (going in), Wavy bonds (unknown)
- **Canvas**: 800x600px with zoom/pan, grid background (optional)
- **Atom labels**: Show for heteroatoms (O, N, S, etc.), hide carbons in skeletal formula
- **Bond angles**: 120° for sp2 (benzene), 109.5° for sp3 (tetrahedral), 180° for sp (linear)
- **Ring rendering**: Benzene circle inside hexagon, or alternating single/double bonds

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
**Phase 9 (NEW):** Organic Chemistry Library
  - Create OrganicStructure model with SMILES, atoms, bonds, functional groups
  - API routes: `GET/POST /api/organic`, `GET /api/organic/[id]`, `GET /api/organic/templates`
  - Organic structures page: `/organic-chemistry` with grid view, filters, search
  - Create structure page: `/organic-chemistry/create` with 2D canvas editor
  - Structure detail page: `/organic-chemistry/[id]` with 2D/3D views, properties
  - Components: StructureCanvas, AtomPalette, BondTools, TemplateSelector
  - Predefined templates: Benzene, alkanes, functional groups (stored in organic-templates.json)
  - SMILES parser and generator (using RDKit.js or Kekule.js library)
  - 2D structure rendering using Canvas API or SVG with automatic layout
  - Optional 3D preview using Three.js with conformer generation
  - Stereochemistry support (wedge/dash bonds, chiral centers)
  - Functional group detection and highlighting
  - Export options: PNG, SVG, MOL file, SMILES string

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

## Organic Chemistry Implementation Notes (Phase 9)

**Libraries to Consider:**
1. **RDKit.js** (Recommended) - Full-featured chemistry toolkit, SMILES parsing, structure validation
2. **Kekule.js** - Pure JavaScript, 2D/3D rendering, structure editor components
3. **OpenChemLib** - Fast, lightweight, good for structure rendering
4. **JSME** - Molecule editor widget (may need integration work)

**SMILES Examples:**
- Benzene: `c1ccccc1` or `C1=CC=CC=C1`
- Ethanol: `CCO`
- Acetic acid: `CC(=O)O`
- Aspirin: `CC(=O)Oc1ccccc1C(=O)O`
- Caffeine: `CN1C=NC2=C1C(=O)N(C(=O)N2C)C`

**Development Approach:**
1. Start with template browser (predefined structures stored as SMILES)
2. Implement 2D structure viewer (render SMILES to 2D canvas)
3. Add basic editor (click to add atoms/bonds, generate SMILES)
4. Implement functional group detection
5. Add 3D preview (optional, using conformer generation)
6. Implement save/load from MongoDB
7. Add search and filtering
8. Implement stereochemistry tools (advanced)

*Last Updated: Dec 12, 2025 - Added Phase 9: Organic Chemistry library with structure editor, templates, and 2D/3D rendering*
