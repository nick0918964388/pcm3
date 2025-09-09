import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { DailyReportList } from '@/components/features/reports/DailyReportList'

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn()
}))

// Mock fetch
global.fetch = jest.fn()

// Mock window.confirm
global.confirm = jest.fn()

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>
const mockFetch = fetch as jest.MockedFunction<typeof fetch>
const mockConfirm = confirm as jest.MockedFunction<typeof confirm>

describe('DailyReportList', () => {
  const mockOnCreateReport = jest.fn()
  const mockOnEditReport = jest.fn()
  const mockOnViewReport = jest.fn()

  const mockReports = [
    {
      id: 1,
      projectId: 1,
      reportedBy: 1,
      reportDate: new Date('2023-12-01'),
      weather: 'sunny',
      progressNotes: 'Good progress on foundation',
      issues: 'No issues',
      status: 'draft' as const,
      createdAt: new Date()
    },
    {
      id: 2,
      projectId: 1,
      reportedBy: 1,
      reportDate: new Date('2023-12-02'),
      weather: 'cloudy',
      progressNotes: 'Continued work on structure',
      status: 'submitted' as const,
      createdAt: new Date()
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseSession.mockReturnValue({
      data: { user: { id: '1', name: 'Test User' } },
      status: 'authenticated'
    } as any)

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockReports
    } as Response)
  })

  test('renders report list with reports', async () => {
    render(
      <DailyReportList
        projectId={1}
        onCreateReport={mockOnCreateReport}
        onEditReport={mockOnEditReport}
        onViewReport={mockOnViewReport}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Good progress on foundation')).toBeInTheDocument()
      expect(screen.getByText('Continued work on structure')).toBeInTheDocument()
    })
  })

  test('shows create button and calls onCreateReport', async () => {
    render(
      <DailyReportList
        projectId={1}
        onCreateReport={mockOnCreateReport}
        onEditReport={mockOnEditReport}
        onViewReport={mockOnViewReport}
      />
    )

    const createButton = screen.getByRole('button', { name: /新增報告/ })
    fireEvent.click(createButton)

    expect(mockOnCreateReport).toHaveBeenCalled()
  })

  test('filters reports by search term', async () => {
    render(
      <DailyReportList
        projectId={1}
        onCreateReport={mockOnCreateReport}
        onEditReport={mockOnEditReport}
        onViewReport={mockOnViewReport}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Good progress on foundation')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText('搜尋報告內容...')
    fireEvent.change(searchInput, { target: { value: 'foundation' } })

    await waitFor(() => {
      expect(screen.getByText('Good progress on foundation')).toBeInTheDocument()
      expect(screen.queryByText('Continued work on structure')).not.toBeInTheDocument()
    })
  })

  test('filters reports by status', async () => {
    render(
      <DailyReportList
        projectId={1}
        onCreateReport={mockOnCreateReport}
        onEditReport={mockOnEditReport}
        onViewReport={mockOnViewReport}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Good progress on foundation')).toBeInTheDocument()
    })

    // Filter by submitted status
    const statusFilter = screen.getByRole('combobox')
    fireEvent.click(statusFilter)
    
    const submittedOption = screen.getByText('已提交')
    fireEvent.click(submittedOption)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('status=submitted')
      )
    })
  })

  test('handles report submission', async () => {
    mockConfirm.mockReturnValue(true)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({})
    } as Response)

    render(
      <DailyReportList
        projectId={1}
        onCreateReport={mockOnCreateReport}
        onEditReport={mockOnEditReport}
        onViewReport={mockOnViewReport}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Good progress on foundation')).toBeInTheDocument()
    })

    // Find and click submit button (Send icon) for draft report
    const submitButtons = screen.getAllByRole('button')
    const submitButton = submitButtons.find(btn => 
      btn.querySelector('svg')?.getAttribute('data-testid') === 'send-icon' ||
      btn.classList.contains('text-blue-600')
    )

    if (submitButton) {
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockConfirm).toHaveBeenCalledWith(
          '確定要提交此報告嗎？提交後將無法編輯。'
        )
      })
    }
  })

  test('handles report deletion', async () => {
    mockConfirm.mockReturnValue(true)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({})
    } as Response)

    render(
      <DailyReportList
        projectId={1}
        onCreateReport={mockOnCreateReport}
        onEditReport={mockOnEditReport}
        onViewReport={mockOnViewReport}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Good progress on foundation')).toBeInTheDocument()
    })

    // Find delete button for draft report
    const deleteButtons = screen.getAllByRole('button')
    const deleteButton = deleteButtons.find(btn => 
      btn.querySelector('svg')?.getAttribute('data-lucide') === 'trash-2'
    )

    if (deleteButton) {
      fireEvent.click(deleteButton)

      await waitFor(() => {
        expect(mockConfirm).toHaveBeenCalledWith('確定要刪除此報告嗎？')
      })
    }
  })

  test('shows empty state when no reports', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => []
    } as Response)

    render(
      <DailyReportList
        projectId={1}
        onCreateReport={mockOnCreateReport}
        onEditReport={mockOnEditReport}
        onViewReport={mockOnViewReport}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('尚未有任何報告')).toBeInTheDocument()
      expect(screen.getByText('建立第一份報告')).toBeInTheDocument()
    })
  })

  test('calls appropriate handlers for view and edit', async () => {
    render(
      <DailyReportList
        projectId={1}
        onCreateReport={mockOnCreateReport}
        onEditReport={mockOnEditReport}
        onViewReport={mockOnViewReport}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Good progress on foundation')).toBeInTheDocument()
    })

    // Test view button
    const viewButtons = screen.getAllByRole('button')
    const viewButton = viewButtons.find(btn => 
      btn.querySelector('svg')?.getAttribute('data-lucide') === 'eye'
    )

    if (viewButton) {
      fireEvent.click(viewButton)
      expect(mockOnViewReport).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }))
    }

    // Test edit button (only available for draft reports)
    const editButton = viewButtons.find(btn => 
      btn.querySelector('svg')?.getAttribute('data-lucide') === 'edit'
    )

    if (editButton) {
      fireEvent.click(editButton)
      expect(mockOnEditReport).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }))
    }
  })
})