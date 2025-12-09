# Reaction Hub - Interactive Periodic Table

## Project Overview
Interactive periodic table and compound management app with 3D visualizations, inspired by Google Arts Experiments.

**Features:**
- Landing page → Periodic Table (118 elements) + Compounds
- Element detail pages with 3D Bohr model visualizations
- Compound browsing (public) and creation (auth required)
- Phase 3: Drag-drop compound builder with smart bonding, valency validation, element repositioning

**Tech Stack:** Next.js 15, TypeScript, React 19, Tailwind CSS, Framer Motion, Three.js, MongoDB, NextAuth.js, @dnd-kit/core

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
│   ├── login/page.tsx                     # Google OAuth login
│   └── api/
│       ├── auth/[...nextauth]/route.ts    # NextAuth config
│       ├── elements/{route.ts, [symbol]/route.ts, seed/route.ts}
│       └── compounds/{route.ts, [id]/route.ts}
├── components/
│   ├── layout/{Header, Footer}.tsx
│   ├── home/{Hero, FeatureCard, LandingPageLinks}.tsx
│   ├── periodic-table/{PeriodicTableGrid, ElementCard, TableLegend, TableHeader}.tsx
│   ├── element-detail/{ElementHero, BohrModel3D, PropertyGrid, IsotopesSection, DiscoverySection, NavigationButtons}.tsx
│   ├── compounds/
│   │   ├── {CompoundsList, CompoundCard, CompoundFilters}.tsx
│   │   └── create/  # Phase 3
│   │       ├── {ElementsPanel, CompoundCanvas, ElementBubble, BondConnector, ExternalFactors, CompoundDetails}.tsx
│   ├── auth/{LoginButton, UserMenu, AuthGuard}.tsx
│   └── ui/{Card, Badge, Button, Skeleton}.tsx
├── lib/
│   ├── db/{mongodb.ts, mongodb-client.ts, models/{Element, User, Compound}.ts}
│   ├── auth/{nextauth.config.ts, auth-helpers.ts}
│   ├── data/elements.json
│   ├── utils/{element-helpers, compound-helpers}.ts
│   └── types/{element, compound, user}.ts
├── hooks/
│   └── {useElements, useElement, useCompounds, useCompound, useAuth}.ts
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
```

## Page Designs

**Landing:** Header + Hero + 2 feature cards (Periodic Table, Compounds) with hover lift effects

**Periodic Table:** 18-column CSS Grid, element cards (atomic#, symbol, name, mass), category colors, legend, staggered animations

**Element Detail:** Element card + 3D Bohr model, property grids (Physical, Chemical, Discovery, Isotopes), prev/next navigation

**Compounds:** Public grid of compound cards, "Create" button (auth required)

**Create Compound (Phase 3):** 3-panel interface for single compound creation

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

## Visual Specifications

**3D Bohr Model:** Nucleus (sized by atomic#) + electron shells (period count) + orbiting electrons, drag-rotate, scroll-zoom

**Element Bubbles (Phase 3):** Circular, `radius=sqrt(atomicMass)*scale`, category-colored, draggable, collision-prevented
- States: default, hover (scale 1.05), selected (glow), dragging (0.7 opacity)
- Bonds: connect bubble edges, update dynamically on drag
- Valency badge: "2/4" (used/total), color-coded (green/yellow/red)

**Colors:** Nonmetal #4ECDC4, Noble-gas #95E1D3, Alkali #F38181, Alkaline-earth #FDCB6E, Transition #A29BFE, Post-transition #74B9FF, Metalloid #FD79A8, Halogen #FF7675, Lanthanide #FFEAA7, Actinide #DFE6E9, Theme: bg-dark #1A1A2E, accent #6C5CE7

## Implementation Phases

**Phase 1-2 (✓):** Setup, MongoDB, Mongoose models, seed script
**Phase 3:** API routes (elements, compounds)
**Phase 4:** Periodic table grid, element cards, animations
**Phase 5:** Element detail pages, 3D Bohr model
**Phase 6:** Auth (NextAuth + Google), compound CRUD
**Phase 7:** Interactive compound builder: @dnd-kit, canvas, bonding intelligence, valency validation, auto-spread, external factors
**Phase 8:** Polish, error handling, responsive design

## Setup & Configuration

**Environment Variables:** MONGODB_URI, NEXTAUTH_URL, NEXTAUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET

**Commands:** `npm install`, `npm run dev`, `npm run build`, `npm run seed`

**API Routes:**
- `GET /api/elements` → All 118 elements (basic props)
- `GET /api/elements/[symbol]` → Full element details
- `GET /api/compounds` → All compounds
- `POST /api/compounds` (auth) → Create compound with positions, bonds, factors

**Grid Positioning:** 18 columns, 10 rows (lanthanides row 9, actinides row 10)

## Authentication

**Google OAuth Setup:** Create project at [console.cloud.google.com](https://console.cloud.google.com/) → OAuth credentials → redirect URI: `http://localhost:3000/api/auth/callback/google`

**NextAuth Config:** `app/api/auth/[...nextauth]/route.ts` with MongoDBAdapter, GoogleProvider, session callbacks

**Protected Routes:** `/compounds/create` requires auth, others public. Use `useSession()` hook for state management.

---

**Resources:** [Periodic Table JSON](https://github.com/Bowserinator/Periodic-Table-JSON), [Three.js docs](https://threejs.org/docs), [R3F docs](https://docs.pmnd.rs/react-three-fiber), [Google Arts Experiments](https://artsexperiments.withgoogle.com/periodic-table/)

*Last Updated: Dec 5, 2025 - Optimized documentation, added Phase 3 bonding intelligence*
