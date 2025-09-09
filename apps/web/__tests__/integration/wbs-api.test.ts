import { NextRequest } from 'next/server'
import { GET as getWBS, POST as createWBS } from '@/app/api/wbs/[projectId]/route'
import { PUT as updateWBS, DELETE as deleteWBS } from '@/app/api/wbs/items/[id]/route'
import { POST as reorderWBS } from '@/app/api/wbs/items/[id]/reorder/route'

// Mock auth
jest.mock('@/app/api/auth/[...nextauth]/auth', () => ({
  auth: jest.fn(() => Promise.resolve({
    user: { id: '1' }
  }))
}))

// Mock repositories
jest.mock('@/repositories/wbsRepository', () => ({
  wbsRepository: {
    findByProjectId: jest.fn(),
    buildHierarchy: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    reorder: jest.fn()
  }
}))

jest.mock('@/repositories/wbsChangeLogRepository', () => ({
  wbsChangeLogRepository: {
    logWBSChange: jest.fn()
  }
}))

jest.mock('@/repositories/permissionRepository', () => ({
  permissionRepository: {
    checkUserPermission: jest.fn()
  }
}))

describe('WBS API Routes', () => {
  const { wbsRepository } = require('@/repositories/wbsRepository')
  const { wbsChangeLogRepository } = require('@/repositories/wbsChangeLogRepository')
  const { permissionRepository } = require('@/repositories/permissionRepository')

  beforeEach(() => {
    jest.clearAllMocks()
    permissionRepository.checkUserPermission.mockResolvedValue(true)
  })

  describe('GET /api/wbs/[projectId]', () => {
    it('should return hierarchical WBS structure', async () => {
      const mockItems = [
        {
          id: 1,
          projectId: 100,
          code: '1.0',
          name: '系統分析',
          levelNumber: 1,
          sortOrder: 0
        }
      ]
      const mockHierarchy = [{ ...mockItems[0], children: [] }]

      wbsRepository.findByProjectId.mockResolvedValue(mockItems)
      wbsRepository.buildHierarchy.mockReturnValue(mockHierarchy)

      const request = new NextRequest('http://localhost:3000/api/wbs/100')
      const response = await getWBS(request, { params: { projectId: '100' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockHierarchy)
      expect(wbsRepository.findByProjectId).toHaveBeenCalledWith(100)
    })

    it('should return 401 when not authenticated', async () => {
      const { auth } = require('@/app/api/auth/[...nextauth]/auth')
      auth.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/wbs/100')
      const response = await getWBS(request, { params: { projectId: '100' } })

      expect(response.status).toBe(401)
    })

    it('should return 403 when user lacks permissions', async () => {
      permissionRepository.checkUserPermission.mockResolvedValue(false)

      const request = new NextRequest('http://localhost:3000/api/wbs/100')
      const response = await getWBS(request, { params: { projectId: '100' } })

      expect(response.status).toBe(403)
    })

    it('should return 400 for invalid project ID', async () => {
      const request = new NextRequest('http://localhost:3000/api/wbs/invalid')
      const response = await getWBS(request, { params: { projectId: 'invalid' } })

      expect(response.status).toBe(400)
    })
  })

  describe('POST /api/wbs/[projectId]', () => {
    it('should create new WBS item and log change', async () => {
      const newItem = {
        id: 1,
        projectId: 100,
        code: '1.0',
        name: '系統分析',
        levelNumber: 1,
        sortOrder: 0,
        createdAt: new Date()
      }

      wbsRepository.create.mockResolvedValue(newItem)
      wbsChangeLogRepository.logWBSChange.mockResolvedValue({})

      const request = new NextRequest('http://localhost:3000/api/wbs/100', {
        method: 'POST',
        body: JSON.stringify({
          code: '1.0',
          name: '系統分析',
          description: '系統分析階段',
          changeReason: '建立新項目'
        })
      })

      const response = await createWBS(request, { params: { projectId: '100' } })
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data).toEqual(newItem)
      expect(wbsRepository.create).toHaveBeenCalledWith({
        projectId: 100,
        parentId: undefined,
        code: '1.0',
        name: '系統分析',
        description: '系統分析階段',
        changeReason: '建立新項目'
      })
      expect(wbsChangeLogRepository.logWBSChange).toHaveBeenCalledWith(
        1, 1, 'CREATE', undefined, newItem, '建立新項目'
      )
    })

    it('should return 400 when required fields are missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/wbs/100', {
        method: 'POST',
        body: JSON.stringify({
          name: '系統分析'
          // missing code
        })
      })

      const response = await createWBS(request, { params: { projectId: '100' } })

      expect(response.status).toBe(400)
    })
  })

  describe('PUT /api/wbs/items/[id]', () => {
    it('should update WBS item and log change', async () => {
      const oldItem = {
        id: 1,
        code: '1.0',
        name: '系統分析',
        description: '原描述'
      }
      const updatedItem = {
        ...oldItem,
        name: '系統分析更新',
        description: '更新的描述'
      }

      wbsRepository.findById.mockResolvedValue(oldItem)
      wbsRepository.update.mockResolvedValue(updatedItem)
      wbsChangeLogRepository.logWBSChange.mockResolvedValue({})

      const request = new NextRequest('http://localhost:3000/api/wbs/items/1', {
        method: 'PUT',
        body: JSON.stringify({
          name: '系統分析更新',
          description: '更新的描述',
          changeReason: '更新項目名稱和描述'
        })
      })

      const response = await updateWBS(request, { params: { id: '1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(updatedItem)
      expect(wbsChangeLogRepository.logWBSChange).toHaveBeenCalledWith(
        1, 1, 'UPDATE', oldItem, updatedItem, '更新項目名稱和描述'
      )
    })

    it('should return 404 when item not found', async () => {
      wbsRepository.findById.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/wbs/items/999', {
        method: 'PUT',
        body: JSON.stringify({
          name: '系統分析更新'
        })
      })

      const response = await updateWBS(request, { params: { id: '999' } })

      expect(response.status).toBe(404)
    })
  })

  describe('DELETE /api/wbs/items/[id]', () => {
    it('should delete WBS item and log change', async () => {
      const item = {
        id: 1,
        code: '1.0',
        name: '系統分析'
      }

      wbsRepository.findById.mockResolvedValue(item)
      wbsRepository.delete.mockResolvedValue(true)
      wbsChangeLogRepository.logWBSChange.mockResolvedValue({})

      const request = new NextRequest('http://localhost:3000/api/wbs/items/1', {
        method: 'DELETE',
        body: JSON.stringify({
          changeReason: '刪除不需要的項目'
        })
      })

      const response = await deleteWBS(request, { params: { id: '1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({ success: true })
      expect(wbsChangeLogRepository.logWBSChange).toHaveBeenCalledWith(
        1, 1, 'DELETE', item, undefined, '刪除不需要的項目'
      )
    })

    it('should return 500 when deletion fails', async () => {
      const item = { id: 1, code: '1.0', name: '系統分析' }
      
      wbsRepository.findById.mockResolvedValue(item)
      wbsRepository.delete.mockResolvedValue(false)

      const request = new NextRequest('http://localhost:3000/api/wbs/items/1', {
        method: 'DELETE',
        body: JSON.stringify({ changeReason: '刪除項目' })
      })

      const response = await deleteWBS(request, { params: { id: '1' } })

      expect(response.status).toBe(500)
    })
  })

  describe('POST /api/wbs/items/[id]/reorder', () => {
    it('should reorder WBS item and log change', async () => {
      const oldItem = {
        id: 1,
        parentId: null,
        sortOrder: 0,
        levelNumber: 1
      }
      const reorderedItem = {
        ...oldItem,
        sortOrder: 2
      }

      wbsRepository.findById.mockResolvedValue(oldItem)
      wbsRepository.reorder.mockResolvedValue(reorderedItem)
      wbsChangeLogRepository.logWBSChange.mockResolvedValue({})

      const request = new NextRequest('http://localhost:3000/api/wbs/items/1/reorder', {
        method: 'POST',
        body: JSON.stringify({
          newSortOrder: 2,
          changeReason: '調整項目順序'
        })
      })

      const response = await reorderWBS(request, { params: { id: '1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(reorderedItem)
      expect(wbsRepository.reorder).toHaveBeenCalledWith(1, {
        newParentId: undefined,
        newSortOrder: 2,
        changeReason: '調整項目順序'
      })
    })

    it('should return 400 when newSortOrder is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/wbs/items/1/reorder', {
        method: 'POST',
        body: JSON.stringify({
          changeReason: '調整項目順序'
          // missing newSortOrder
        })
      })

      const response = await reorderWBS(request, { params: { id: '1' } })

      expect(response.status).toBe(400)
    })
  })
})