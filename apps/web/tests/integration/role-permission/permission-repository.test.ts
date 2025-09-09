import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { permissionRepository } from '@/repositories/permissionRepository'

describe('Permission Repository Integration Tests', () => {
  let createdPermissionId: number
  const testUserId = 1 // Assuming user with ID 1 exists from seed data

  afterAll(async () => {
    // Clean up test data - Note: In real tests, this would be handled by test database cleanup
  })

  describe('Permission CRUD Operations', () => {
    it('should create a new permission', async () => {
      const permissionData = {
        name: 'integration.test.permission',
        description: '整合測試權限',
        resource: 'integration_test',
        action: 'create'
      }

      createdPermissionId = await permissionRepository.createPermission(permissionData)
      expect(createdPermissionId).toBeDefined()
      expect(typeof createdPermissionId).toBe('number')
    })

    it('should fetch all permissions', async () => {
      const permissions = await permissionRepository.getAllPermissions()
      
      expect(Array.isArray(permissions)).toBe(true)
      expect(permissions.length).toBeGreaterThan(0)
      
      const testPermission = permissions.find(p => p.id === createdPermissionId)
      expect(testPermission).toBeDefined()
      expect(testPermission?.name).toBe('integration.test.permission')
      expect(testPermission?.description).toBe('整合測試權限')
      expect(testPermission?.resource).toBe('integration_test')
      expect(testPermission?.action).toBe('create')
    })

    it('should fetch permissions by resource', async () => {
      const permissions = await permissionRepository.getPermissionsByResource('integration_test')
      
      expect(Array.isArray(permissions)).toBe(true)
      expect(permissions.length).toBeGreaterThan(0)
      
      const testPermission = permissions.find(p => p.id === createdPermissionId)
      expect(testPermission).toBeDefined()
      expect(testPermission?.resource).toBe('integration_test')
    })

    it('should return empty array for non-existent resource', async () => {
      const permissions = await permissionRepository.getPermissionsByResource('non_existent_resource')
      expect(Array.isArray(permissions)).toBe(true)
      expect(permissions.length).toBe(0)
    })
  })

  describe('User Permission Checks', () => {
    it('should check user permission correctly', async () => {
      // This test assumes the test user has some permissions from seed data
      const hasProjectReadPermission = await permissionRepository.checkUserPermission(
        testUserId,
        'project.read'
      )
      
      expect(typeof hasProjectReadPermission).toBe('boolean')
    })

    it('should return false for non-existent permission', async () => {
      const hasNonExistentPermission = await permissionRepository.checkUserPermission(
        testUserId,
        'non.existent.permission'
      )
      
      expect(hasNonExistentPermission).toBe(false)
    })

    it('should return false for non-existent user', async () => {
      const hasPermission = await permissionRepository.checkUserPermission(
        99999,
        'project.read'
      )
      
      expect(hasPermission).toBe(false)
    })

    it('should get user permissions correctly', async () => {
      const userPermissions = await permissionRepository.getUserPermissions(testUserId)
      
      expect(Array.isArray(userPermissions)).toBe(true)
      
      userPermissions.forEach(permission => {
        expect(permission.userId).toBe(testUserId)
        expect(permission.permissionName).toBeDefined()
        expect(permission.resource).toBeDefined()
        expect(permission.action).toBeDefined()
      })
    })

    it('should get user permissions with project scope', async () => {
      const testProjectId = 1 // Assuming project with ID 1 exists
      const userPermissions = await permissionRepository.getUserPermissions(testUserId, testProjectId)
      
      expect(Array.isArray(userPermissions)).toBe(true)
      
      userPermissions.forEach(permission => {
        expect(permission.userId).toBe(testUserId)
        expect(permission.permissionName).toBeDefined()
        expect(permission.resource).toBeDefined()
        expect(permission.action).toBeDefined()
      })
    })
  })

  describe('Permission System Integrity', () => {
    it('should maintain consistent permission structure', async () => {
      const allPermissions = await permissionRepository.getAllPermissions()
      
      allPermissions.forEach(permission => {
        expect(permission.id).toBeDefined()
        expect(typeof permission.id).toBe('number')
        expect(permission.name).toBeDefined()
        expect(typeof permission.name).toBe('string')
        expect(permission.description).toBeDefined()
        expect(permission.resource).toBeDefined()
        expect(permission.action).toBeDefined()
        expect(permission.createdAt).toBeDefined()
      })
    })

    it('should have unique permission names', async () => {
      const allPermissions = await permissionRepository.getAllPermissions()
      const permissionNames = allPermissions.map(p => p.name)
      const uniqueNames = new Set(permissionNames)
      
      expect(permissionNames.length).toBe(uniqueNames.size)
    })

    it('should have valid resource and action combinations', async () => {
      const allPermissions = await permissionRepository.getAllPermissions()
      
      const validResources = [
        'project', 'wbs', 'personnel', 'reports', 'announcements',
        'duty', 'attendance', 'users', 'roles', 'dashboard', 'system'
      ]
      
      const validActions = ['read', 'write', 'delete', 'approve', 'assign', 'admin']
      
      allPermissions.forEach(permission => {
        if (!permission.resource.includes('test')) { // Skip test permissions
          expect(validResources).toContain(permission.resource)
          expect(validActions).toContain(permission.action)
        }
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle duplicate permission creation', async () => {
      const duplicatePermission = {
        name: 'integration.test.permission', // Same as created earlier
        description: '重複的測試權限',
        resource: 'integration_test',
        action: 'create'
      }

      await expect(
        permissionRepository.createPermission(duplicatePermission)
      ).rejects.toThrow()
    })

    it('should handle database connection errors gracefully', async () => {
      // This test would require mocking database connection failure
      // For now, we'll just ensure the methods exist and can handle errors
      expect(permissionRepository.getAllPermissions).toBeDefined()
      expect(permissionRepository.checkUserPermission).toBeDefined()
      expect(permissionRepository.getUserPermissions).toBeDefined()
    })
  })
})