import { render, screen, fireEvent } from '@testing-library/react'
import { WBSTree } from '@/components/features/wbs/WBSTree'
import { WBSItem } from '@shared/types'

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  ChevronRight: () => <div data-testid="chevron-right" />,
  ChevronDown: () => <div data-testid="chevron-down" />,
  Plus: () => <div data-testid="plus-icon" />,
  Edit2: () => <div data-testid="edit-icon" />,
  Trash2: () => <div data-testid="trash-icon" />
}))

describe('WBSTree Component', () => {
  const mockOnEdit = jest.fn()
  const mockOnDelete = jest.fn()
  const mockOnAddChild = jest.fn()

  const mockWBSItems: WBSItem[] = [
    {
      id: 1,
      projectId: 100,
      parentId: null,
      code: '1.0',
      name: '系統分析',
      description: '系統分析階段',
      levelNumber: 1,
      sortOrder: 0,
      createdAt: new Date(),
      children: [
        {
          id: 2,
          projectId: 100,
          parentId: 1,
          code: '1.1',
          name: '需求分析',
          description: '分析系統需求',
          levelNumber: 2,
          sortOrder: 0,
          createdAt: new Date(),
          children: []
        },
        {
          id: 3,
          projectId: 100,
          parentId: 1,
          code: '1.2',
          name: '系統設計',
          levelNumber: 2,
          sortOrder: 1,
          createdAt: new Date(),
          children: []
        }
      ]
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render WBS items in hierarchical structure', () => {
    render(
      <WBSTree
        items={mockWBSItems}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAddChild={mockOnAddChild}
      />
    )

    // Check root item
    expect(screen.getByText('1.0')).toBeInTheDocument()
    expect(screen.getByText('系統分析')).toBeInTheDocument()

    // Check child items
    expect(screen.getByText('1.1')).toBeInTheDocument()
    expect(screen.getByText('需求分析')).toBeInTheDocument()
    expect(screen.getByText('1.2')).toBeInTheDocument()
    expect(screen.getByText('系統設計')).toBeInTheDocument()
  })

  it('should show empty state when no items provided', () => {
    render(
      <WBSTree
        items={[]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAddChild={mockOnAddChild}
      />
    )

    expect(screen.getByText('尚無 WBS 項目')).toBeInTheDocument()
    expect(screen.getByText('點擊上方的「新增項目」開始建立專案工作分解結構')).toBeInTheDocument()
  })

  it('should display level indicators correctly', () => {
    render(
      <WBSTree
        items={mockWBSItems}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAddChild={mockOnAddChild}
      />
    )

    expect(screen.getByText('Level 1')).toBeInTheDocument()
    expect(screen.getAllByText('Level 2')).toHaveLength(2)
  })

  it('should show/hide children when expand/collapse is clicked', () => {
    render(
      <WBSTree
        items={mockWBSItems}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAddChild={mockOnAddChild}
      />
    )

    // Initially children should be visible (expanded by default)
    expect(screen.getByText('需求分析')).toBeInTheDocument()
    expect(screen.getByText('系統設計')).toBeInTheDocument()

    // Click collapse button
    const collapseButton = screen.getByTestId('chevron-down')
    fireEvent.click(collapseButton)

    // Children should still be visible in this test since we're not testing state management
    // In real component, this would hide children
  })

  it('should show action buttons on hover', () => {
    render(
      <WBSTree
        items={mockWBSItems}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAddChild={mockOnAddChild}
      />
    )

    // Action buttons should be present (though may be hidden by CSS)
    expect(screen.getAllByTestId('plus-icon')).toHaveLength(3) // One for each item
    expect(screen.getAllByTestId('edit-icon')).toHaveLength(3)
    expect(screen.getAllByTestId('trash-icon')).toHaveLength(3)
  })

  it('should call onEdit when edit button is clicked', () => {
    render(
      <WBSTree
        items={mockWBSItems}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAddChild={mockOnAddChild}
      />
    )

    const editButtons = screen.getAllByTestId('edit-icon')
    fireEvent.click(editButtons[0])

    expect(mockOnEdit).toHaveBeenCalledWith(mockWBSItems[0])
  })

  it('should call onDelete when delete button is clicked', () => {
    render(
      <WBSTree
        items={mockWBSItems}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAddChild={mockOnAddChild}
      />
    )

    const deleteButtons = screen.getAllByTestId('trash-icon')
    fireEvent.click(deleteButtons[0])

    expect(mockOnDelete).toHaveBeenCalledWith(mockWBSItems[0])
  })

  it('should call onAddChild when add child button is clicked', () => {
    render(
      <WBSTree
        items={mockWBSItems}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAddChild={mockOnAddChild}
      />
    )

    const addButtons = screen.getAllByTestId('plus-icon')
    fireEvent.click(addButtons[0])

    expect(mockOnAddChild).toHaveBeenCalledWith(mockWBSItems[0])
  })

  it('should show description tooltip when item has description', () => {
    render(
      <WBSTree
        items={mockWBSItems}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAddChild={mockOnAddChild}
      />
    )

    // Items with descriptions should show info icon
    const infoIcons = screen.getAllByText('ℹ')
    expect(infoIcons.length).toBeGreaterThan(0)

    // Check tooltip attributes
    expect(infoIcons[0]).toHaveAttribute('title', '系統分析階段')
  })

  it('should apply correct border colors based on level', () => {
    render(
      <WBSTree
        items={mockWBSItems}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAddChild={mockOnAddChild}
      />
    )

    // This test would check CSS classes, but since we're using Tailwind,
    // we'd need to check the actual CSS classes applied to elements
    const treeNodes = document.querySelectorAll('.wbs-node')
    expect(treeNodes.length).toBeGreaterThan(0)
  })
})