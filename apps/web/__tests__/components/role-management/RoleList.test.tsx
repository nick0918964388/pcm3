import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { RoleList } from '@/components/features/role-management/RoleList'

// Mock fetch
global.fetch = jest.fn()

const mockRoles = [
  {
    id: 1,
    name: 'PM',
    description: '專案經理',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 2,
    name: 'QC',
    description: '品管人員',
    createdAt: '2024-01-02T00:00:00Z'
  }
]

describe('RoleList Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render loading state initially', async () => {
    ;(fetch as jest.Mock).mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    )

    render(<RoleList />)
    
    expect(screen.getByText('載入角色列表...')).toBeInTheDocument()
  })

  it('should render roles successfully', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRoles
    })

    render(<RoleList />)
    
    await waitFor(() => {
      expect(screen.getByText('角色列表')).toBeInTheDocument()
      expect(screen.getByText('2 個角色')).toBeInTheDocument()
      expect(screen.getByText('PM')).toBeInTheDocument()
      expect(screen.getByText('專案經理')).toBeInTheDocument()
      expect(screen.getByText('QC')).toBeInTheDocument()
      expect(screen.getByText('品管人員')).toBeInTheDocument()
    })
  })

  it('should handle API error gracefully', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500
    })

    render(<RoleList />)
    
    await waitFor(() => {
      expect(screen.getByText(/錯誤:/)).toBeInTheDocument()
      expect(screen.getByText('重試')).toBeInTheDocument()
    })
  })

  it('should handle network error gracefully', async () => {
    ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    render(<RoleList />)
    
    await waitFor(() => {
      expect(screen.getByText('錯誤: Network error')).toBeInTheDocument()
      expect(screen.getByText('重試')).toBeInTheDocument()
    })
  })

  it('should retry fetching on retry button click', async () => {
    ;(fetch as jest.Mock)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockRoles
      })

    render(<RoleList />)
    
    await waitFor(() => {
      expect(screen.getByText('重試')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('重試'))

    await waitFor(() => {
      expect(screen.getByText('PM')).toBeInTheDocument()
      expect(screen.getByText('QC')).toBeInTheDocument()
    })

    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('should handle empty roles list', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => []
    })

    render(<RoleList />)
    
    await waitFor(() => {
      expect(screen.getByText('角色列表')).toBeInTheDocument()
      expect(screen.getByText('0 個角色')).toBeInTheDocument()
      expect(screen.getByText('尚無角色資料')).toBeInTheDocument()
    })
  })

  it('should call onRoleSelect when role is clicked', async () => {
    const mockOnRoleSelect = jest.fn()
    
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRoles
    })

    render(<RoleList onRoleSelect={mockOnRoleSelect} />)
    
    await waitFor(() => {
      expect(screen.getByText('PM')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('PM'))

    expect(mockOnRoleSelect).toHaveBeenCalledWith({
      id: 1,
      name: 'PM',
      description: '專案經理',
      createdAt: '2024-01-01T00:00:00Z'
    })
  })

  it('should highlight selected role', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRoles
    })

    render(<RoleList selectedRoleId={1} />)
    
    await waitFor(() => {
      expect(screen.getByText('PM')).toBeInTheDocument()
    })

    const pmRoleDiv = screen.getByText('PM').closest('div')
    expect(pmRoleDiv).toHaveClass('border-blue-500', 'bg-blue-50')

    const qcRoleDiv = screen.getByText('QC').closest('div')
    expect(qcRoleDiv).not.toHaveClass('border-blue-500', 'bg-blue-50')
  })

  it('should format dates correctly', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRoles
    })

    render(<RoleList />)
    
    await waitFor(() => {
      expect(screen.getByText('2024/1/1')).toBeInTheDocument()
      expect(screen.getByText('2024/1/2')).toBeInTheDocument()
    })
  })

  it('should make API call with correct endpoint', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRoles
    })

    render(<RoleList />)

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/roles')
    })
  })
})