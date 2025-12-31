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

## Documentation Structure

This project's documentation is organized as follows:

**Root Documentation:**
- **[README.md](./README.md)** - Project readme (public-facing)
- **[CLAUDE.md](./CLAUDE.md)** (this file) - Project overview and structure

**Feature Documentation** (`docs/features/`):
- **[AUTH.md](./docs/features/AUTH.md)** - Authentication setup and configuration
- **[PERIODIC_TABLE.md](./docs/features/PERIODIC_TABLE.md)** - Periodic table and element details
- **[COMPOUND.md](./docs/features/COMPOUND.md)** - Compound builder specifications
- **[ORGANIC.md](./docs/features/ORGANIC.md)** - Organic chemistry builder specifications

**API Documentation:**
- **[API.md](./docs/API.md)** - Complete API reference

**User Guides** (`docs/guides/`):
- **[COMPOUND_BONDING_GUIDE.md](./docs/guides/COMPOUND_BONDING_GUIDE.md)** - Detailed bonding system guide

**Archive** (`docs/archive/`):
- Implementation logs and verification reports

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
│       └── organic-structures/{route.ts, [id]/route.ts}  # Phase 9
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
│   │   │   ├── {TemplateSeedSelector, CarbonGraphCanvas, StructureModificationTools, FunctionalGroupPalette, ValencyValidator, FormulaDeriver}.tsx
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

## Setup & Configuration

### Environment Variables

Create a `.env.local` file with:

```
MONGODB_URI=your_mongodb_connection_string
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_here
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Seed database with elements
npm run seed
```

## API Routes

### Elements API
- `GET /api/elements` → All 118 elements (basic props)
- `GET /api/elements/[symbol]` → Full element details
- `POST /api/elements/seed` → Seed database (admin)

### Compounds API
- `GET /api/compounds` → All compounds
- `POST /api/compounds` (auth) → Create compound with positions, bonds, factors
- `GET /api/compounds/[id]` → Specific compound details
- `PUT /api/compounds/[id]` (auth, owner) → Update compound
- `DELETE /api/compounds/[id]` (auth, owner) → Delete compound

### Organic Structures API (Phase 9)
- `GET /api/organic-structures` → All public organic structures (with filters: category, functionalGroups, search)
- `POST /api/organic-structures` (auth) → Create organic structure with carbon graph
- `GET /api/organic-structures/[id]` → Full organic structure details
- `PUT /api/organic-structures/[id]` (auth, owner) → Update structure
- `DELETE /api/organic-structures/[id]` (auth, owner) → Delete structure
- `GET /api/organic-structures/templates` → Predefined structure templates

## Implementation Phases

**Phase 1-2 (✓):** Setup, MongoDB, Mongoose models, seed script

**Phase 3 (✓):** API routes (elements, compounds)

**Phase 4 (✓):** Periodic table grid, element cards, animations

**Phase 5 (✓):** Element detail pages, 3D Bohr model

**Phase 6 (✓):** Auth (NextAuth + Google), compound CRUD

**Phase 7 (✓):** Interactive compound builder: @dnd-kit, canvas, bonding intelligence, valency validation, auto-spread, external factors

**Phase 8 (✓):** Polish, error handling, responsive design, unit testing (Jest)

**Phase 9 (NEW):** Organic Chemistry Builder (Template-Seed + Structural Modification)
- See [ORGANIC.md](./ORGANIC.md) for complete specifications
- Template seed system: structural scaffolds (NOT final molecules)
- Carbon graph editor with real-time validation
- Derived properties: molecular formula, weight, functional groups
- SMILES generation (optional)
- 3D preview (optional)

## Resources

### General
- [Periodic Table JSON](https://github.com/Bowserinator/Periodic-Table-JSON)
- [Three.js docs](https://threejs.org/docs)
- [R3F docs](https://docs.pmnd.rs/react-three-fiber)
- [Google Arts Experiments](https://artsexperiments.withgoogle.com/periodic-table/)

### Organic Chemistry (Phase 9)
- [RDKit.js](https://github.com/rdkit/rdkit-js) - Chemistry toolkit for SMILES parsing
- [Kekule.js](https://github.com/partridgejiang/Kekule.js) - Alternative JS chemistry library
- [OpenBabel](https://openbabel.org/) - Chemical file format conversion reference
- [SMILES Tutorial](https://www.daylight.com/dayhtml/doc/theory/theory.smiles.html) - SMILES notation guide

---

*Last Updated: Dec 22, 2025 - Documentation split into focused files*
