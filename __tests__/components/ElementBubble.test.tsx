import React from 'react'
import { render, screen } from '@/__tests__/test-utils'
import { DndContext } from '@dnd-kit/core'
import ElementBubble from '@/components/compounds/create/ElementBubble'
import { mockOxygen, mockHydrogen, mockHelium } from '@/__tests__/mock-data'

// Mock the element-helpers module
jest.mock('@/lib/utils/element-helpers', () => ({
  getCategoryColor: jest.fn((category: string) => {
    const colors: Record<string, string> = {
      'nonmetal': '#4ECDC4',
      'noble-gas': '#95E1D3',
      'alkali-metal': '#F38181',
    }
    return colors[category] || '#B2BEC3'
  }),
}))

describe('ElementBubble', () => {
  const defaultProps = {
    id: 'test-element-1',
    element: mockOxygen,
    position: { x: 100, y: 100 },
    isSelected: false,
    isBonded: false,
    availableValence: 2,
    onSelect: jest.fn(),
    onRemove: jest.fn(),
  }

  const renderWithDnd = (ui: React.ReactElement) => {
    return render(
      <DndContext>
        {ui}
      </DndContext>
    )
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render element symbol', () => {
    renderWithDnd(<ElementBubble {...defaultProps} />)
    expect(screen.getByText('O')).toBeInTheDocument()
  })

  it('should show remove button', () => {
    renderWithDnd(<ElementBubble {...defaultProps} />)
    const removeButton = screen.getByTitle('Remove element')
    expect(removeButton).toBeInTheDocument()
  })

  it('should call onRemove when remove button is clicked', () => {
    const onRemove = jest.fn()
    renderWithDnd(<ElementBubble {...defaultProps} onRemove={onRemove} />)

    const removeButton = screen.getByTitle('Remove element')
    removeButton.click()

    expect(onRemove).toHaveBeenCalledTimes(1)
  })

  it('should show unbonded indicator when not bonded', () => {
    renderWithDnd(<ElementBubble {...defaultProps} isBonded={false} />)
    const unbondedIndicator = screen.getByTitle('Unbonded - not included in formula')
    expect(unbondedIndicator).toBeInTheDocument()
    expect(unbondedIndicator).toHaveTextContent('!')
  })

  it('should not show unbonded indicator when bonded', () => {
    renderWithDnd(<ElementBubble {...defaultProps} isBonded={true} />)
    const unbondedIndicator = screen.queryByTitle('Unbonded - not included in formula')
    expect(unbondedIndicator).not.toBeInTheDocument()
  })

  it('should show available valence badge when selected and has available bonds', () => {
    renderWithDnd(<ElementBubble {...defaultProps} isSelected={true} availableValence={2} />)
    const badge = screen.getByTitle('Can form 2 more bonds')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveTextContent('+2')
  })

  it('should show singular bond text when availableValence is 1', () => {
    renderWithDnd(<ElementBubble {...defaultProps} isSelected={true} availableValence={1} />)
    const badge = screen.getByTitle('Can form 1 more bond')
    expect(badge).toBeInTheDocument()
  })

  it('should show FULL badge when selected with no available valence and bonded', () => {
    renderWithDnd(
      <ElementBubble {...defaultProps} isSelected={true} availableValence={0} isBonded={true} />
    )
    const badge = screen.getByTitle('Cannot form more bonds')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveTextContent('FULL')
  })

  it('should not show valence badge when not selected', () => {
    renderWithDnd(<ElementBubble {...defaultProps} isSelected={false} availableValence={2} />)
    const badge = screen.queryByTitle('Can form 2 more bonds')
    expect(badge).not.toBeInTheDocument()
  })

  it('should apply selected styles when selected', () => {
    const { container } = renderWithDnd(
      <ElementBubble {...defaultProps} isSelected={true} />
    )
    const elementDiv = container.querySelector('div[class*="ring-4"]')
    expect(elementDiv).toBeInTheDocument()
    expect(elementDiv).toHaveClass('ring-blue-400')
  })

  it('should apply bonded styles when bonded but not selected', () => {
    const { container } = renderWithDnd(
      <ElementBubble {...defaultProps} isSelected={false} isBonded={true} />
    )
    const elementDiv = container.querySelector('div[class*="ring-1"]')
    expect(elementDiv).toBeInTheDocument()
  })

  it('should apply unbonded styles when not bonded and not selected', () => {
    const { container } = renderWithDnd(
      <ElementBubble {...defaultProps} isSelected={false} isBonded={false} />
    )
    const elementDiv = container.querySelector('div[class*="ring-dashed"]')
    expect(elementDiv).toBeInTheDocument()
    expect(elementDiv).toHaveClass('ring-yellow-400')
  })

  it('should position element at specified coordinates', () => {
    const { container } = renderWithDnd(
      <ElementBubble {...defaultProps} position={{ x: 250, y: 350 }} />
    )

    const elementDiv = container.firstChild as HTMLElement
    expect(elementDiv.style.left).toBe('250px')
    expect(elementDiv.style.top).toBe('350px')
  })

  it('should have fixed size of 60px', () => {
    const { container } = renderWithDnd(<ElementBubble {...defaultProps} />)

    const elementDiv = container.firstChild as HTMLElement
    expect(elementDiv.style.width).toBe('60px')
    expect(elementDiv.style.height).toBe('60px')
  })

  it('should apply grab cursor when not dragging', () => {
    const { container } = renderWithDnd(<ElementBubble {...defaultProps} />)

    const elementDiv = container.firstChild as HTMLElement
    expect(elementDiv.style.cursor).toBe('grab')
  })
})
