# Periodic Table Documentation

## Element Model

```typescript
interface Element {
  id: string;
  atomicNumber: number;
  symbol: string;
  name: string;
  atomicMass: number;
  category: ElementCategory;
  group: number | null;
  period: number;
  block: string;
  electronConfiguration: string;
  electronsPerShell: number[];
  phase: string;
  meltingPoint: number | null;
  boilingPoint: number | null;
  density: number | null;
  electronegativity: number | null;
  atomicRadius: number | null;
  ionizationEnergy: number | null;
  oxidationStates: number[];
  valency: number | number[];
  maxBonds: number;
  discoveredBy: string | null;
  yearDiscovered: number | null;
  isRadioactive: boolean;
  halfLife: string | null;
  color: string;
  summary: string;
  isotopes?: Isotope[];
}

type ElementCategory =
  | "alkali-metal"
  | "alkaline-earth-metal"
  | "transition-metal"
  | "post-transition-metal"
  | "metalloid"
  | "nonmetal"
  | "halogen"
  | "noble-gas"
  | "lanthanide"
  | "actinide"
  | "unknown";
```

## Page Designs

### Landing Page
- Header + Hero section
- 3 feature cards (Periodic Table, Compounds, Organic Chemistry) with hover lift effects
- Responsive layout

### Periodic Table Grid Page

**Layout:**
- 18-column CSS Grid layout
- Element cards displaying:
  - Atomic number
  - Element symbol
  - Element name
  - Atomic mass
- Category-based color coding
- Interactive legend
- Staggered entrance animations

**Grid Positioning:**
- 18 columns, 10 rows
- Lanthanides: row 9
- Actinides: row 10

**Components:**
- `PeriodicTableGrid` - Main grid container
- `ElementCard` - Individual element card
- `TableLegend` - Category legend
- `TableHeader` - Page header with filters

### Element Detail Page

**Layout:**
- Element hero card with key information
- 3D Bohr model visualization
- Property grids:
  - Physical properties
  - Chemical properties
  - Discovery information
  - Isotopes section
- Previous/Next navigation buttons

**Components:**
- `ElementHero` - Element header card
- `BohrModel3D` - Interactive 3D visualization
- `PropertyGrid` - Property display grid
- `IsotopesSection` - Isotopes information
- `DiscoverySection` - Historical discovery info
- `NavigationButtons` - Prev/Next element navigation

## Visual Specifications

### 3D Bohr Model
- Nucleus sized by atomic number
- Electron shells based on period count
- Orbiting electrons animation
- Drag to rotate
- Scroll to zoom

### Element Category Colors

```css
Nonmetal: #4ECDC4
Noble-gas: #95E1D3
Alkali: #F38181
Alkaline-earth: #FDCB6E
Transition: #A29BFE
Post-transition: #74B9FF
Metalloid: #FD79A8
Halogen: #FF7675
Lanthanide: #FFEAA7
Actinide: #DFE6E9
```

### Theme Colors
```css
Background (dark): #1A1A2E
Accent: #6C5CE7
```

## API Routes

### Elements API

**GET `/api/elements`**
- Returns all 118 elements with basic properties
- Used for periodic table grid

**GET `/api/elements/[symbol]`**
- Returns full element details including isotopes
- Used for element detail pages

**POST `/api/elements/seed`**
- Seeds database with element data
- Admin/setup only

## Data Source

**Element Data:** `lib/data/elements.json`

**External Reference:**
- [Periodic Table JSON](https://github.com/Bowserinator/Periodic-Table-JSON)

## Implementation Phases

**Phase 1-2 (✓):** Setup, MongoDB, Mongoose models, seed script
**Phase 3 (✓):** API routes (elements)
**Phase 4 (✓):** Periodic table grid, element cards, animations
**Phase 5 (✓):** Element detail pages, 3D Bohr model

---

*Last Updated: Dec 22, 2025*
