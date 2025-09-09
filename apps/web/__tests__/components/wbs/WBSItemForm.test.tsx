import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WBSItemForm } from '@/components/features/wbs/WBSItemForm'
import { WBSItem, WBSCreateRequest, WBSUpdateRequest } from '@shared/types'

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  X: () => <div data-testid="close-icon" />
}))

describe('WBSItemForm Component', () => {
  const mockOnSave = jest.fn()
  const mockOnCancel = jest.fn()

  const mockParentItem: WBSItem = {
    id: 1,
    projectId: 100,
    parentId: null,
    code: '1.0',
    name: '系統分析',
    levelNumber: 1,
    sortOrder: 0,
    createdAt: new Date()
  }

  const mockEditItem: WBSItem = {
    id: 2,
    projectId: 100,
    parentId: 1,
    code: '1.1',
    name: '需求分析',
    description: '分析系統需求',
    levelNumber: 2,
    sortOrder: 0,
    createdAt: new Date()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Create Mode', () => {
    it('should render create form for root item', () => {
      render(
        <WBSItemForm
          projectId={100}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByText('新增根項目')).toBeInTheDocument()
      expect(screen.getByDisplayValue('1.0')).toBeInTheDocument() // Default suggested code
      expect(screen.getByText('建立項目')).toBeInTheDocument()
    })

    it('should render create form for child item', () => {
      render(
        <WBSItemForm
          parentItem={mockParentItem}
          projectId={100}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByText('新增子項目 (上級: 1.0)')).toBeInTheDocument()
      expect(screen.getByDisplayValue('1.0.1')).toBeInTheDocument() // Suggested child code
    })

    it('should validate required fields on create', async () => {
      const user = userEvent.setup()

      render(
        <WBSItemForm
          projectId={100}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      )

      // Clear the default code and try to submit
      const codeInput = screen.getByDisplayValue('1.0')
      await user.clear(codeInput)

      const submitButton = screen.getByText('建立項目')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('請輸入 WBS 代碼')).toBeInTheDocument()
        expect(screen.getByText('請輸入項目名稱')).toBeInTheDocument()
      })

      expect(mockOnSave).not.toHaveBeenCalled()
    })

    it('should validate WBS code format', async () => {
      const user = userEvent.setup()

      render(
        <WBSItemForm
          projectId={100}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      )

      const codeInput = screen.getByDisplayValue('1.0')
      await user.clear(codeInput)
      await user.type(codeInput, 'invalid code with spaces!')

      const nameInput = screen.getByLabelText(/項目名稱/)
      await user.type(nameInput, '測試項目')

      const submitButton = screen.getByText('建立項目')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('WBS 代碼只能包含字母、數字、點號和連字號')).toBeInTheDocument()
      })

      expect(mockOnSave).not.toHaveBeenCalled()
    })

    it('should submit valid create form', async () => {
      const user = userEvent.setup()

      render(
        <WBSItemForm
          projectId={100}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      )

      const nameInput = screen.getByLabelText(/項目名稱/)
      await user.type(nameInput, '系統分析')

      const descriptionInput = screen.getByLabelText(/項目描述/)
      await user.type(descriptionInput, '系統分析階段')

      const submitButton = screen.getByText('建立項目')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith({
          projectId: 100,
          parentId: undefined,
          code: '1.0',
          name: '系統分析',
          description: '系統分析階段',
          changeReason: undefined
        } as WBSCreateRequest)
      })
    })
  })

  describe('Edit Mode', () => {
    it('should render edit form with existing data', () => {
      render(
        <WBSItemForm
          editItem={mockEditItem}
          projectId={100}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByText('編輯 WBS 項目: 1.1')).toBeInTheDocument()
      expect(screen.getByDisplayValue('1.1')).toBeInTheDocument()
      expect(screen.getByDisplayValue('需求分析')).toBeInTheDocument()
      expect(screen.getByDisplayValue('分析系統需求')).toBeInTheDocument()
      expect(screen.getByText('更新項目')).toBeInTheDocument()
    })

    it('should require change reason for edits', async () => {
      const user = userEvent.setup()

      render(
        <WBSItemForm
          editItem={mockEditItem}
          projectId={100}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      )

      const submitButton = screen.getByText('更新項目')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('編輯項目時請說明變更原因')).toBeInTheDocument()
      })

      expect(mockOnSave).not.toHaveBeenCalled()
    })

    it('should submit valid edit form', async () => {
      const user = userEvent.setup()

      render(
        <WBSItemForm
          editItem={mockEditItem}
          projectId={100}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      )

      const nameInput = screen.getByDisplayValue('需求分析')
      await user.clear(nameInput)
      await user.type(nameInput, '需求分析更新')

      const changeReasonInput = screen.getByLabelText(/變更原因/)
      await user.type(changeReasonInput, '更新項目名稱')

      const submitButton = screen.getByText('更新項目')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith({
          code: '1.1',
          name: '需求分析更新',
          description: '分析系統需求',
          changeReason: '更新項目名稱'
        } as WBSUpdateRequest)
      })
    })
  })

  describe('Common Functionality', () => {
    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup()

      render(
        <WBSItemForm
          projectId={100}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      )

      const cancelButton = screen.getByText('取消')
      await user.click(cancelButton)

      expect(mockOnCancel).toHaveBeenCalled()
    })

    it('should call onCancel when close icon is clicked', async () => {
      const user = userEvent.setup()

      render(
        <WBSItemForm
          projectId={100}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      )

      const closeIcon = screen.getByTestId('close-icon')
      await user.click(closeIcon)

      expect(mockOnCancel).toHaveBeenCalled()
    })

    it('should clear field errors when user starts typing', async () => {
      const user = userEvent.setup()

      render(
        <WBSItemForm
          projectId={100}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      )

      // Clear code to trigger validation error
      const codeInput = screen.getByDisplayValue('1.0')
      await user.clear(codeInput)

      const submitButton = screen.getByText('建立項目')
      await user.click(submitButton)

      // Error should appear
      await waitFor(() => {
        expect(screen.getByText('請輸入 WBS 代碼')).toBeInTheDocument()
      })

      // Start typing to clear error
      await user.type(codeInput, '2.0')

      await waitFor(() => {
        expect(screen.queryByText('請輸入 WBS 代碼')).not.toBeInTheDocument()
      })
    })

    it('should disable form when loading', () => {
      render(
        <WBSItemForm
          projectId={100}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          isLoading={true}
        />
      )

      const codeInput = screen.getByDisplayValue('1.0')
      const nameInput = screen.getByLabelText(/項目名稱/)
      const submitButton = screen.getByText('處理中...')

      expect(codeInput).toBeDisabled()
      expect(nameInput).toBeDisabled()
      expect(submitButton).toBeDisabled()
    })
  })
})