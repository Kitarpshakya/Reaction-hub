import {
  determineBondType,
  isMetal,
  isNonmetal,
  getValence,
  countElementBonds,
  getAvailableValence,
  bondExists,
  canFormBond,
  calculateDistance,
  areElementsClose,
  getBondDisplayName,
  shouldAutoGroup,
  getElementCategoryColor,
  calculateBubbleRadius,
} from '@/lib/utils/chemistry-helpers'
import {
  mockHydrogen,
  mockOxygen,
  mockCarbon,
  mockNitrogen,
  mockSodium,
  mockChlorine,
  mockIron,
  mockHelium,
  createMockBond,
} from '@/__tests__/mock-data'

describe('chemistry-helpers', () => {
  describe('determineBondType', () => {
    it('should return metallic bond for two metals', () => {
      const result = determineBondType(mockIron, mockIron)
      expect(result).toBe('metallic')
    })

    it('should return ionic bond for metal and nonmetal with large EN difference', () => {
      const result = determineBondType(mockSodium, mockChlorine)
      expect(result).toBe('ionic')
    })

    it('should return triple bond for N-N', () => {
      const result = determineBondType(mockNitrogen, mockNitrogen)
      expect(result).toBe('triple')
    })

    it('should return double bond for O-O', () => {
      const result = determineBondType(mockOxygen, mockOxygen)
      expect(result).toBe('double')
    })

    it('should return double bond for C-O', () => {
      const result = determineBondType(mockCarbon, mockOxygen)
      expect(result).toBe('double')
    })

    it('should return single bond for H-H', () => {
      const result = determineBondType(mockHydrogen, mockHydrogen)
      expect(result).toBe('single')
    })

    it('should return single bond for H-O', () => {
      const result = determineBondType(mockHydrogen, mockOxygen)
      expect(result).toBe('single')
    })

    it('should return single bond when electronegativity is missing', () => {
      const elementNoEN = { ...mockHydrogen, electronegativity: null }
      const result = determineBondType(elementNoEN, mockOxygen)
      expect(result).toBe('single')
    })
  })

  describe('isMetal', () => {
    it('should return true for alkali metals', () => {
      expect(isMetal(mockSodium)).toBe(true)
    })

    it('should return true for transition metals', () => {
      expect(isMetal(mockIron)).toBe(true)
    })

    it('should return false for nonmetals', () => {
      expect(isMetal(mockHydrogen)).toBe(false)
      expect(isMetal(mockOxygen)).toBe(false)
    })

    it('should return false for noble gases', () => {
      expect(isMetal(mockHelium)).toBe(false)
    })
  })

  describe('isNonmetal', () => {
    it('should return true for nonmetals', () => {
      expect(isNonmetal(mockHydrogen)).toBe(true)
      expect(isNonmetal(mockOxygen)).toBe(true)
    })

    it('should return true for halogens', () => {
      expect(isNonmetal(mockChlorine)).toBe(true)
    })

    it('should return false for metals', () => {
      expect(isNonmetal(mockSodium)).toBe(false)
      expect(isNonmetal(mockIron)).toBe(false)
    })

    it('should return false for noble gases', () => {
      expect(isNonmetal(mockHelium)).toBe(false)
    })
  })

  describe('getValence', () => {
    it('should return correct valence for hydrogen', () => {
      expect(getValence(mockHydrogen)).toBe(1)
    })

    it('should return correct valence for oxygen', () => {
      expect(getValence(mockOxygen)).toBe(2)
    })

    it('should return correct valence for nitrogen', () => {
      expect(getValence(mockNitrogen)).toBe(3)
    })

    it('should return correct valence for carbon', () => {
      expect(getValence(mockCarbon)).toBe(4)
    })

    it('should return correct valence for sodium', () => {
      expect(getValence(mockSodium)).toBe(1)
    })

    it('should return correct valence for chlorine', () => {
      expect(getValence(mockChlorine)).toBe(1)
    })

    it('should return correct valence for iron', () => {
      expect(getValence(mockIron)).toBe(3)
    })

    it('should return 0 for noble gases', () => {
      expect(getValence(mockHelium)).toBe(0)
    })

    it('should return default valence (2) for unknown elements', () => {
      const unknownElement = { ...mockHydrogen, symbol: 'Xx' }
      expect(getValence(unknownElement)).toBe(2)
    })
  })

  describe('countElementBonds', () => {
    it('should return 0 when element has no bonds', () => {
      const bonds = []
      const result = countElementBonds('h1', bonds)
      expect(result).toBe(0)
    })

    it('should count single bonds correctly', () => {
      const bonds = [
        createMockBond('b1', 'h1', 'o1', 'single'),
        createMockBond('b2', 'h2', 'o1', 'single'),
      ]
      const result = countElementBonds('o1', bonds)
      expect(result).toBe(2)
    })

    it('should count double bonds as 2', () => {
      const bonds = [createMockBond('b1', 'c1', 'o1', 'double')]
      const result = countElementBonds('c1', bonds)
      expect(result).toBe(2)
    })

    it('should count triple bonds as 3', () => {
      const bonds = [createMockBond('b1', 'n1', 'n2', 'triple')]
      const result = countElementBonds('n1', bonds)
      expect(result).toBe(3)
    })

    it('should sum multiple bonds correctly', () => {
      const bonds = [
        createMockBond('b1', 'c1', 'h1', 'single'),
        createMockBond('b2', 'c1', 'h2', 'single'),
        createMockBond('b3', 'c1', 'o1', 'double'),
      ]
      const result = countElementBonds('c1', bonds)
      expect(result).toBe(4) // 1 + 1 + 2
    })

    it('should count ionic bonds as 1', () => {
      const bonds = [createMockBond('b1', 'na1', 'cl1', 'ionic')]
      const result = countElementBonds('na1', bonds)
      expect(result).toBe(1)
    })
  })

  describe('getAvailableValence', () => {
    it('should return full valence when no bonds exist', () => {
      const result = getAvailableValence(mockOxygen, 'o1', [])
      expect(result).toBe(2)
    })

    it('should return remaining valence after single bond', () => {
      const bonds = [createMockBond('b1', 'o1', 'h1', 'single')]
      const result = getAvailableValence(mockOxygen, 'o1', bonds)
      expect(result).toBe(1)
    })

    it('should return 0 when all bonds are used', () => {
      const bonds = [
        createMockBond('b1', 'o1', 'h1', 'single'),
        createMockBond('b2', 'o1', 'h2', 'single'),
      ]
      const result = getAvailableValence(mockOxygen, 'o1', bonds)
      expect(result).toBe(0)
    })

    it('should return 0 when bonds exceed valence', () => {
      const bonds = [
        createMockBond('b1', 'h1', 'o1', 'single'),
        createMockBond('b2', 'h1', 'c1', 'single'),
      ]
      const result = getAvailableValence(mockHydrogen, 'h1', bonds)
      expect(result).toBe(0)
    })

    it('should handle double bonds correctly', () => {
      const bonds = [createMockBond('b1', 'c1', 'o1', 'double')]
      const result = getAvailableValence(mockCarbon, 'c1', bonds)
      expect(result).toBe(2) // Carbon has 4, used 2
    })
  })

  describe('bondExists', () => {
    const bonds = [
      createMockBond('b1', 'h1', 'o1', 'single'),
      createMockBond('b2', 'h2', 'o1', 'single'),
    ]

    it('should return true when bond exists (from -> to)', () => {
      expect(bondExists('h1', 'o1', bonds)).toBe(true)
    })

    it('should return true when bond exists (to -> from)', () => {
      expect(bondExists('o1', 'h1', bonds)).toBe(true)
    })

    it('should return false when bond does not exist', () => {
      expect(bondExists('h1', 'h2', bonds)).toBe(false)
    })

    it('should return false for empty bonds array', () => {
      expect(bondExists('h1', 'o1', [])).toBe(false)
    })
  })

  describe('canFormBond', () => {
    it('should return false if first element is noble gas', () => {
      const result = canFormBond(mockHelium, mockHydrogen, 'he1', 'h1', [])
      expect(result).toBe(false)
    })

    it('should return false if second element is noble gas', () => {
      const result = canFormBond(mockHydrogen, mockHelium, 'h1', 'he1', [])
      expect(result).toBe(false)
    })

    it('should return false if bond already exists', () => {
      const bonds = [createMockBond('b1', 'h1', 'o1', 'single')]
      const result = canFormBond(mockHydrogen, mockOxygen, 'h1', 'o1', bonds)
      expect(result).toBe(false)
    })

    it('should return false if first element has no available valence', () => {
      const bonds = [createMockBond('b1', 'h1', 'o1', 'single')]
      const result = canFormBond(mockHydrogen, mockCarbon, 'h1', 'c1', bonds)
      expect(result).toBe(false)
    })

    it('should return false if second element has no available valence', () => {
      const bonds = [
        createMockBond('b1', 'o1', 'h1', 'single'),
        createMockBond('b2', 'o1', 'h2', 'single'),
      ]
      const result = canFormBond(mockCarbon, mockOxygen, 'c1', 'o1', bonds)
      expect(result).toBe(false)
    })

    it('should return true if both elements have available valence', () => {
      const result = canFormBond(mockHydrogen, mockOxygen, 'h1', 'o1', [])
      expect(result).toBe(true)
    })

    it('should return true if partially bonded elements can bond more', () => {
      const bonds = [createMockBond('b1', 'o1', 'h1', 'single')]
      const result = canFormBond(mockOxygen, mockHydrogen, 'o1', 'h2', bonds)
      expect(result).toBe(true)
    })
  })

  describe('calculateDistance', () => {
    it('should calculate distance correctly for horizontal points', () => {
      const result = calculateDistance({ x: 0, y: 0 }, { x: 10, y: 0 })
      expect(result).toBe(10)
    })

    it('should calculate distance correctly for vertical points', () => {
      const result = calculateDistance({ x: 0, y: 0 }, { x: 0, y: 10 })
      expect(result).toBe(10)
    })

    it('should calculate distance correctly for diagonal points', () => {
      const result = calculateDistance({ x: 0, y: 0 }, { x: 3, y: 4 })
      expect(result).toBe(5)
    })

    it('should return 0 for same points', () => {
      const result = calculateDistance({ x: 5, y: 5 }, { x: 5, y: 5 })
      expect(result).toBe(0)
    })

    it('should handle negative coordinates', () => {
      const result = calculateDistance({ x: -3, y: -4 }, { x: 0, y: 0 })
      expect(result).toBe(5)
    })
  })

  describe('areElementsClose', () => {
    it('should return true when distance is less than threshold', () => {
      const result = areElementsClose({ x: 0, y: 0 }, { x: 50, y: 0 }, 100)
      expect(result).toBe(true)
    })

    it('should return true when distance equals threshold', () => {
      const result = areElementsClose({ x: 0, y: 0 }, { x: 100, y: 0 }, 100)
      expect(result).toBe(true)
    })

    it('should return false when distance exceeds threshold', () => {
      const result = areElementsClose({ x: 0, y: 0 }, { x: 150, y: 0 }, 100)
      expect(result).toBe(false)
    })

    it('should use default threshold of 100', () => {
      const result = areElementsClose({ x: 0, y: 0 }, { x: 80, y: 60 })
      expect(result).toBe(true) // distance = 100
    })
  })

  describe('getBondDisplayName', () => {
    it('should return correct display names', () => {
      expect(getBondDisplayName('single')).toBe('Single Bond')
      expect(getBondDisplayName('double')).toBe('Double Bond')
      expect(getBondDisplayName('triple')).toBe('Triple Bond')
      expect(getBondDisplayName('ionic')).toBe('Ionic Bond')
      expect(getBondDisplayName('covalent')).toBe('Covalent Bond')
      expect(getBondDisplayName('metallic')).toBe('Metallic Bond')
    })
  })

  describe('shouldAutoGroup', () => {
    const existingElements = [
      { id: 'e1', position: { x: 0, y: 0 } },
      { id: 'e2', position: { x: 50, y: 0 } },
      { id: 'e3', position: { x: 200, y: 0 } },
    ]

    it('should return nearby elements within threshold', () => {
      const newElement = { id: 'new', position: { x: 70, y: 0 } }
      const result = shouldAutoGroup(existingElements, newElement, 50)
      expect(result).toContain('e2')
      expect(result).not.toContain('e1') // 70px away, beyond threshold
      expect(result).not.toContain('e3') // 130px away, beyond threshold
    })

    it('should return multiple nearby elements', () => {
      const newElement = { id: 'new', position: { x: 30, y: 0 } }
      const result = shouldAutoGroup(existingElements, newElement, 80)
      expect(result).toContain('e1')
      expect(result).toContain('e2')
      expect(result).not.toContain('e3')
    })

    it('should return empty array if no elements are close', () => {
      const newElement = { id: 'new', position: { x: 500, y: 500 } }
      const result = shouldAutoGroup(existingElements, newElement, 80)
      expect(result).toEqual([])
    })

    it('should not include the element itself', () => {
      const newElement = { id: 'e1', position: { x: 0, y: 0 } }
      const result = shouldAutoGroup(existingElements, newElement, 80)
      expect(result).not.toContain('e1')
    })
  })

  describe('getElementCategoryColor', () => {
    it('should return correct colors for categories', () => {
      expect(getElementCategoryColor('nonmetal')).toBe('#4ECDC4')
      expect(getElementCategoryColor('noble-gas')).toBe('#95E1D3')
      expect(getElementCategoryColor('alkali-metal')).toBe('#F38181')
      expect(getElementCategoryColor('alkaline-earth-metal')).toBe('#FDCB6E')
      expect(getElementCategoryColor('transition-metal')).toBe('#A29BFE')
      expect(getElementCategoryColor('post-transition-metal')).toBe('#74B9FF')
      expect(getElementCategoryColor('metalloid')).toBe('#FD79A8')
      expect(getElementCategoryColor('halogen')).toBe('#FF7675')
      expect(getElementCategoryColor('lanthanide')).toBe('#FFEAA7')
      expect(getElementCategoryColor('actinide')).toBe('#DFE6E9')
    })

    it('should return default color for unknown category', () => {
      expect(getElementCategoryColor('unknown')).toBe('#B2BEC3')
      expect(getElementCategoryColor('invalid-category')).toBe('#B2BEC3')
    })
  })

  describe('calculateBubbleRadius', () => {
    it('should calculate radius based on atomic mass', () => {
      const result = calculateBubbleRadius(16, 3) // Oxygen
      expect(result).toBe(12) // sqrt(16) * 3
    })

    it('should use default scale factor of 3', () => {
      const result = calculateBubbleRadius(16)
      expect(result).toBe(12)
    })

    it('should handle different scale factors', () => {
      const result = calculateBubbleRadius(16, 5)
      expect(result).toBe(20)
    })

    it('should work for very light elements', () => {
      const result = calculateBubbleRadius(1, 3) // Hydrogen
      expect(result).toBe(3)
    })

    it('should work for heavy elements', () => {
      const result = calculateBubbleRadius(100, 3)
      expect(result).toBe(30)
    })
  })
})
