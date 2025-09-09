import { render, screen, fireEvent } from '@testing-library/react'
import DutyCalendar from '../../../../src/components/features/duty-roster/DutyCalendar'

const mockDutyRosters = [
  {
    id: 1,
    projectId: 1,
    personnelId: 1,
    dutyDate: new Date('2024-01-15'),
    shiftType: 'day',
    notes: 'Test duty',
    personnelName: 'John Doe',
    personnelPosition: 'Engineer',
    subcontractorName: 'Test Company'
  },
  {
    id: 2,
    projectId: 1,
    personnelId: 2,
    dutyDate: new Date('2024-01-15'),
    shiftType: 'night',
    notes: 'Night shift',
    personnelName: 'Jane Smith',
    personnelPosition: 'Technician',
    subcontractorName: 'Another Company'
  }
]

const mockPersonnel = [
  { id: 1, name: 'John Doe', position: 'Engineer', subcontractorName: 'Test Company' },
  { id: 2, name: 'Jane Smith', position: 'Technician', subcontractorName: 'Another Company' }
]

const defaultProps = {
  projectId: 1,
  dutyRosters: mockDutyRosters,
  personnel: mockPersonnel,
  onDateSelect: jest.fn(),
  onRosterClick: jest.fn(),
  onCreateRoster: jest.fn()
}

describe('DutyCalendar', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render calendar with current month', () => {
    render(<DutyCalendar {...defaultProps} />)
    
    expect(screen.getByText(/年/)).toBeInTheDocument()
    expect(screen.getByText('今天')).toBeInTheDocument()
  })

  it('should display duty rosters on calendar dates', () => {
    render(<DutyCalendar {...defaultProps} />)
    
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.getByText('日班')).toBeInTheDocument()
    expect(screen.getByText('夜班')).toBeInTheDocument()
  })

  it('should call onRosterClick when clicking on a roster', () => {
    render(<DutyCalendar {...defaultProps} />)
    
    const rosterElement = screen.getByText('John Doe')
    fireEvent.click(rosterElement)
    
    expect(defaultProps.onRosterClick).toHaveBeenCalledWith(mockDutyRosters[0])
  })

  it('should call onCreateRoster when clicking on empty date', () => {
    render(<DutyCalendar {...defaultProps} dutyRosters={[]} />)
    
    const addButton = screen.getByText('新增值班')
    fireEvent.click(addButton)
    
    expect(defaultProps.onCreateRoster).toHaveBeenCalled()
  })

  it('should navigate months correctly', () => {
    render(<DutyCalendar {...defaultProps} />)
    
    const prevButton = screen.getAllByRole('button')[0] // First chevron button
    const nextButton = screen.getAllByRole('button')[1] // Second chevron button
    
    fireEvent.click(nextButton)
    fireEvent.click(prevButton)
    
    // Should still display current month after navigation
    expect(screen.getByText(/年/)).toBeInTheDocument()
  })

  it('should show today date highlighted', () => {
    render(<DutyCalendar {...defaultProps} />)
    
    const today = new Date().getDate()
    const todayElement = screen.getByText(today.toString())
    
    // Check if today's date has the blue styling class
    expect(todayElement.closest('div')).toHaveClass('text-blue-600')
  })

  it('should display shift colors correctly', () => {
    render(<DutyCalendar {...defaultProps} />)
    
    const dayShiftElement = screen.getByText('John Doe').closest('div')
    const nightShiftElement = screen.getByText('Jane Smith').closest('div')
    
    expect(dayShiftElement).toHaveClass('bg-blue-100', 'text-blue-800')
    expect(nightShiftElement).toHaveClass('bg-purple-100', 'text-purple-800')
  })

  it('should show legend for shift types', () => {
    render(<DutyCalendar {...defaultProps} />)
    
    expect(screen.getByText('日班')).toBeInTheDocument()
    expect(screen.getByText('夜班')).toBeInTheDocument()
    expect(screen.getByText('自訂班別')).toBeInTheDocument()
  })

  it('should handle view mode toggle', () => {
    render(<DutyCalendar {...defaultProps} />)
    
    const viewModeSelect = screen.getByDisplayValue('月視圖')
    fireEvent.change(viewModeSelect, { target: { value: 'week' } })
    
    expect(viewModeSelect).toHaveValue('week')
  })

  it('should show "更多" text when too many rosters on one date', () => {
    const manyRosters = Array.from({ length: 5 }, (_, i) => ({
      id: i + 1,
      projectId: 1,
      personnelId: i + 1,
      dutyDate: new Date('2024-01-15'),
      shiftType: 'day',
      notes: `Roster ${i + 1}`,
      personnelName: `Person ${i + 1}`,
      personnelPosition: 'Worker',
      subcontractorName: 'Company'
    }))

    render(<DutyCalendar {...defaultProps} dutyRosters={manyRosters} />)
    
    expect(screen.getByText('+2 更多')).toBeInTheDocument()
  })
})