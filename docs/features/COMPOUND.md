# Compound Builder Documentation

## Compound Model

```typescript
interface Compound {
  id: string;
  name: string;
  formula: string;
  molarMass: number;
  description: string | null;
  elements: {
    elementId: string;
    symbol: string;
    count: number;
    position?: { x: number; y: number };
  }[];
  bonds?: {
    id: string;
    fromElementId: string;
    toElementId: string;
    bondType: "single" | "double" | "triple" | "ionic" | "covalent" | "metallic";
  }[];
  externalFactors?: {
    temperature?: number;
    pressure?: number;
    catalyst?: string;
    heat?: boolean;
    light?: boolean;
  };
  canvasData?: {
    width: number;
    height: number;
    zoom: number;
    offset: { x: number; y: number };
  };
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## Page Designs

### Compounds Library Page

**Layout:**
- Public grid of compound cards
- Each card shows:
  - Compound name
  - Chemical formula
  - Molar mass
  - Creator name
  - Creation date
- "Create" button (requires authentication)

**Components:**
- `CompoundsList` - Grid container
- `CompoundCard` - Individual compound card
- `CompoundFilters` - Filter/search UI

### Create Compound Page (Phase 3)

**Layout: 3-Panel Interface**

**Left Panel: Elements Panel**
- Searchable list of 118 elements
- Draggable element cards
- Filter by category

**Center Panel: Compound Canvas**
- Drag-drop workspace
- Zoom and pan controls
- Element bubbles with collision detection
- Click-to-connect bonding system
- Auto-spread button for optimal element distribution
- Real-time bond rendering

**Bottom Panel:**
- External factors controls (temperature, pressure, catalyst, heat, light)
- Compound details (name input, auto-calculated formula, auto-calculated molar mass)
- Save and Clear buttons

**Components:**
- `ElementsPanel` - Searchable element list
- `CompoundCanvas` - Main canvas workspace
- `ElementBubble` - Draggable element nodes
- `BondConnector` - Bond creation UI
- `ExternalFactors` - External conditions controls
- `CompoundDetails` - Compound metadata form

**Workflow:**
1. Drag elements from panel to canvas
2. Position elements on canvas
3. Click elements to create bonds
4. Validate bonding (valency checking)
5. Add external factors (optional)
6. Name compound
7. Save compound
8. Clear canvas for next compound

**Tech Stack:**
- `@dnd-kit/core` - Drag and drop functionality
- SVG/Canvas - Bond rendering
- Zustand - State management (optional)
- Collision detection for element positioning

## Chemical Bonding Intelligence

### Bond Type Suggestions

**Diatomic Molecules:**
- H-H → single bond
- O-O → double bond (O₂)
- N-N → triple bond (N₂)
- Halogens (F-F, Cl-Cl, Br-Br, I-I) → single bond

**Metal + Nonmetal:**
- Electronegativity difference > 1.7 → ionic bond
- Example: Na + Cl → ionic

**Default:**
- Single bond for most combinations

### Valency Rules

| Element Type | Valency | Max Bonds |
|-------------|---------|-----------|
| Hydrogen (H) | 1 | 1 |
| Carbon (C) | 4 | 4 |
| Nitrogen (N) | 3, 5 | 3 or 5 |
| Oxygen (O) | 2 | 2 |
| Halogens (F, Cl, Br, I) | 1 | 1 |
| Sulfur (S) | 2, 4, 6 | 2, 4, or 6 |
| Phosphorus (P) | 3, 5 | 3 or 5 |
| Alkali metals (Na, K, etc.) | 1 | 1 |
| Alkaline-earth metals (Mg, Ca) | 2 | 2 |
| Noble gases (He, Ne, Ar, etc.) | 0 | 0 |

### Bond Counting

- Single bond = 1
- Double bond = 2
- Triple bond = 3

### Validation States

**Green (Valid):**
- Valency satisfied
- Chemically stable
- Common bonding patterns

**Yellow (Warning):**
- Rare but possible combinations
- Example: SF₆ (sulfur with 6 bonds)
- User can proceed with warning

**Red (Invalid):**
- Valency exceeded
- Noble gas bonds (noble gases shouldn't bond)
- Chemically impossible combinations
- User cannot save until fixed

### Bonding Logic

1. Check if diatomic molecule → apply specific rule
2. Calculate electronegativity difference → if > 1.7, suggest ionic
3. Default to single bond
4. Validate against valency rules
5. Display validation state (green/yellow/red)

## Visual Specifications

### Element Bubbles

**Sizing:**
```
radius = sqrt(atomicMass) * scaleFactor
```

**Colors:**
- Category-based (same as periodic table)

**States:**
- Default: Normal appearance
- Hover: Scale 1.05
- Selected: Glow effect
- Dragging: 0.7 opacity

### Bonds

**Rendering:**
- Connect bubble edges (not centers)
- Update dynamically as elements are dragged
- Line thickness based on bond type

**Bond Types Visual:**
- Single: Single line
- Double: Two parallel lines
- Triple: Three parallel lines
- Ionic: Dashed line
- Covalent: Solid line
- Metallic: Wavy line

### Valency Badge

**Display:**
- Shows "used/total" bonds (e.g., "2/4")
- Position: Top-right of element bubble

**Colors:**
- Green: Valency satisfied
- Yellow: Warning state
- Red: Valency exceeded

### Canvas

**Features:**
- Zoom: Scroll to zoom (0.5x to 3x)
- Pan: Drag background to pan
- Collision detection: Elements cannot overlap
- Grid: Optional snap-to-grid

## API Routes

### Compounds API

**GET `/api/compounds`**
- Returns all public compounds
- Includes element positions, bonds, external factors

**POST `/api/compounds`** (Auth Required)
- Creates new compound
- Request body: Compound data with positions, bonds, factors
- Returns created compound with ID

**GET `/api/compounds/[id]`**
- Returns specific compound details
- Public access

**PUT `/api/compounds/[id]`** (Auth Required, Owner Only)
- Updates existing compound
- Returns updated compound

**DELETE `/api/compounds/[id]`** (Auth Required, Owner Only)
- Deletes compound
- Returns success status

## Implementation Phases

**Phase 6 (✓):** Compound CRUD API routes
**Phase 7 (✓):** Interactive compound builder
  - @dnd-kit integration
  - Canvas with zoom/pan
  - Bonding intelligence
  - Valency validation
  - Auto-spread algorithm
  - External factors UI
  - Real-time formula calculation
  - Real-time molar mass calculation

**Phase 8 (✓):** Polish, error handling, responsive design

---

*Last Updated: Dec 22, 2025*
