import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { roleRepository } from '@/repositories/roleRepository'
import { permissionRepository } from '@/repositories/permissionRepository'

describe('Role Repository Integration Tests', () => {
  let createdRoleId: number
  let createdPermissionId: number

  beforeAll(async () => {
    // Create a test permission for role assignment
    createdPermissionId = await permissionRepository.createPermission({
      name: 'test.permission',
      description: '測試權限',
      resource: 'test',
      action: 'read'
    })
  })

  afterAll(async () => {
    // Clean up test data - Note: In real tests, this would be handled by test database cleanup
  })

  describe('Role CRUD Operations', () => {
    it('should create a new role', async () => {
      const roleData = {
        name: '測試角色',
        description: '這是一個測試角色'
      }

      createdRoleId = await roleRepository.createRole(roleData)
      expect(createdRoleId).toBeDefined()
      expect(typeof createdRoleId).toBe('number')
    })

    it('should fetch all roles', async () => {
      const roles = await roleRepository.getAllRoles()
      
      expect(Array.isArray(roles)).toBe(true)
      expect(roles.length).toBeGreaterThan(0)
      
      const testRole = roles.find(r => r.id === createdRoleId)
      expect(testRole).toBeDefined()
      expect(testRole?.name).toBe('測試角色')
      expect(testRole?.description).toBe('這是一個測試角色')
    })

    it('should fetch role with permissions', async () => {
      const roleWithPermissions = await roleRepository.getRoleWithPermissions(createdRoleId)
      
      expect(roleWithPermissions).toBeDefined()
      expect(roleWithPermissions?.id).toBe(createdRoleId)
      expect(roleWithPermissions?.name).toBe('測試角色')
      expect(Array.isArray(roleWithPermissions?.permissions)).toBe(true)
    })

    it('should return null for non-existent role', async () => {
      const nonExistentRole = await roleRepository.getRoleWithPermissions(99999)
      expect(nonExistentRole).toBeNull()
    })
  })

  describe('Permission Assignment to Roles', () => {
    it('should assign permission to role', async () => {
      await roleRepository.assignPermissionToRole(createdRoleId, createdPermissionId)
      
      const roleWithPermissions = await roleRepository.getRoleWithPermissions(createdRoleId)
      expect(roleWithPermissions?.permissions).toContain('test.permission')
    })

    it('should remove permission from role', async () => {
      await roleRepository.removePermissionFromRole(createdRoleId, createdPermissionId)
      
      const roleWithPermissions = await roleRepository.getRoleWithPermissions(createdRoleId)
      expect(roleWithPermissions?.permissions).not.toContain('test.permission')
    })
  })

  describe('User Role Assignment', () => {
    it('should assign role to user', async () => {
      const testUserId = 1 // Assuming user with ID 1 exists from seed data
      
      await roleRepository.assignRoleToUser(testUserId, createdRoleId)
      
      const userRoles = await roleRepository.getUserRoles(testUserId)
      const assignedRole = userRoles.find(r => r.roleId === createdRoleId)
      expect(assignedRole).toBeDefined()
    })

    it('should fetch user roles', async () => {
      const testUserId = 1
      const userRoles = await roleRepository.getUserRoles(testUserId)
      
      expect(Array.isArray(userRoles)).toBe(true)
      expect(userRoles.length).toBeGreaterThan(0)
      
      userRoles.forEach(role => {
        expect(role.userId).toBe(testUserId)
        expect(role.roleName).toBeDefined()
        expect(role.createdAt).toBeDefined()
      })
    })

    it('should assign role with project scope', async () => {
      const testUserId = 1
      const testProjectId = 1 // Assuming project with ID 1 exists from seed data
      
      await roleRepository.assignRoleToUser(testUserId, createdRoleId, testProjectId)
      
      const userRoles = await roleRepository.getUserRoles(testUserId)
      const projectRole = userRoles.find(r => r.roleId === createdRoleId && r.projectId === testProjectId)
      expect(projectRole).toBeDefined()
      expect(projectRole?.projectId).toBe(testProjectId)
    })

    it('should remove role from user', async () => {
      const testUserId = 1
      
      // First, get current role count
      const rolesBefore = await roleRepository.getUserRoles(testUserId)
      const rolesToRemove = rolesBefore.filter(r => r.roleId === createdRoleId)
      
      // Remove global role assignment
      await roleRepository.removeRoleFromUser(testUserId, createdRoleId)
      
      // Check if global role was removed
      const rolesAfter = await roleRepository.getUserRoles(testUserId)
      const globalRole = rolesAfter.find(r => r.roleId === createdRoleId && !r.projectId)
      expect(globalRole).toBeUndefined()
    })

    it('should handle duplicate role assignment gracefully', async () => {
      const testUserId = 1
      
      // Try to assign the same role twice
      await expect(
        roleRepository.assignRoleToUser(testUserId, createdRoleId)
      ).rejects.toThrow()
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid role ID in permission assignment', async () => {
      await expect(
        roleRepository.assignPermissionToRole(99999, createdPermissionId)
      ).rejects.toThrow()
    })

    it('should handle invalid user ID in role assignment', async () => {
      await expect(
        roleRepository.assignRoleToUser(99999, createdRoleId)
      ).rejects.toThrow()
    })

    it('should handle invalid permission ID in role assignment', async () => {
      await expect(
        roleRepository.assignPermissionToRole(createdRoleId, 99999)
      ).rejects.toThrow()
    })
  })
})