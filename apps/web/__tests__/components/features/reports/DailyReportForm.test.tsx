import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { DailyReportForm } from '@/components/features/reports/DailyReportForm'

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn()
}))

// Mock fetch
global.fetch = jest.fn()

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>

describe('DailyReportForm', () => {
  const mockOnSuccess = jest.fn()
  const mockOnCancel = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseSession.mockReturnValue({
      data: { user: { id: '1', name: 'Test User' } },
      status: 'authenticated'
    } as any)
  })

  test('renders form elements correctly', () => {
    render(
      <DailyReportForm
        projectId={1}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    )

    expect(screen.getByLabelText('報告日期 *')).toBeInTheDocument()
    expect(screen.getByLabelText('天氣狀況')).toBeInTheDocument()
    expect(screen.getByLabelText('進度記錄 *')).toBeInTheDocument()
    expect(screen.getByLabelText('問題與異常')).toBeInTheDocument()
    expect(screen.getByLabelText('備註說明')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /儲存/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /取消/ })).toBeInTheDocument()
  })

  test('shows validation errors for required fields', async () => {
    render(
      <DailyReportForm
        projectId={1}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    )

    const submitButton = screen.getByRole('button', { name: /儲存/ })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('進度記錄為必填項目')).toBeInTheDocument()
    })
  })

  test('submits form with valid data', async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 1, status: 'draft' })
    } as Response)

    render(
      <DailyReportForm
        projectId={1}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    )

    // Fill in required fields
    fireEvent.change(screen.getByLabelText('進度記錄 *'), {
      target: { value: 'Test progress notes' }
    })

    const submitButton = screen.getByRole('button', { name: /儲存/ })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/reports/daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('Test progress notes')
      })
    })

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled()
    })
  })

  test('handles file selection', () => {
    render(
      <DailyReportForm
        projectId={1}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    )

    const fileInput = screen.getByRole('button', { name: /選擇檔案/ })
    expect(fileInput).toBeInTheDocument()
  })

  test('calls onCancel when cancel button is clicked', () => {
    render(
      <DailyReportForm
        projectId={1}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    )

    const cancelButton = screen.getByRole('button', { name: /取消/ })
    fireEvent.click(cancelButton)

    expect(mockOnCancel).toHaveBeenCalled()
  })

  test('populates form when editing existing report', () => {
    const existingReport = {
      id: 1,
      projectId: 1,
      reportedBy: 1,
      reportDate: new Date('2023-12-01'),
      weather: 'sunny',
      progressNotes: 'Existing progress',
      issues: 'Some issues',
      content: 'Additional content',
      status: 'draft' as const,
      createdAt: new Date()
    }

    render(
      <DailyReportForm
        projectId={1}
        report={existingReport}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    )

    expect(screen.getByDisplayValue('Existing progress')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Some issues')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Additional content')).toBeInTheDocument()
  })
})