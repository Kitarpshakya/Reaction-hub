# Testing Guide for Reaction Hub

## Overview

This project uses Jest and React Testing Library for unit and integration testing. The test suite covers:

- **Chemistry logic** (`chemistry-helpers.ts`) - Bond type determination, valency validation
- **State management** (`useCompoundCanvasStore`) - Zustand store for compound canvas
- **React components** (`ElementBubble`, etc.) - UI components with @dnd-kit integration

## Test Statistics

**Total Tests**: 118
**Passing**: 102+ tests
**Coverage Threshold**: 70% (branches, functions, lines, statements)

## Test Structure

```
__tests__/
├── mock-data.ts              # Mock elements (H, O, C, N, etc.) and bonds
├── test-utils.tsx            # Custom render functions
├── components/
│   └── ElementBubble.test.tsx
└── lib/
    ├── stores/
    │   └── useCompoundCanvasStore.test.ts
    └── utils/
        └── chemistry-helpers.test.ts
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run tests in CI mode
npm run test:ci
```

## Test Categories

### 1. Chemistry Helpers Tests (100% passing)

**File**: `__tests__/lib/utils/chemistry-helpers.test.ts`
**Tests**: 48 tests covering:

#### Bond Type Determination
- Metallic bonds (Fe-Fe)
- Ionic bonds (Na-Cl, EN difference > 1.7)
- Triple bonds (N-N, C-N)
- Double bonds (O-O, C-O)
- Single bonds (H-H, H-O)
- Edge cases (missing electronegativity)

#### Element Classification
- `isMetal()` - alkali, transition, vs nonmetals
- `isNonmetal()` - nonmetals, halogens vs metals

#### Valency System
- `getValence()` - H(1), O(2), N(3), C(4), noble gases(0)
- `countElementBonds()` - single(1), double(2), triple(3)
- `getAvailableValence()` - remaining bonding capacity
- Bond validation with valency limits

#### Bond Validation
- `canFormBond()` - valency checks, noble gas blocking
- `bondExists()` - duplicate bond prevention
- Noble gas restrictions

#### Geometric Calculations
- `calculateDistance()` - Euclidean distance
- `areElementsClose()` - threshold-based proximity
- `shouldAutoGroup()` - auto-bonding detection (120px threshold)

#### Utility Functions
- `getBondDisplayName()` - UI-friendly bond names
- `getElementCategoryColor()` - category color mapping
- `calculateBubbleRadius()` - size based on atomic mass

**Example Test**:
```typescript
it('should return triple bond for N-N', () => {
  const result = determineBondType(mockNitrogen, mockNitrogen)
  expect(result).toBe('triple')
})
```

### 2. Zustand Store Tests

**File**: `__tests__/lib/stores/useCompoundCanvasStore.test.ts`
**Tests**: 56 tests covering:

#### Element Management
- `addElement()` - adds to canvas with unique IDs
- Auto-bonding when distance < 120px
- Group ID assignment on bonding
- `removeElement()` - removes element and associated bonds
- `updateElementPosition()` - position updates
- `updateGroupPosition()` - delta-based positioning

#### Selection System
- `selectElement()` - element selection/deselection
- Bond deselection when selecting elements
- Auto-deselection on element removal

#### Bond Management
- `addBond()` - manual bond creation
- Automatic bond type determination (N-N → triple)
- Valency validation (prevents over-bonding)
- Noble gas bond prevention
- Smart selection (keeps first element selected if more bonds available)
- `removeBond()` - bond removal and ungrouping
- `updateBondType()` - bond type modification

#### Formula & Molar Mass
- `getFormula()` - H₂O formula with subscripts
- Only includes bonded elements
- `getMolarMass()` - accurate calculation (H₂O = 18.015 g/mol)

#### External Factors & Metadata
- `setCompoundName()` - compound naming
- `setCompoundDescription()` - descriptions
- `setExternalFactors()` - temperature, pressure, catalyst
- Factor merging (multiple factors can be set)

#### Reset Functionality
- `reset()` - clears all state completely

**Example Test**:
```typescript
it('should auto-bond when elements are close together', () => {
  const { result } = renderHook(() => useCompoundCanvasStore())

  act(() => {
    result.current.addElement(mockOxygen, { x: 100, y: 100 })
  })

  act(() => {
    result.current.addElement(mockHydrogen, { x: 160, y: 100 }) // 60px apart
  })

  expect(result.current.bonds).toHaveLength(1)
  expect(result.current.bonds[0].bondType).toBe('single')
})
```

### 3. Component Tests

**File**: `__tests__/components/ElementBubble.test.tsx`
**Tests**: 14 tests covering:

#### Rendering
- Element symbol display
- Remove button presence
- Proper positioning (CSS left/top)
- Fixed 60px size

#### Visual States
- Unbonded indicator (yellow "!" badge)
- Available valence badge ("+X")
- FULL badge when no bonds available
- Selected state styling (blue ring, pulse animation)
- Bonded vs unbonded styling

#### User Interactions
- Remove button click handler
- onRemove callback invocation

#### Drag-and-Drop
- Grab cursor when not dragging
- @dnd-kit integration (with DndContext wrapper)

**Example Test**:
```typescript
it('should show unbonded indicator when not bonded', () => {
  renderWithDnd(<ElementBubble {...defaultProps} isBonded={false} />)
  const unbondedIndicator = screen.getByTitle('Unbonded - not included in formula')
  expect(unbondedIndicator).toBeInTheDocument()
  expect(unbondedIndicator).toHaveTextContent('!')
})
```

## Mock Data

### Mock Elements

Provides pre-configured elements for testing:

```typescript
import {
  mockHydrogen,   // H - valency 1, nonmetal
  mockOxygen,     // O - valency 2, nonmetal
  mockCarbon,     // C - valency 4, nonmetal
  mockNitrogen,   // N - valency 3, nonmetal
  mockSodium,     // Na - valency 1, alkali metal
  mockChlorine,   // Cl - valency 1, halogen
  mockIron,       // Fe - valency 3, transition metal
  mockHelium,     // He - valency 0, noble gas
} from '@/__tests__/mock-data'
```

### Helper Functions

```typescript
// Create mock bond
const bond = createMockBond('b1', 'h1-id', 'o1-id', 'single')

// Create canvas element
const canvasEl = createMockCanvasElement(mockOxygen, { x: 100, y: 100 }, 'o-instance-1')
```

## Configuration

### Jest Config (`jest.config.js`)

```javascript
{
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',  // Path aliasing
  },
  testMatch: [
    '**/__tests__/**/*.test.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/test-utils',
    '/__tests__/mock-data',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
}
```

### Setup File (`jest.setup.js`)

- Imports `@testing-library/jest-dom` for DOM matchers
- Mocks environment variables (MONGODB_URI, NEXTAUTH_*)
- Mocks Next.js router (`next/navigation`)
- Mocks Framer Motion (prevents animation issues)

## Best Practices

### 1. Test Isolation

```typescript
beforeEach(() => {
  // Reset Zustand store before each test
  const { result } = renderHook(() => useCompoundCanvasStore())
  act(() => {
    result.current.reset()
  })
})
```

### 2. Using `act()` Correctly

```typescript
// ✅ CORRECT - State updates outside act
let elementId: string

act(() => {
  result.current.addElement(mockOxygen, { x: 100, y: 100 })
})

elementId = result.current.canvasElements[0].id // ✓ Outside act

// ❌ INCORRECT - Accessing state inside act
act(() => {
  result.current.addElement(mockOxygen, { x: 100, y: 100 })
  elementId = result.current.canvasElements[0].id // ✗ Inside act - may not be updated yet
})
```

### 3. Testing Auto-Bonding

Elements auto-bond when placed within 120px:

```typescript
// Elements 60px apart → auto-bonds
act(() => {
  result.current.addElement(mockOxygen, { x: 100, y: 100 })
})

act(() => {
  result.current.addElement(mockHydrogen, { x: 160, y: 100 })
})

expect(result.current.bonds).toHaveLength(1) // ✓ Auto-bonded
```

```typescript
// Elements 250px apart → no auto-bond
act(() => {
  result.current.addElement(mockOxygen, { x: 100, y: 100 })
})

act(() => {
  result.current.addElement(mockHydrogen, { x: 350, y: 350 })
})

expect(result.current.bonds).toHaveLength(0) // ✓ Too far apart
```

### 4. Component Testing with DnD

Wrap components that use @dnd-kit with `DndContext`:

```typescript
const renderWithDnd = (ui: React.ReactElement) => {
  return render(
    <DndContext>
      {ui}
    </DndContext>
  )
}

renderWithDnd(<ElementBubble {...props} />)
```

### 5. Testing Floating Point Math

Use `.toBeCloseTo()` for molar mass calculations:

```typescript
const molarMass = result.current.getMolarMass()
expect(molarMass).toBeCloseTo(18.015, 2) // 2 decimal places
```

## Coverage Goals

Current coverage targets (70% minimum):

```
Statements   : 70%
Branches     : 70%
Functions    : 70%
Lines        : 70%
```

To view detailed coverage:

```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

## Common Test Patterns

### Testing Valency Limits

```typescript
it('should not create bond if valency exceeded', () => {
  // Hydrogen can only bond once (valency = 1)
  act(() => {
    result.current.addElement(mockHydrogen, { x: 100, y: 100 })
    result.current.addElement(mockOxygen, { x: 200, y: 200 })
    result.current.addElement(mockCarbon, { x: 300, y: 300 })
  })

  const hId = result.current.canvasElements[0].id
  const oId = result.current.canvasElements[1].id
  const cId = result.current.canvasElements[2].id

  act(() => {
    result.current.addBond(hId, oId, 'single') // Uses H's only bond
  })

  act(() => {
    result.current.addBond(hId, cId, 'single') // Should fail - H already bonded
  })

  expect(result.current.bonds).toHaveLength(1) // Only first bond created
})
```

### Testing Formula Generation

```typescript
it('should generate formula for ammonia (NH₃)', () => {
  act(() => {
    result.current.addElement(mockNitrogen, { x: 100, y: 100 })
  })

  // Add 3 hydrogens close to nitrogen
  act(() => {
    result.current.addElement(mockHydrogen, { x: 140, y: 100 })
  })

  act(() => {
    result.current.addElement(mockHydrogen, { x: 60, y: 100 })
  })

  act(() => {
    result.current.addElement(mockHydrogen, { x: 100, y: 140 })
  })

  expect(result.current.getFormula()).toBe('H₃N')
  expect(result.current.getMolarMass()).toBeCloseTo(17.031, 2)
})
```

## Debugging Failed Tests

### 1. Check Console Logs

Tests include debug logging:

```
console.log
  Adding element: O at position: { x: 100, y: 100 }

console.log
  Nearby elements for auto-bonding: []
```

### 2. Inspect Test Output

```bash
npm test -- --verbose
npm test -- --testNamePattern="specific test name"
```

### 3. Use `--watch` Mode

```bash
npm run test:watch

# Then press:
# p - filter by test name
# t - filter by test file
# a - run all tests
```

## Future Improvements

1. **Component Coverage**: Add tests for CompoundCanvas, BondConnector
2. **Integration Tests**: Test full compound creation workflow
3. **E2E Tests**: Add Playwright/Cypress for user journeys
4. **Visual Regression**: Add snapshot tests for UI components
5. **Performance Tests**: Test with large numbers of elements (100+)
6. **API Route Tests**: Test compound CRUD endpoints
7. **Authentication Tests**: Test NextAuth flows

## Troubleshooting

### Issue: "Your test suite must contain at least one test"

**Solution**: Exclude utility files from test matching in `jest.config.js`:

```javascript
testPathIgnorePatterns: [
  '/node_modules/',
  '/__tests__/test-utils',
  '/__tests__/mock-data',
],
```

### Issue: "Cannot read properties of undefined"

**Cause**: Accessing Zustand state inside `act()` before updates apply

**Solution**: Access state outside `act()`:

```typescript
// ✅ Correct
act(() => {
  result.current.addElement(mockOxygen, { x: 100, y: 100 })
})

const id = result.current.canvasElements[0].id // ✓
```

### Issue: "Auto-bonding not triggering in tests"

**Cause**: Elements too far apart (>120px threshold)

**Solution**: Place elements within 120px:

```typescript
result.current.addElement(mockHydrogen, { x: 160, y: 100 }) // 60px from (100,100)
```

## Documentation

- Jest: https://jestjs.io/docs/getting-started
- React Testing Library: https://testing-library.com/docs/react-testing-library/intro
- Testing Library Hooks: https://github.com/testing-library/react-hooks-testing-library
- @dnd-kit Testing: https://docs.dndkit.com/

---

**Last Updated**: December 12, 2025
**Test Framework**: Jest 30.2.0 + React Testing Library 16.3.0
**Node Version**: Compatible with Node 20+
