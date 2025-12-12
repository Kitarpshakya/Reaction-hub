import { renderHook, act } from '@testing-library/react'
import { useCompoundCanvasStore } from '@/lib/stores/useCompoundCanvasStore'
import {
  mockHydrogen,
  mockOxygen,
  mockCarbon,
  mockNitrogen,
  mockHelium,
} from '@/__tests__/mock-data'

describe('useCompoundCanvasStore', () => {
  beforeEach(() => {
    // Reset store before each test
    const { result } = renderHook(() => useCompoundCanvasStore())
    act(() => {
      result.current.reset()
    })
  })

  describe('addElement', () => {
    it('should add element to canvas', () => {
      const { result } = renderHook(() => useCompoundCanvasStore())

      act(() => {
        result.current.addElement(mockOxygen, { x: 100, y: 100 })
      })

      expect(result.current.canvasElements).toHaveLength(1)
      expect(result.current.canvasElements[0].symbol).toBe('O')
      expect(result.current.canvasElements[0].position).toEqual({ x: 100, y: 100 })
    })

    it('should generate unique IDs for elements', () => {
      const { result } = renderHook(() => useCompoundCanvasStore())

      act(() => {
        result.current.addElement(mockHydrogen, { x: 50, y: 50 })
        result.current.addElement(mockHydrogen, { x: 150, y: 150 })
      })

      expect(result.current.canvasElements).toHaveLength(2)
      expect(result.current.canvasElements[0].id).not.toBe(result.current.canvasElements[1].id)
    })

    it('should auto-bond when elements are close together', () => {
      const { result } = renderHook(() => useCompoundCanvasStore())

      act(() => {
        result.current.addElement(mockOxygen, { x: 100, y: 100 })
      })

      act(() => {
        result.current.addElement(mockHydrogen, { x: 160, y: 100 }) // 60px apart, within 120px threshold
      })

      expect(result.current.bonds).toHaveLength(1)
      expect(result.current.bonds[0].bondType).toBe('single')
    })

    it('should not auto-bond when elements are far apart', () => {
      const { result } = renderHook(() => useCompoundCanvasStore())

      act(() => {
        result.current.addElement(mockOxygen, { x: 100, y: 100 })
      })

      act(() => {
        result.current.addElement(mockHydrogen, { x: 300, y: 300 }) // Beyond 120px
      })

      expect(result.current.bonds).toHaveLength(0)
    })

    it('should assign group ID when auto-bonding', () => {
      const { result } = renderHook(() => useCompoundCanvasStore())

      act(() => {
        result.current.addElement(mockOxygen, { x: 100, y: 100 })
      })

      act(() => {
        result.current.addElement(mockHydrogen, { x: 160, y: 100 }) // 60px apart
      })

      expect(result.current.canvasElements[0].groupId).toBeDefined()
      expect(result.current.canvasElements[1].groupId).toBeDefined()
      expect(result.current.canvasElements[0].groupId).toBe(
        result.current.canvasElements[1].groupId
      )
    })
  })

  describe('removeElement', () => {
    it('should remove element from canvas', () => {
      const { result } = renderHook(() => useCompoundCanvasStore())

      let elementId: string

      act(() => {
        result.current.addElement(mockOxygen, { x: 100, y: 100 })
      })

      elementId = result.current.canvasElements[0].id

      act(() => {
        result.current.removeElement(elementId)
      })

      expect(result.current.canvasElements).toHaveLength(0)
    })

    it('should remove associated bonds when removing element', () => {
      const { result } = renderHook(() => useCompoundCanvasStore())

      let oxygenId: string

      act(() => {
        result.current.addElement(mockOxygen, { x: 100, y: 100 })
      })

      oxygenId = result.current.canvasElements[0].id

      act(() => {
        result.current.addElement(mockHydrogen, { x: 150, y: 100 })
      })

      expect(result.current.bonds).toHaveLength(1)

      act(() => {
        result.current.removeElement(oxygenId)
      })

      expect(result.current.bonds).toHaveLength(0)
    })

    it('should deselect element when it is removed', () => {
      const { result } = renderHook(() => useCompoundCanvasStore())

      let elementId: string

      act(() => {
        result.current.addElement(mockOxygen, { x: 100, y: 100 })
      })

      elementId = result.current.canvasElements[0].id

      act(() => {
        result.current.selectElement(elementId)
      })

      expect(result.current.selectedElementId).toBe(elementId)

      act(() => {
        result.current.removeElement(elementId)
      })

      expect(result.current.selectedElementId).toBeNull()
    })
  })

  describe('updateElementPosition', () => {
    it('should update element position', () => {
      const { result } = renderHook(() => useCompoundCanvasStore())

      let elementId: string

      act(() => {
        result.current.addElement(mockOxygen, { x: 100, y: 100 })
      })

      elementId = result.current.canvasElements[0].id

      act(() => {
        result.current.updateElementPosition(elementId, { x: 200, y: 200 })
      })

      expect(result.current.canvasElements[0].position).toEqual({ x: 200, y: 200 })
    })
  })

  describe('updateGroupPosition', () => {
    it('should update position by delta', () => {
      const { result } = renderHook(() => useCompoundCanvasStore())

      let elementId: string

      act(() => {
        result.current.addElement(mockOxygen, { x: 100, y: 100 })
      })

      elementId = result.current.canvasElements[0].id

      act(() => {
        result.current.updateGroupPosition(elementId, { x: 50, y: -25 })
      })

      expect(result.current.canvasElements[0].position).toEqual({ x: 150, y: 75 })
    })
  })

  describe('selectElement', () => {
    it('should select element', () => {
      const { result } = renderHook(() => useCompoundCanvasStore())

      let elementId: string

      act(() => {
        result.current.addElement(mockOxygen, { x: 100, y: 100 })
      })

      elementId = result.current.canvasElements[0].id

      act(() => {
        result.current.selectElement(elementId)
      })

      expect(result.current.selectedElementId).toBe(elementId)
    })

    it('should deselect bond when selecting element', () => {
      const { result } = renderHook(() => useCompoundCanvasStore())

      let elementId: string

      act(() => {
        result.current.addElement(mockOxygen, { x: 100, y: 100 })
      })

      elementId = result.current.canvasElements[0].id

      act(() => {
        result.current.selectBond('some-bond-id')
      })

      act(() => {
        result.current.selectElement(elementId)
      })

      expect(result.current.selectedBondId).toBeNull()
    })

    it('should allow deselecting by passing null', () => {
      const { result } = renderHook(() => useCompoundCanvasStore())

      let elementId: string

      act(() => {
        result.current.addElement(mockOxygen, { x: 100, y: 100 })
      })

      elementId = result.current.canvasElements[0].id

      act(() => {
        result.current.selectElement(elementId)
      })

      act(() => {
        result.current.selectElement(null)
      })

      expect(result.current.selectedElementId).toBeNull()
    })
  })

  describe('addBond', () => {
    it('should create bond between two elements', () => {
      const { result } = renderHook(() => useCompoundCanvasStore())

      let h1Id: string, h2Id: string

      act(() => {
        result.current.addElement(mockHydrogen, { x: 100, y: 100 })
      })

      h1Id = result.current.canvasElements[0].id

      act(() => {
        result.current.addElement(mockHydrogen, { x: 300, y: 300 }) // Far apart, no auto-bond
      })

      h2Id = result.current.canvasElements[1].id

      act(() => {
        result.current.addBond(h1Id, h2Id, 'single')
      })

      expect(result.current.bonds).toHaveLength(1)
      expect(result.current.bonds[0].fromElementId).toBe(h1Id)
      expect(result.current.bonds[0].toElementId).toBe(h2Id)
    })

    it('should automatically determine bond type', () => {
      const { result } = renderHook(() => useCompoundCanvasStore())

      let n1Id: string, n2Id: string

      act(() => {
        result.current.addElement(mockNitrogen, { x: 100, y: 100 })
      })

      n1Id = result.current.canvasElements[0].id

      act(() => {
        result.current.addElement(mockNitrogen, { x: 300, y: 300 })
      })

      n2Id = result.current.canvasElements[1].id

      act(() => {
        result.current.addBond(n1Id, n2Id, 'single')
      })

      // Should be triple bond for N-N
      expect(result.current.bonds[0].bondType).toBe('triple')
    })

    it('should not create bond if element not found', () => {
      const { result } = renderHook(() => useCompoundCanvasStore())

      act(() => {
        result.current.addBond('invalid-id-1', 'invalid-id-2', 'single')
      })

      expect(result.current.bonds).toHaveLength(0)
    })

    it('should not create bond if valency exceeded', () => {
      const { result } = renderHook(() => useCompoundCanvasStore())

      let h1Id: string, o1Id: string, h2Id: string

      act(() => {
        result.current.addElement(mockHydrogen, { x: 100, y: 100 })
      })

      h1Id = result.current.canvasElements[0].id

      act(() => {
        result.current.addElement(mockOxygen, { x: 300, y: 100 }) // 200px apart, no auto-bond
      })

      o1Id = result.current.canvasElements[1].id

      act(() => {
        result.current.addElement(mockHydrogen, { x: 500, y: 100 }) // 200px from O, no auto-bond
      })

      h2Id = result.current.canvasElements[2].id

      act(() => {
        result.current.addBond(h1Id, o1Id, 'single')
      })

      // Try to bond h1 again (hydrogen can only bond once)
      act(() => {
        result.current.addBond(h1Id, h2Id, 'single')
      })

      expect(result.current.bonds).toHaveLength(1)
    })

    it('should not create bond with noble gas', () => {
      const { result } = renderHook(() => useCompoundCanvasStore())

      let heId: string, hId: string

      act(() => {
        result.current.addElement(mockHelium, { x: 100, y: 100 })
      })

      heId = result.current.canvasElements[0].id

      act(() => {
        result.current.addElement(mockHydrogen, { x: 300, y: 300 })
      })

      hId = result.current.canvasElements[1].id

      act(() => {
        result.current.addBond(heId, hId, 'single')
      })

      expect(result.current.bonds).toHaveLength(0)
    })

    it('should keep first element selected if more bonds available', () => {
      const { result } = renderHook(() => useCompoundCanvasStore())

      let oId: string, h1Id: string

      act(() => {
        result.current.addElement(mockOxygen, { x: 100, y: 100 })
      })

      oId = result.current.canvasElements[0].id

      act(() => {
        result.current.addElement(mockHydrogen, { x: 300, y: 300 })
      })

      h1Id = result.current.canvasElements[1].id

      act(() => {
        result.current.addBond(oId, h1Id, 'single')
      })

      // Oxygen still has 1 bond available
      expect(result.current.selectedElementId).toBe(oId)
    })

    it('should deselect element when no more bonds available', () => {
      const { result } = renderHook(() => useCompoundCanvasStore())

      let oId: string, h1Id: string, h2Id: string

      act(() => {
        result.current.addElement(mockOxygen, { x: 100, y: 100 })
      })

      oId = result.current.canvasElements[0].id

      act(() => {
        result.current.addElement(mockHydrogen, { x: 200, y: 200 })
      })

      h1Id = result.current.canvasElements[1].id

      act(() => {
        result.current.addElement(mockHydrogen, { x: 300, y: 300 })
      })

      h2Id = result.current.canvasElements[2].id

      act(() => {
        result.current.addBond(oId, h1Id, 'single')
      })

      act(() => {
        result.current.addBond(oId, h2Id, 'single')
      })

      // Oxygen has no more bonds available
      expect(result.current.selectedElementId).toBeNull()
    })
  })

  describe('removeBond', () => {
    it('should remove bond', () => {
      const { result } = renderHook(() => useCompoundCanvasStore())

      let bondId: string

      act(() => {
        result.current.addElement(mockOxygen, { x: 100, y: 100 })
      })

      act(() => {
        result.current.addElement(mockHydrogen, { x: 160, y: 100 }) // Auto-bonds
      })

      bondId = result.current.bonds[0].id

      act(() => {
        result.current.removeBond(bondId)
      })

      expect(result.current.bonds).toHaveLength(0)
    })

    it('should ungroup elements when bond is removed', () => {
      const { result } = renderHook(() => useCompoundCanvasStore())

      let bondId: string

      act(() => {
        result.current.addElement(mockOxygen, { x: 100, y: 100 })
      })

      act(() => {
        result.current.addElement(mockHydrogen, { x: 160, y: 100 }) // Auto-bonds
      })

      bondId = result.current.bonds[0].id

      expect(result.current.canvasElements[0].groupId).toBeDefined()
      expect(result.current.canvasElements[1].groupId).toBeDefined()

      act(() => {
        result.current.removeBond(bondId)
      })

      expect(result.current.canvasElements[0].groupId).toBeUndefined()
      expect(result.current.canvasElements[1].groupId).toBeUndefined()
    })

    it('should deselect bond when it is removed', () => {
      const { result } = renderHook(() => useCompoundCanvasStore())

      let bondId: string

      act(() => {
        result.current.addElement(mockOxygen, { x: 100, y: 100 })
      })

      act(() => {
        result.current.addElement(mockHydrogen, { x: 160, y: 100 }) // Auto-bonds
      })

      bondId = result.current.bonds[0].id

      act(() => {
        result.current.selectBond(bondId)
      })

      expect(result.current.selectedBondId).toBe(bondId)

      act(() => {
        result.current.removeBond(bondId)
      })

      expect(result.current.selectedBondId).toBeNull()
    })
  })

  describe('updateBondType', () => {
    it('should update bond type', () => {
      const { result } = renderHook(() => useCompoundCanvasStore())

      let bondId: string

      act(() => {
        result.current.addElement(mockOxygen, { x: 100, y: 100 })
      })

      act(() => {
        result.current.addElement(mockHydrogen, { x: 160, y: 100 }) // Auto-bonds
      })

      bondId = result.current.bonds[0].id

      expect(result.current.bonds[0].bondType).toBe('single')

      act(() => {
        result.current.updateBondType(bondId, 'double')
      })

      expect(result.current.bonds[0].bondType).toBe('double')
    })
  })

  describe('getFormula', () => {
    it('should generate formula for water (H₂O)', () => {
      const { result } = renderHook(() => useCompoundCanvasStore())

      act(() => {
        result.current.addElement(mockOxygen, { x: 100, y: 100 })
      })

      act(() => {
        result.current.addElement(mockHydrogen, { x: 160, y: 100 }) // Auto-bonds
      })

      act(() => {
        result.current.addElement(mockHydrogen, { x: 40, y: 100 }) // Auto-bonds
      })

      const formula = result.current.getFormula()
      expect(formula).toBe('H₂O')
    })

    it('should only include bonded elements', () => {
      const { result } = renderHook(() => useCompoundCanvasStore())

      act(() => {
        result.current.addElement(mockOxygen, { x: 100, y: 100 })
      })

      act(() => {
        result.current.addElement(mockHydrogen, { x: 160, y: 100 }) // Auto-bonds
      })

      act(() => {
        result.current.addElement(mockHydrogen, { x: 500, y: 500 }) // Far away, no bond
      })

      const formula = result.current.getFormula()
      expect(formula).toBe('HO') // Only bonded H and O
    })

    it('should return empty string for no bonds', () => {
      const { result } = renderHook(() => useCompoundCanvasStore())

      act(() => {
        result.current.addElement(mockOxygen, { x: 100, y: 100 })
      })

      const formula = result.current.getFormula()
      expect(formula).toBe('')
    })
  })

  describe('getMolarMass', () => {
    it('should calculate molar mass for water (H₂O)', () => {
      const { result } = renderHook(() => useCompoundCanvasStore())

      act(() => {
        result.current.addElement(mockOxygen, { x: 100, y: 100 })
      })

      act(() => {
        result.current.addElement(mockHydrogen, { x: 160, y: 100 }) // Auto-bonds
      })

      act(() => {
        result.current.addElement(mockHydrogen, { x: 40, y: 100 }) // Auto-bonds
      })

      const molarMass = result.current.getMolarMass()
      expect(molarMass).toBeCloseTo(18.015, 2) // 2*1.008 + 15.999
    })

    it('should only include bonded elements', () => {
      const { result } = renderHook(() => useCompoundCanvasStore())

      act(() => {
        result.current.addElement(mockOxygen, { x: 100, y: 100 })
      })

      act(() => {
        result.current.addElement(mockHydrogen, { x: 160, y: 100 }) // Auto-bonds
      })

      act(() => {
        result.current.addElement(mockCarbon, { x: 500, y: 500 }) // Far away, no bond
      })

      const molarMass = result.current.getMolarMass()
      expect(molarMass).toBeCloseTo(17.007, 2) // 1.008 + 15.999, no carbon
    })

    it('should return 0 for no bonds', () => {
      const { result } = renderHook(() => useCompoundCanvasStore())

      act(() => {
        result.current.addElement(mockOxygen, { x: 100, y: 100 })
      })

      const molarMass = result.current.getMolarMass()
      expect(molarMass).toBe(0)
    })
  })

  describe('reset', () => {
    it('should reset all state', () => {
      const { result } = renderHook(() => useCompoundCanvasStore())

      act(() => {
        result.current.addElement(mockOxygen, { x: 100, y: 100 })
        result.current.addElement(mockHydrogen, { x: 150, y: 100 })
        result.current.setCompoundName('Water')
        result.current.setCompoundDescription('H2O molecule')
        result.current.setExternalFactors({ heat: { enabled: true } })
      })

      act(() => {
        result.current.reset()
      })

      expect(result.current.canvasElements).toHaveLength(0)
      expect(result.current.bonds).toHaveLength(0)
      expect(result.current.compoundName).toBe('')
      expect(result.current.compoundDescription).toBe('')
      expect(result.current.externalFactors).toEqual({})
      expect(result.current.selectedElementId).toBeNull()
      expect(result.current.selectedBondId).toBeNull()
      expect(result.current.zoom).toBe(1)
      expect(result.current.offset).toEqual({ x: 0, y: 0 })
    })
  })

  describe('setCompoundName and setCompoundDescription', () => {
    it('should set compound name', () => {
      const { result } = renderHook(() => useCompoundCanvasStore())

      act(() => {
        result.current.setCompoundName('Water')
      })

      expect(result.current.compoundName).toBe('Water')
    })

    it('should set compound description', () => {
      const { result } = renderHook(() => useCompoundCanvasStore())

      act(() => {
        result.current.setCompoundDescription('H2O molecule')
      })

      expect(result.current.compoundDescription).toBe('H2O molecule')
    })
  })

  describe('setExternalFactors', () => {
    it('should set external factors', () => {
      const { result } = renderHook(() => useCompoundCanvasStore())

      act(() => {
        result.current.setExternalFactors({
          temperature: { enabled: true, value: 100, unit: 'C' },
        })
      })

      expect(result.current.externalFactors.temperature).toEqual({
        enabled: true,
        value: 100,
        unit: 'C',
      })
    })

    it('should merge external factors', () => {
      const { result } = renderHook(() => useCompoundCanvasStore())

      act(() => {
        result.current.setExternalFactors({
          temperature: { enabled: true, value: 100, unit: 'C' },
        })
      })

      act(() => {
        result.current.setExternalFactors({
          pressure: { enabled: true, value: 1, unit: 'atm' },
        })
      })

      expect(result.current.externalFactors.temperature).toBeDefined()
      expect(result.current.externalFactors.pressure).toBeDefined()
    })
  })
})
