# Compound Formation & Bonding System Guide

## Table of Contents
1. [Overview](#overview)
2. [Bond Types](#bond-types)
3. [Auto-Bonding Mechanism](#auto-bonding-mechanism)
4. [Valency & Validation](#valency--validation)
5. [Manual Bonding Workflow](#manual-bonding-workflow)
6. [Bond Type Determination Logic](#bond-type-determination-logic)
7. [Visual Representation](#visual-representation)
8. [External Factors](#external-factors)
9. [Formula & Molar Mass Calculation](#formula--molar-mass-calculation)
10. [Complete User Workflow](#complete-user-workflow)

---

## Overview

The Reaction Hub application features an intelligent compound builder that allows users to create chemical compounds by dragging and dropping elements onto a canvas. The system automatically determines appropriate bond types based on chemistry principles and validates bonding against valency rules.

### Key Features
- **Smart Auto-Bonding**: Elements automatically bond when placed close together (within 120px)
- **Click-to-Bond**: Click two elements sequentially to create bonds manually
- **Chemistry-Based**: Bond types determined by electronegativity, element categories, and common molecular patterns
- **Valency Validation**: Prevents impossible bonds and enforces electron shell rules
- **Real-Time Updates**: Bonds dynamically reposition as elements are dragged
- **Single Compound Mode**: Only one compound can be created at a time (prevents separate disconnected molecules)

---

## Bond Types

The system supports **6 different bond types**, each with distinct visual styling and chemical meaning:

### 1. Single Bond (`single`)
- **Visual**: Solid line, 3px stroke width
- **Examples**: H-H, C-H, H-O, Cl-Cl
- **Bond Value**: 1 (counts as 1 toward valency)
- **Description**: One pair of shared electrons between atoms

### 2. Double Bond (`double`)
- **Visual**: Solid line, 5px stroke width
- **Examples**: O=O (O₂), C=O (carbonyl), C=C (ethylene)
- **Bond Value**: 2 (counts as 2 toward valency)
- **Description**: Two pairs of shared electrons between atoms

### 3. Triple Bond (`triple`)
- **Visual**: Solid line, 7px stroke width
- **Examples**: N≡N (N₂), C≡N (cyanide), C≡C (acetylene)
- **Bond Value**: 3 (counts as 3 toward valency)
- **Description**: Three pairs of shared electrons between atoms

### 4. Ionic Bond (`ionic`)
- **Visual**: Dashed line (10px dash, 5px gap), 3px stroke width
- **Examples**: Na-Cl (NaCl), Mg-O (MgO), Ca-F (CaF₂)
- **Bond Value**: 1
- **Description**: Electrostatic attraction between oppositely charged ions
- **Trigger**: Large electronegativity difference (ΔEN > 1.7)

### 5. Metallic Bond (`metallic`)
- **Visual**: Dashed line (5px dash, 5px gap), 4px stroke width
- **Examples**: Fe-Fe, Cu-Cu, Au-Au
- **Bond Value**: 1
- **Description**: Delocalized electrons shared among metal atoms
- **Trigger**: Both elements are metals

### 6. Covalent Bond (`covalent`)
- **Visual**: Solid line, 4px stroke width
- **Bond Value**: 1
- **Description**: Generic term for electron-sharing bonds (encompasses single/double/triple)

---

## Auto-Bonding Mechanism

When an element is added to the canvas or dragged to a new position, the system checks for nearby elements and automatically creates bonds if conditions are met.

### Trigger Conditions
```typescript
// Auto-bonding occurs when:
1. Distance between elements ≤ 120 pixels
2. Both elements have available valency
3. No bond already exists between them
4. Neither element is a noble gas
```

### Implementation (from `useCompoundCanvasStore.ts:86-168`)
```typescript
addElement: (element, position) => {
  // 1. Generate unique instance ID
  const id = `${element.symbol}-${Date.now()}-${Math.random()}`;

  // 2. Find nearby elements within threshold (120px)
  const nearbyElementIds = shouldAutoGroup(
    state.canvasElements.map(el => ({ id: el.id, position: el.position })),
    { id, position },
    120 // threshold distance
  );

  // 3. Create bonds with nearby elements
  nearbyElementIds.forEach(nearbyId => {
    const nearbyElement = state.canvasElements.find(el => el.id === nearbyId);

    // 4. Validate bonding is possible
    if (canFormBond(element, nearbyElement.element, id, nearbyId, bonds)) {
      // 5. Automatically determine bond type
      const bondType = determineBondType(element, nearbyElement.element);

      // 6. Create bond
      newBonds.push({
        id: `bond-${Date.now()}-${Math.random()}`,
        fromElementId: id,
        toElementId: nearbyId,
        bondType
      });
    }
  });
}
```

### Auto-Bonding After Drag
When an element is dragged and released, the system checks if it's now close to other elements and creates bonds automatically:

```typescript
handleDragEnd: (event) => {
  // Update position first
  updateGroupPosition(elementId, delta);

  // Check for proximity bonding
  const nearbyElementIds = shouldAutoGroup(canvasElements, newPosition, 120);

  // Auto-bond with nearby elements
  nearbyElementIds.forEach(nearbyId => {
    if (canFormBond(...)) {
      addBond(elementId, nearbyId, "single");
    }
  });
}
```

---

## Valency & Validation

### Valency Rules (from `chemistry-helpers.ts:104-121`)

Each element has a maximum bonding capacity based on its outer electron shell:

```typescript
const valenceMap: Record<string, number> = {
  // Group 1: Alkali metals (1 valence electron)
  H: 1, Li: 1, Na: 1, K: 1, Rb: 1, Cs: 1, Fr: 1,

  // Group 2: Alkaline earth metals (2 valence electrons)
  Be: 2, Mg: 2, Ca: 2, Sr: 2, Ba: 2, Ra: 2,

  // Group 13: Boron group (3 valence electrons)
  B: 3, Al: 3, Ga: 3, In: 3, Tl: 3,

  // Group 14: Carbon group (4 valence electrons)
  C: 4, Si: 4, Ge: 4, Sn: 4, Pb: 4,

  // Group 15: Nitrogen group (3 or 5 valence electrons)
  N: 3, P: 3, As: 3, Sb: 3, Bi: 3,

  // Group 16: Oxygen group (2 valence electrons)
  O: 2, S: 2, Se: 2, Te: 2, Po: 2,

  // Group 17: Halogens (1 valence electron)
  F: 1, Cl: 1, Br: 1, I: 1, At: 1,

  // Group 18: Noble gases (0 valence - stable)
  He: 0, Ne: 0, Ar: 0, Kr: 0, Xe: 0, Rn: 0,

  // Transition metals (variable valency)
  Fe: 3, Cu: 2, Zn: 2, Ag: 1, Au: 3,
  Ni: 2, Co: 2, Cr: 3, Mn: 2, Ti: 4
};
```

### Bond Value Counting

Different bond types consume different amounts of valency:

```typescript
function getBondValue(bondType: BondType): number {
  switch (bondType) {
    case "single":   return 1;
    case "double":   return 2;
    case "triple":   return 3;
    case "ionic":    return 1;
    case "covalent": return 1;
    case "metallic": return 1;
  }
}
```

### Validation Logic (from `chemistry-helpers.ts:185-204`)

Before creating a bond, the system checks:

```typescript
function canFormBond(element1, element2, elementId1, elementId2, bonds): boolean {
  // 1. Noble gases cannot form bonds
  if (element1.category === "noble-gas" || element2.category === "noble-gas") {
    return false;
  }

  // 2. No duplicate bonds
  if (bondExists(elementId1, elementId2, bonds)) {
    return false;
  }

  // 3. Both elements must have available valency
  const available1 = getAvailableValence(element1, elementId1, bonds);
  const available2 = getAvailableValence(element2, elementId2, bonds);

  return available1 > 0 && available2 > 0;
}
```

### Example: Water (H₂O)

```
Oxygen (O): valency = 2
Hydrogen (H): valency = 1

Step 1: Add O to canvas
- O has 2 available bonds

Step 2: Add first H near O
- Auto-bonds: H-O (single bond, consumes 1 valency each)
- O now has 1 available bond
- H now has 0 available bonds

Step 3: Add second H near O
- Auto-bonds: H-O (single bond)
- O now has 0 available bonds
- H now has 0 available bonds

Result: H-O-H (H₂O)
✓ Valid - all valencies satisfied
```

---

## Manual Bonding Workflow

Users can manually create bonds by clicking elements in sequence. This is useful when you want precise control over which elements bond together, or when elements are too far apart for auto-bonding.

### Visual Feedback for Manual Bonding

When an element is selected for manual bonding, it displays:
- **Thicker blue ring** (4px border, up from 2px)
- **Pulsing animation** to draw attention
- **Larger size** (scale 1.10, up from 1.0)
- **Stronger blue shadow** for visibility
- **Green badge** showing available bonds (e.g., "+2" means can bond with 2 more elements)

### Click-to-Bond Process (from `CompoundCanvas.tsx:110-126`)

```typescript
handleElementSelect: (elementId) => {
  if (selectedElementId && selectedElementId !== elementId) {
    // Case 1: Second element clicked - create bond
    addBond(selectedElementId, elementId, "single");
    // Bond type auto-determined by chemistry rules

  } else if (selectedElementId === elementId) {
    // Case 2: Same element clicked - deselect
    selectElement(null);

  } else {
    // Case 3: First element clicked - select it
    selectElement(elementId);
  }
}
```

### Smart Selection Persistence

After creating a bond, the first element remains selected if it can form more bonds:

```typescript
addBond: (fromElementId, toElementId, bondType) => {
  // Create the bond...

  // Check if first element can still bond
  const availableValence = getAvailableValence(
    fromElement.element,
    fromElementId,
    newBonds
  );

  // Keep selected if more bonds possible
  return {
    selectedElementId: availableValence > 0 ? fromElementId : null
  };
}
```

### Important: Click Detection

The system differentiates between **clicks** (for selection) and **drags** (for repositioning):

```typescript
// From ElementBubble.tsx
// Only ignore click if actual movement occurred (>5px)
if (hasMovedRef.current) {
  console.log("Ignoring click - element was actually dragged");
  return;
}

// Track movement during drag
React.useEffect(() => {
  if (isDragging && transform) {
    const distance = Math.sqrt(transform.x * transform.x + transform.y * transform.y);
    if (distance > 5) {
      hasMovedRef.current = true; // Mark as actual drag
    }
  }
}, [isDragging, transform]);
```

**Result**:
- **Click** (no movement) → Element gets selected/bonded
- **Drag** (>5px movement) → Element repositions, no selection change

### Example: Creating Ammonia (NH₃)

```
1. Click Nitrogen (N) → N selected (valency: 3, blue pulsing ring appears)
2. Click Hydrogen (H) → H-N bond created, N still selected (valency: 2 remaining)
3. Click Hydrogen (H) → H-N bond created, N still selected (valency: 1 remaining)
4. Click Hydrogen (H) → H-N bond created, N deselected (valency: 0 remaining)

Result: NH₃ (ammonia)
```

---

## Bond Type Determination Logic

The system automatically determines the most appropriate bond type based on chemistry principles.

### Decision Tree (from `chemistry-helpers.ts:7-39`)

```typescript
function determineBondType(element1: Element, element2: Element): BondType {
  const en1 = element1.electronegativity || 0;
  const en2 = element2.electronegativity || 0;
  const enDifference = Math.abs(en1 - en2);

  // Step 1: Check if both are metals → METALLIC BOND
  if (isMetal(element1) && isMetal(element2)) {
    return "metallic";
  }

  // Step 2: Check electronegativity difference → IONIC BOND
  // Pauling scale: ΔEN > 1.7 indicates ionic character
  if (enDifference > 1.7) {
    return "ionic";
  }

  // Step 3: Estimate bond order for covalent bonds
  const bondOrder = estimateBondOrder(element1, element2);

  if (bondOrder === 3) return "triple";
  if (bondOrder === 2) return "double";
  return "single";
}
```

### Bond Order Estimation (from `chemistry-helpers.ts:66-99`)

```typescript
function estimateBondOrder(element1, element2): number {
  const symbol1 = element1.symbol;
  const symbol2 = element2.symbol;

  // Known triple bonds
  const tripleBondPairs = [
    ["N", "N"],  // N≡N (nitrogen gas)
    ["C", "N"],  // C≡N (cyanide)
    ["C", "C"]   // C≡C (alkynes)
  ];

  // Known double bonds
  const doubleBondPairs = [
    ["O", "O"],  // O=O (oxygen gas)
    ["C", "O"],  // C=O (carbonyl)
    ["C", "C"],  // C=C (alkenes)
    ["S", "O"],  // S=O (sulfoxide)
    ["N", "O"]   // N=O (nitric oxide)
  ];

  // Check for triple bonds
  for (const [a, b] of tripleBondPairs) {
    if ((symbol1 === a && symbol2 === b) || (symbol1 === b && symbol2 === a)) {
      return 3;
    }
  }

  // Check for double bonds
  for (const [a, b] of doubleBondPairs) {
    if ((symbol1 === a && symbol2 === b) || (symbol1 === b && symbol2 === a)) {
      return 2;
    }
  }

  // Default to single bond
  return 1;
}
```

### Real-World Examples

| Elements | ΔEN | Metal? | Result | Reasoning |
|----------|-----|--------|--------|-----------|
| H + H | 0.0 | No | Single | Same element, covalent |
| O + O | 0.0 | No | **Double** | Diatomic oxygen pattern |
| N + N | 0.0 | No | **Triple** | Diatomic nitrogen pattern |
| Na + Cl | 2.1 | Metal+Nonmetal | **Ionic** | ΔEN > 1.7 |
| C + O | 0.9 | No | **Double** | Carbonyl pattern |
| C + C | 0.0 | No | Single* | Default (can be double/triple in context) |
| Fe + Fe | 0.0 | Yes | **Metallic** | Both metals |

*Note: C-C defaults to single, but can be manually changed to double or triple for alkenes/alkynes.*

---

## Visual Representation

### Element Bubbles

Elements are rendered as circular bubbles with size proportional to atomic mass:

```typescript
function calculateBubbleRadius(atomicMass: number, scaleFactor = 3): number {
  return Math.sqrt(atomicMass) * scaleFactor;
}

// Examples:
// Hydrogen (1.008 amu) → radius ≈ 3px
// Carbon (12.01 amu)  → radius ≈ 10px
// Oxygen (16.00 amu)  → radius ≈ 12px
// Iron (55.85 amu)    → radius ≈ 22px
```

### Visual States

Each element bubble has multiple visual states:

1. **Default**: Category-colored background, white text
2. **Selected**: Blue glow border (3px), scale 1.05
3. **Dragging**: Opacity 0.7, cursor grabbing
4. **Bonded**: Displays valency badge (e.g., "2/3" = 2 used, 3 total)
5. **Unbonded Warning**: Yellow "!" badge if no bonds

### Category Colors (from `chemistry-helpers.ts:269-284`)

```typescript
const colorMap = {
  "nonmetal":              "#4ECDC4", // Teal
  "noble-gas":             "#95E1D3", // Mint
  "alkali-metal":          "#F38181", // Coral
  "alkaline-earth-metal":  "#FDCB6E", // Yellow
  "transition-metal":      "#A29BFE", // Purple
  "post-transition-metal": "#74B9FF", // Blue
  "metalloid":             "#FD79A8", // Pink
  "halogen":               "#FF7675", // Red
  "lanthanide":            "#FFEAA7", // Light yellow
  "actinide":              "#DFE6E9", // Gray
  "unknown":               "#B2BEC3"  // Medium gray
};
```

### Bond Visual Styles

```typescript
function getBondStyle(bondType: BondType) {
  switch (bondType) {
    case "single":
      return { strokeWidth: 3, strokeDasharray: "none" };

    case "double":
      return { strokeWidth: 5, strokeDasharray: "none" };

    case "triple":
      return { strokeWidth: 7, strokeDasharray: "none" };

    case "ionic":
      return { strokeWidth: 3, strokeDasharray: "10,5" };  // Dashed

    case "metallic":
      return { strokeWidth: 4, strokeDasharray: "5,5" };   // Dashed

    case "covalent":
      return { strokeWidth: 4, strokeDasharray: "none" };
  }
}
```

### Dynamic Bond Positioning

Bonds update in real-time as elements are dragged:

```tsx
// From BondConnector.tsx
<line
  x1={fromPosition.x}
  y1={fromPosition.y}
  x2={toPosition.x}
  y2={toPosition.y}
  stroke={isSelected ? "#60A5FA" : "#9CA3AF"}
  strokeWidth={isSelected ? bondStyle.strokeWidth + 2 : bondStyle.strokeWidth}
  strokeDasharray={bondStyle.strokeDasharray}
/>
```

---

## External Factors

The compound builder allows users to specify reaction conditions that affect compound formation.

### Available Factors (from `compound.ts:20-45`)

```typescript
interface ExternalFactors {
  temperature?: {
    enabled: boolean;
    value?: number;      // Numeric value
    unit?: "K" | "C";    // Kelvin or Celsius
  };

  pressure?: {
    enabled: boolean;
    value?: number;      // Numeric value
    unit?: "atm" | "Pa"; // Atmospheres or Pascals
  };

  catalyst?: {
    enabled: boolean;
    name?: string;       // e.g., "Platinum", "Enzyme"
    details?: string;    // Additional info
  };

  heat?: {
    enabled: boolean;
    details?: string;    // Heat application method
  };

  light?: {
    enabled: boolean;
    wavelength?: number; // Wavelength in nanometers
    details?: string;    // UV, visible, IR, etc.
  };
}
```

### Usage in State Management

```typescript
setExternalFactors: (factors: Partial<ExternalFactors>) => {
  set(state => ({
    externalFactors: { ...state.externalFactors, ...factors }
  }));
}
```

### Example: Haber Process (N₂ + 3H₂ → 2NH₃)

```json
{
  "temperature": {
    "enabled": true,
    "value": 450,
    "unit": "C"
  },
  "pressure": {
    "enabled": true,
    "value": 200,
    "unit": "atm"
  },
  "catalyst": {
    "enabled": true,
    "name": "Iron",
    "details": "Iron oxide catalyst with potassium promoter"
  }
}
```

---

## Formula & Molar Mass Calculation

The system automatically calculates the chemical formula and molar mass based on bonded elements.

### Formula Generation (from `useCompoundCanvasStore.ts:406-436`)

```typescript
getFormula: () => {
  // 1. Identify bonded elements only
  const bondedElementIds = new Set<string>();
  bonds.forEach(bond => {
    bondedElementIds.add(bond.fromElementId);
    bondedElementIds.add(bond.toElementId);
  });

  // 2. Count element occurrences
  const elementCounts: Record<string, number> = {};
  canvasElements.forEach(el => {
    if (bondedElementIds.has(el.id)) {
      elementCounts[el.symbol] = (elementCounts[el.symbol] || 0) + 1;
    }
  });

  // 3. Generate formula with subscript numbers
  let formula = "";
  Object.entries(elementCounts)
    .sort(([a], [b]) => a.localeCompare(b))  // Alphabetical order
    .forEach(([symbol, count]) => {
      formula += symbol;
      if (count > 1) {
        // Convert to subscript: "2" → "₂"
        formula += count.toString()
          .split("")
          .map(d => "₀₁₂₃₄₅₆₇₈₉"[parseInt(d)])
          .join("");
      }
    });

  return formula;
}
```

### Molar Mass Calculation (from `useCompoundCanvasStore.ts:438-451`)

```typescript
getMolarMass: () => {
  // Only include bonded elements
  const bondedElementIds = new Set<string>();
  bonds.forEach(bond => {
    bondedElementIds.add(bond.fromElementId);
    bondedElementIds.add(bond.toElementId);
  });

  // Sum atomic masses
  return canvasElements
    .filter(el => bondedElementIds.has(el.id))
    .reduce((sum, el) => sum + el.element.atomicMass, 0);
}
```

### Examples

| Compound | Elements | Formula | Molar Mass | Calculation |
|----------|----------|---------|------------|-------------|
| Water | 2 H, 1 O | H₂O | 18.015 g/mol | (2 × 1.008) + 16.00 |
| Ammonia | 3 H, 1 N | H₃N | 17.031 g/mol | (3 × 1.008) + 14.007 |
| Methane | 4 H, 1 C | CH₄ | 16.043 g/mol | 12.011 + (4 × 1.008) |
| Carbon Dioxide | 2 O, 1 C | CO₂ | 44.010 g/mol | 12.011 + (2 × 16.00) |

---

## Complete User Workflow

### Scenario: Creating Water (H₂O)

#### Step-by-Step Process

1. **Setup**
   - User navigates to `/compounds/create` (requires authentication)
   - Canvas loads with grid background
   - Elements panel shows searchable list of 118 elements

2. **Add Oxygen**
   - User clicks Oxygen (O) in elements panel
   - O bubble appears at click position on canvas
   - Bubble displays:
     - Symbol: "O"
     - Atomic number: 8
     - Valency badge: "0/2" (0 bonds used, 2 available)
     - Yellow "!" badge (no bonds yet)

3. **Add First Hydrogen (Auto-Bond)**
   - User clicks Hydrogen (H) in elements panel
   - User clicks near O on canvas (within 120px)
   - **Auto-bonding triggers:**
     - System detects O within 120px threshold
     - Validates: `canFormBond(H, O)` → true
     - Determines bond type: `determineBondType(H, O)` → "single" (ΔEN = 1.4 < 1.7)
     - Creates H-O single bond
   - Visual updates:
     - Bond line appears (3px solid gray)
     - O badge: "1/2" (1 bond used, 1 remaining)
     - H badge: "1/1" (fully bonded)
     - Both elements assigned to same group (blue dashed boundary)

4. **Add Second Hydrogen**
   - User clicks H again in panel
   - User clicks near O (within 120px)
   - Auto-bonding creates second H-O bond
   - Visual updates:
     - Second bond line appears
     - O badge: "2/2" (fully bonded, green)
     - Both H badges: "1/1" (green)
     - Yellow "!" badges removed
     - Group boundary expands to include all 3 elements

5. **Review Compound**
   - Formula auto-calculates: **H₂O**
   - Molar mass auto-calculates: **18.015 g/mol**
   - User sees bond diagram:
     ```
     H --- O --- H
     ```

6. **Add Details**
   - User enters compound name: "Water"
   - User adds description: "Essential for all known forms of life"
   - User optionally sets external factors:
     - Temperature: 25°C
     - Pressure: 1 atm

7. **Save**
   - User clicks "Save Compound" button
   - System validates:
     - At least 2 elements bonded ✓
     - All elements have bonds ✓
     - Single compound (no disconnected groups) ✓
   - POST request to `/api/compounds` with:
     ```json
     {
       "name": "Water",
       "formula": "H₂O",
       "molarMass": 18.015,
       "elements": [
         { "elementId": "H", "symbol": "H", "count": 2, "position": {...} },
         { "elementId": "O", "symbol": "O", "count": 1, "position": {...} }
       ],
       "bonds": [
         { "fromElementId": "H-1", "toElementId": "O-1", "bondType": "single" },
         { "fromElementId": "H-2", "toElementId": "O-1", "bondType": "single" }
       ],
       "externalFactors": { "temperature": {...}, "pressure": {...} },
       "canvasData": { "zoom": 1, "offset": { "x": 0, "y": 0 } }
     }
     ```
   - Redirect to compound detail page

### Alternative: Manual Click-to-Bond

Instead of relying on auto-bonding, user can manually bond:

1. Add O to canvas (position doesn't matter)
2. Add first H to canvas (position doesn't matter)
3. **Click O** → O selected (blue glow)
4. **Click H** → H-O bond created, O still selected (1 bond remaining)
5. Add second H to canvas
6. **Click H** (O already selected) → Second H-O bond created

---

## Single Compound Restriction

The system enforces **single compound mode** to prevent users from creating multiple disconnected molecules.

### Restriction Logic (from `useCompoundCanvasStore.ts:217-256`)

```typescript
addBond: (fromElementId, toElementId, bondType) => {
  // If bonds already exist, ensure new bond connects to existing compound
  if (state.bonds.length > 0) {
    const fromElementHasGroup = !!fromElement.groupId;
    const toElementHasGroup = !!toElement.groupId;

    // Block separate compound
    if (!fromElementHasGroup && !toElementHasGroup) {
      alert(
        "Cannot create separate compound!\n\n" +
        "You can only create ONE compound at a time. " +
        "At least one element must be part of the existing compound."
      );
      return state;
    }

    // Block merging different groups
    if (fromElementHasGroup && toElementHasGroup &&
        fromElement.groupId !== toElement.groupId) {
      alert("Cannot merge separate compounds!");
      return state;
    }
  }

  // Proceed with bonding...
}
```

### Example: Blocked Scenario

```
Canvas state: H-O-H (water molecule with groupId: "group-1")

User attempts:
1. Add C to canvas (no group)
2. Add another C to canvas (no group)
3. Try to bond C-C

Result: ❌ BLOCKED
Reason: Neither C is part of group-1, would create separate molecule

Solution:
- Bond one C to the H-O-H compound first
- Then bond second C to first C
```

---

## Advanced Features

### Group Management

Elements bonded together form **groups** with visual boundaries:

- Blue dashed rectangle outlines the compound
- Padding: 40px around outermost elements
- Border radius: 8px
- Updates dynamically as elements move

### Bond Editing

Users can modify existing bonds:

1. Click a bond to select it (turns blue)
2. Bond control panel appears with options:
   - Single Bond
   - Double Bond
   - Triple Bond
   - Ionic Bond
   - Metallic Bond
3. Click desired type to update
4. Bond visual updates immediately

### Element Repositioning

- Drag any element to reposition
- Bonds stretch/contract dynamically
- Group boundary recalculates
- No collision detection (elements can overlap)

### Deletion

- **Remove Element**: Click X button on element bubble
  - Deletes element and all connected bonds
  - Updates formula and molar mass
- **Break Bond**: Click bond → click X button at midpoint
  - Removes bond
  - Elements ungroup if no other bonds connect them

---

## Technical Architecture

### State Management: Zustand Store

The compound canvas uses a centralized Zustand store (`useCompoundCanvasStore`) with the following state:

```typescript
interface CompoundCanvasState {
  canvasElements: CanvasElement[];      // Elements on canvas
  selectedElementId: string | null;     // Currently selected element
  selectedBondId: string | null;        // Currently selected bond
  bonds: Bond[];                        // All bonds
  externalFactors: ExternalFactors;     // Reaction conditions
  compoundName: string;                 // User-entered name
  compoundDescription: string;          // User-entered description
  zoom: number;                         // Canvas zoom level
  offset: { x: number; y: number };     // Canvas pan offset
}
```

### Key Components

1. **CompoundCanvas.tsx**: Main canvas with drag-and-drop, element rendering, bond visualization
2. **ElementBubble.tsx**: Individual element bubble with drag handlers, selection state
3. **BondConnector.tsx**: SVG line component for bonds, with click handlers
4. **ElementsPanel.tsx**: Searchable list of 118 elements
5. **CompoundDetails.tsx**: Form for name, description, formula display
6. **ExternalFactors.tsx**: Toggle switches for reaction conditions
7. **ValidationPanel.tsx**: Real-time validation feedback

### Helper Functions

All chemistry logic is centralized in `lib/utils/chemistry-helpers.ts`:

- `determineBondType()`: Auto-determine bond type
- `canFormBond()`: Validate bonding possibility
- `getValence()`: Get element's max bonds
- `getAvailableValence()`: Get remaining bonding capacity
- `countElementBonds()`: Count current bonds for element
- `bondExists()`: Check for duplicate bonds
- `shouldAutoGroup()`: Find nearby elements for auto-bonding
- `calculateDistance()`: Distance between two points
- `getElementCategoryColor()`: Color mapping for categories
- `calculateBubbleRadius()`: Size calculation for bubbles

---

## Future Enhancements

Potential improvements for the bonding system:

1. **Resonance Structures**: Support for multiple valid Lewis structures (e.g., benzene)
2. **3D Visualization**: Three.js rendering of molecular geometry (VSEPR theory)
3. **Bond Angle Validation**: Enforce tetrahedral (109.5°), trigonal planar (120°), linear (180°)
4. **Formal Charge Calculation**: Display formal charges on atoms
5. **Reaction Arrows**: Show before/after states for chemical reactions
6. **Import from SMILES**: Parse SMILES notation to generate compounds
7. **Export to Mol File**: Save as .mol format for use in chemistry software
8. **AI Suggestions**: Recommend possible compounds based on selected elements
9. **Reaction Pathways**: Visualize step-by-step mechanisms
10. **Periodic Trends Overlay**: Show EN, atomic radius while bonding

---

## Conclusion

The Reaction Hub bonding system combines chemistry principles with intuitive UX to create an educational and powerful compound builder. Key strengths:

- **Chemistry-accurate**: Bond types follow Pauling electronegativity scale and common molecular patterns
- **User-friendly**: Auto-bonding reduces manual work while preserving manual control
- **Validated**: Prevents impossible bonds through valency checking
- **Visual**: Color-coded elements, dynamic bonds, real-time feedback
- **Flexible**: Support for 6 bond types, external factors, and manual editing

Whether building simple molecules like H₂O or complex compounds, the system guides users toward chemically valid structures while providing freedom to explore.

---

**Document Version**: 1.0
**Last Updated**: December 12, 2025
**Related Files**:
- `lib/utils/chemistry-helpers.ts` - Core bonding logic
- `lib/stores/useCompoundCanvasStore.ts` - State management
- `components/compounds/create/CompoundCanvas.tsx` - Canvas UI
- `lib/types/compound.ts` - Type definitions
