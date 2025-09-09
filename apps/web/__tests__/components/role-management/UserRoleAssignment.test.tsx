import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { UserRoleAssignment } from '@/components/features/role-management/UserRoleAssignment'

// Mock fetch
global.fetch = jest.fn()

// Mock window.confirm
global.confirm = jest.fn()

const mockUserRoles = [
  {
    userId: 1,
    roleId: 1,
    projectId: 1,
    roleName: 'PM',
    projectName: 'Test Project',
    createdAt: '2024-01-01T00:00:00Z'
  }
]

const mockRoles = [
  { id: 1, name: 'PM', description: '專案經理' },
  { id: 2, name: 'QC', description: '品管人員' }
]

const mockProjects = [
  { id: 1, name: 'Test Project', code: 'TP-001' }
]

describe('UserRoleAssignment Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.confirm as jest.Mock).mockReturnValue(true)
  })

  it('should render loading state initially', async () => {
    ;(fetch as jest.Mock).mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    )

    render(<UserRoleAssignment userId={1} userName="Test User" />)
    
    expect(screen.getByText('載入使用者角色...')).toBeInTheDocument()
  })

  it('should render user roles successfully', async () => {
    ;(fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserRoles
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockRoles
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProjects
      })

    render(<UserRoleAssignment userId={1} userName="Test User" />)
    
    await waitFor(() => {
      expect(screen.getByText('Test User 的角色指派')).toBeInTheDocument()
      expect(screen.getByText('目前角色')).toBeInTheDocument()
      expect(screen.getByText('PM')).toBeInTheDocument()
      expect(screen.getByText('專案: Test Project')).toBeInTheDocument()
    })
  })

  it('should handle empty user roles', async () => {
    ;(fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => []
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockRoles
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProjects
      })

    render(<UserRoleAssignment userId={1} userName="Test User" />)
    
    await waitFor(() => {
      expect(screen.getByText('尚未指派任何角色')).toBeInTheDocument()
    })
  })

  it('should open assignment form when assign button clicked', async () => {
    ;(fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => []
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockRoles
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProjects
      })

    render(<UserRoleAssignment userId={1} userName="Test User" />)
    
    await waitFor(() => {
      expect(screen.getByText('指派角色')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('指派角色'))

    await waitFor(() => {
      expect(screen.getByText('指派新角色')).toBeInTheDocument()
      expect(screen.getByText('選擇角色')).toBeInTheDocument()
      expect(screen.getByText('選擇專案 (可選)')).toBeInTheDocument()
    })
  })

  it('should populate form options correctly', async () => {
    ;(fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => []
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockRoles
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProjects
      })

    render(<UserRoleAssignment userId={1} userName="Test User" />)
    
    await waitFor(() => {
      expect(screen.getByText('指派角色')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('指派角色'))

    await waitFor(() => {
      const roleSelect = screen.getByDisplayValue('請選擇角色...')
      expect(roleSelect).toBeInTheDocument()
      
      const projectSelect = screen.getByDisplayValue('全域角色')
      expect(projectSelect).toBeInTheDocument()
    })

    // Check if options are populated (this would need more specific testing with react-testing-library)
    expect(screen.getByText('PM - 專案經理')).toBeInTheDocument()
    expect(screen.getByText('QC - 品管人員')).toBeInTheDocument()
    expect(screen.getByText('Test Project (TP-001)')).toBeInTheDocument()
  })

  it('should assign role successfully', async () => {
    ;(fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => []
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockRoles
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProjects
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserRoles
      })

    render(<UserRoleAssignment userId={1} userName="Test User" />)
    
    await waitFor(() => {
      expect(screen.getByText('指派角色')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('指派角色'))

    await waitFor(() => {
      const roleSelect = screen.getByLabelText('選擇角色')
      fireEvent.change(roleSelect, { target: { value: '1' } })
    })

    const confirmButton = screen.getByText('確認指派')
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/users/1/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          roleId: 1,
          projectId: undefined
        })
      })
    })
  })

  it('should remove role with confirmation', async () => {
    ;(fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserRoles
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockRoles
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProjects
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => []
      })

    render(<UserRoleAssignment userId={1} userName="Test User" />)
    
    await waitFor(() => {
      expect(screen.getByText('移除')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('移除'))

    expect(global.confirm).toHaveBeenCalledWith('確定要移除此角色嗎？')
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/users/1/roles?roleId=1&projectId=1',
        { method: 'DELETE' }
      )
    })
  })

  it('should not remove role if user cancels confirmation', async () => {
    ;(global.confirm as jest.Mock).mockReturnValue(false)
    
    ;(fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserRoles
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockRoles
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProjects
      })

    render(<UserRoleAssignment userId={1} userName="Test User" />)
    
    await waitFor(() => {
      expect(screen.getByText('移除')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('移除'))

    expect(global.confirm).toHaveBeenCalledWith('確定要移除此角色嗎？')
    
    // Should not make DELETE request since user cancelled
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(3) // Only the initial 3 calls
    })
  })

  it('should close assignment form on cancel', async () => {
    ;(fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => []
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockRoles
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProjects
      })

    render(<UserRoleAssignment userId={1} userName="Test User" />)
    
    await waitFor(() => {
      expect(screen.getByText('指派角色')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('指派角色'))

    await waitFor(() => {
      expect(screen.getByText('指派新角色')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('取消'))

    await waitFor(() => {
      expect(screen.queryByText('指派新角色')).not.toBeInTheDocument()
    })
  })

  it('should handle API errors gracefully', async () => {
    ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'))

    render(<UserRoleAssignment userId={1} userName="Test User" />)
    
    await waitFor(() => {
      expect(screen.getByText('錯誤: API Error')).toBeInTheDocument()
      expect(screen.getByText('重試')).toBeInTheDocument()
    })
  })

  it('should validate required fields in assignment form', async () => {
    ;(fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => []
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockRoles
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProjects
      })

    render(<UserRoleAssignment userId={1} userName="Test User" />)
    
    await waitFor(() => {
      expect(screen.getByText('指派角色')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('指派角色'))

    await waitFor(() => {
      const confirmButton = screen.getByText('確認指派')
      expect(confirmButton).toBeDisabled()
    })
  })

  it('should format dates correctly', async () => {
    ;(fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserRoles
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockRoles
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProjects
      })

    render(<UserRoleAssignment userId={1} userName="Test User" />)
    
    await waitFor(() => {
      expect(screen.getByText('指派日期: 2024/1/1')).toBeInTheDocument()
    })
  })
})