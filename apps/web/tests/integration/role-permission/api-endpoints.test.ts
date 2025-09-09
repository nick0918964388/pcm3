import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals'
import { createMocks } from 'node-mocks-http'
import { GET as rolesGET, POST as rolesPOST } from '@/app/api/roles/route'
import { GET as roleByIdGET } from '@/app/api/roles/[id]/route'
import { GET as userRolesGET, POST as userRolesPOST, DELETE as userRolesDELETE } from '@/app/api/users/[id]/roles/route'
import { GET as permissionsGET, POST as permissionsPOST } from '@/app/api/permissions/route'
import { POST as permissionCheckPOST, GET as permissionCheckGET } from '@/app/api/permissions/check/route'

// Mock the auth function
jest.mock('@/app/api/auth/[...nextauth]/auth', () => ({
  auth: jest.fn(() => Promise.resolve({
    user: { id: '1', name: 'Test User' }
  }))
}))

// Mock the repository functions
jest.mock('@/repositories/roleRepository')
jest.mock('@/repositories/permissionRepository')

import { roleRepository } from '@/repositories/roleRepository'
import { permissionRepository } from '@/repositories/permissionRepository'

const mockRoleRepository = roleRepository as jest.Mocked<typeof roleRepository>
const mockPermissionRepository = permissionRepository as jest.Mocked<typeof permissionRepository>

describe('Role Management API Endpoints', () => {
  beforeAll(() => {
    // Set up common mocks
    mockPermissionRepository.checkUserPermission.mockImplementation(async (userId, permission) => {
      // Mock that user 1 has most permissions for testing
      return userId === 1
    })
  })

  afterAll(() => {
    jest.restoreAllMocks()
  })

  describe('/api/roles', () => {
    it('should get all roles successfully', async () => {
      const mockRoles = [
        { id: 1, name: 'PM', description: '專案經理', createdAt: new Date() },
        { id: 2, name: 'QC', description: '品管人員', createdAt: new Date() }
      ]
      
      mockRoleRepository.getAllRoles.mockResolvedValue(mockRoles)

      const { req, res } = createMocks({ method: 'GET' })
      const response = await rolesGET()
      
      expect(response.status).toBe(200)
      const responseData = await response.json()
      expect(Array.isArray(responseData)).toBe(true)
      expect(responseData.length).toBe(2)
    })

    it('should handle unauthorized access', async () => {
      // Mock no session
      const { auth } = await import('@/app/api/auth/[...nextauth]/auth')
      ;(auth as jest.Mock).mockResolvedValueOnce(null)

      const response = await rolesGET()
      
      expect(response.status).toBe(401)
      const responseData = await response.json()
      expect(responseData.error).toBe('Unauthorized')
    })

    it('should handle insufficient permissions', async () => {
      mockPermissionRepository.checkUserPermission.mockResolvedValueOnce(false)

      const response = await rolesGET()
      
      expect(response.status).toBe(403)
      const responseData = await response.json()
      expect(responseData.error).toBe('Insufficient permissions')
    })

    it('should create a new role successfully', async () => {
      const newRole = { id: 3, name: 'Engineer', description: '工程師', permissions: [], createdAt: new Date() }
      
      mockRoleRepository.createRole.mockResolvedValue(3)
      mockRoleRepository.getRoleWithPermissions.mockResolvedValue(newRole)

      const { req } = createMocks({
        method: 'POST',
        body: { name: 'Engineer', description: '工程師' }
      })
      
      const response = await rolesPOST(req)
      
      expect(response.status).toBe(201)
      const responseData = await response.json()
      expect(responseData.name).toBe('Engineer')
      expect(responseData.description).toBe('工程師')
    })

    it('should validate required fields for role creation', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: { name: '' } // Missing description
      })
      
      const response = await rolesPOST(req)
      
      expect(response.status).toBe(400)
      const responseData = await response.json()
      expect(responseData.error).toBe('Name and description are required')
    })
  })

  describe('/api/roles/[id]', () => {
    it('should get role by ID successfully', async () => {
      const mockRole = {
        id: 1,
        name: 'PM',
        description: '專案經理',
        permissions: ['project.read', 'project.write'],
        createdAt: new Date()
      }
      
      mockRoleRepository.getRoleWithPermissions.mockResolvedValue(mockRole)

      const response = await roleByIdGET(
        {} as any,
        { params: { id: '1' } }
      )
      
      expect(response.status).toBe(200)
      const responseData = await response.json()
      expect(responseData.id).toBe(1)
      expect(responseData.name).toBe('PM')
      expect(Array.isArray(responseData.permissions)).toBe(true)
    })

    it('should handle invalid role ID', async () => {
      const response = await roleByIdGET(
        {} as any,
        { params: { id: 'invalid' } }
      )
      
      expect(response.status).toBe(400)
      const responseData = await response.json()
      expect(responseData.error).toBe('Invalid role ID')
    })

    it('should handle role not found', async () => {
      mockRoleRepository.getRoleWithPermissions.mockResolvedValue(null)

      const response = await roleByIdGET(
        {} as any,
        { params: { id: '999' } }
      )
      
      expect(response.status).toBe(404)
      const responseData = await response.json()
      expect(responseData.error).toBe('Role not found')
    })
  })

  describe('/api/users/[id]/roles', () => {
    it('should get user roles successfully', async () => {
      const mockUserRoles = [
        {
          userId: 1,
          roleId: 1,
          roleName: 'PM',
          projectId: 1,
          projectName: 'Test Project',
          createdAt: new Date()
        }
      ]
      
      mockRoleRepository.getUserRoles.mockResolvedValue(mockUserRoles)

      const response = await userRolesGET(
        {} as any,
        { params: { id: '1' } }
      )
      
      expect(response.status).toBe(200)
      const responseData = await response.json()
      expect(Array.isArray(responseData)).toBe(true)
      expect(responseData.length).toBe(1)
      expect(responseData[0].userId).toBe(1)
      expect(responseData[0].roleName).toBe('PM')
    })

    it('should assign role to user successfully', async () => {
      const mockUpdatedRoles = [
        { userId: 1, roleId: 1, roleName: 'PM', createdAt: new Date() }
      ]
      
      mockRoleRepository.assignRoleToUser.mockResolvedValue()
      mockRoleRepository.getUserRoles.mockResolvedValue(mockUpdatedRoles)

      const { req } = createMocks({
        method: 'POST',
        body: { roleId: 1, projectId: 1 }
      })
      
      const response = await userRolesPOST(
        req,
        { params: { id: '1' } }
      )
      
      expect(response.status).toBe(201)
      const responseData = await response.json()
      expect(Array.isArray(responseData)).toBe(true)
    })

    it('should remove role from user successfully', async () => {
      const mockUpdatedRoles = []
      
      mockRoleRepository.removeRoleFromUser.mockResolvedValue()
      mockRoleRepository.getUserRoles.mockResolvedValue(mockUpdatedRoles)

      const { req } = createMocks({
        method: 'DELETE',
        url: '/api/users/1/roles?roleId=1'
      })
      
      const response = await userRolesDELETE(
        req,
        { params: { id: '1' } }
      )
      
      expect(response.status).toBe(200)
      const responseData = await response.json()
      expect(Array.isArray(responseData)).toBe(true)
    })
  })

  describe('/api/permissions', () => {
    it('should get all permissions successfully', async () => {
      const mockPermissions = [
        {
          id: 1,
          name: 'project.read',
          description: '檢視專案',
          resource: 'project',
          action: 'read',
          createdAt: new Date()
        }
      ]
      
      mockPermissionRepository.getAllPermissions.mockResolvedValue(mockPermissions)

      const response = await permissionsGET({} as any)
      
      expect(response.status).toBe(200)
      const responseData = await response.json()
      expect(Array.isArray(responseData)).toBe(true)
      expect(responseData.length).toBe(1)
      expect(responseData[0].name).toBe('project.read')
    })

    it('should filter permissions by resource', async () => {
      const mockProjectPermissions = [
        {
          id: 1,
          name: 'project.read',
          description: '檢視專案',
          resource: 'project',
          action: 'read',
          createdAt: new Date()
        }
      ]
      
      mockPermissionRepository.getPermissionsByResource.mockResolvedValue(mockProjectPermissions)

      const { req } = createMocks({
        method: 'GET',
        url: '/api/permissions?resource=project'
      })
      
      const response = await permissionsGET(req)
      
      expect(response.status).toBe(200)
      const responseData = await response.json()
      expect(Array.isArray(responseData)).toBe(true)
      expect(responseData.every(p => p.resource === 'project')).toBe(true)
    })

    it('should create permission with system admin rights', async () => {
      mockPermissionRepository.checkUserPermission.mockImplementation(async (userId, permission) => {
        return permission === 'system.admin'
      })
      
      mockPermissionRepository.createPermission.mockResolvedValue(1)
      mockPermissionRepository.getAllPermissions.mockResolvedValue([
        {
          id: 1,
          name: 'new.permission',
          description: '新權限',
          resource: 'test',
          action: 'create',
          createdAt: new Date()
        }
      ])

      const { req } = createMocks({
        method: 'POST',
        body: {
          name: 'new.permission',
          description: '新權限',
          resource: 'test',
          action: 'create'
        }
      })
      
      const response = await permissionsPOST(req)
      
      expect(response.status).toBe(201)
      const responseData = await response.json()
      expect(responseData.name).toBe('new.permission')
    })
  })

  describe('/api/permissions/check', () => {
    it('should check user permission successfully', async () => {
      mockPermissionRepository.checkUserPermission.mockResolvedValue(true)

      const { req } = createMocks({
        method: 'POST',
        body: { permission: 'project.read', projectId: 1 }
      })
      
      const response = await permissionCheckPOST(req)
      
      expect(response.status).toBe(200)
      const responseData = await response.json()
      expect(responseData.hasPermission).toBe(true)
      expect(responseData.permission).toBe('project.read')
      expect(responseData.projectId).toBe(1)
    })

    it('should get user permissions successfully', async () => {
      const mockUserPermissions = [
        {
          userId: 1,
          permissionName: 'project.read',
          resource: 'project',
          action: 'read'
        }
      ]
      
      mockPermissionRepository.getUserPermissions.mockResolvedValue(mockUserPermissions)

      const { req } = createMocks({
        method: 'GET',
        url: '/api/permissions/check?projectId=1'
      })
      
      const response = await permissionCheckGET(req)
      
      expect(response.status).toBe(200)
      const responseData = await response.json()
      expect(responseData.userId).toBe(1)
      expect(responseData.projectId).toBe(1)
      expect(Array.isArray(responseData.permissions)).toBe(true)
    })

    it('should validate required permission parameter', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: {} // Missing permission
      })
      
      const response = await permissionCheckPOST(req)
      
      expect(response.status).toBe(400)
      const responseData = await response.json()
      expect(responseData.error).toBe('Permission name is required')
    })
  })
})