import { wbsRepository } from '@/repositories/wbsRepository'
import { WBSItem, WBSCreateRequest, WBSUpdateRequest, WBSReorderRequest } from '@shared/types'

// Mock oracledb
jest.mock('oracledb', () => ({
  getConnection: jest.fn(),
  OUT_FORMAT_OBJECT: 'object',
  NUMBER: 'number',
  DATE: 'date',
  BIND_OUT: 'out'
}))

// Mock errors
jest.mock('@/lib/errors', () => ({
  DatabaseError: class extends Error {
    constructor(message: string, code?: string) {
      super(message)
      this.name = 'DatabaseError'
    }
  },
  getStandardErrorMessage: jest.fn((code: string) => `Error: ${code}`)
}))

describe('WBSRepository', () => {
  let mockConnection: any

  beforeEach(() => {
    mockConnection = {
      execute: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      close: jest.fn()
    }

    const oracledb = require('oracledb')
    oracledb.getConnection.mockResolvedValue(mockConnection)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('findByProjectId', () => {
    it('should return WBS items for a project', async () => {
      const mockRows = [
        {
          ID: 1,
          PROJECT_ID: 100,
          PARENT_ID: null,
          CODE: '1.0',
          NAME: '系統分析',
          DESCRIPTION: '系統分析階段',
          LEVEL_NUMBER: 1,
          SORT_ORDER: 0,
          CREATED_AT: new Date()
        },
        {
          ID: 2,
          PROJECT_ID: 100,
          PARENT_ID: 1,
          CODE: '1.1',
          NAME: '需求分析',
          DESCRIPTION: '分析系統需求',
          LEVEL_NUMBER: 2,
          SORT_ORDER: 0,
          CREATED_AT: new Date()
        }
      ]

      mockConnection.execute.mockResolvedValue({ rows: mockRows })

      const result = await wbsRepository.findByProjectId(100)

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        id: 1,
        projectId: 100,
        parentId: null,
        code: '1.0',
        name: '系統分析',
        description: '系統分析階段',
        levelNumber: 1,
        sortOrder: 0,
        createdAt: mockRows[0].CREATED_AT
      })
    })

    it('should return empty array when no items found', async () => {
      mockConnection.execute.mockResolvedValue({ rows: [] })

      const result = await wbsRepository.findByProjectId(100)

      expect(result).toEqual([])
    })
  })

  describe('create', () => {
    it('should create a root WBS item', async () => {
      const createRequest: WBSCreateRequest = {
        projectId: 100,
        code: '1.0',
        name: '系統分析',
        description: '系統分析階段'
      }

      const mockCreatedDate = new Date()
      
      // Mock sort order query
      mockConnection.execute
        .mockResolvedValueOnce({ rows: [{ NEXT_ORDER: 0 }] })
        .mockResolvedValueOnce({
          outBinds: {
            id: [1],
            createdAt: [mockCreatedDate]
          }
        })

      const result = await wbsRepository.create(createRequest)

      expect(result).toEqual({
        id: 1,
        projectId: 100,
        parentId: undefined,
        code: '1.0',
        name: '系統分析',
        description: '系統分析階段',
        levelNumber: 1,
        sortOrder: 0,
        createdAt: mockCreatedDate
      })

      expect(mockConnection.commit).toHaveBeenCalled()
    })

    it('should create a child WBS item with correct level', async () => {
      const createRequest: WBSCreateRequest = {
        projectId: 100,
        parentId: 1,
        code: '1.1',
        name: '需求分析'
      }

      const mockCreatedDate = new Date()
      
      // Mock parent level query and sort order query
      mockConnection.execute
        .mockResolvedValueOnce({ rows: [{ LEVEL_NUMBER: 1 }] })
        .mockResolvedValueOnce({ rows: [{ NEXT_ORDER: 0 }] })
        .mockResolvedValueOnce({
          outBinds: {
            id: [2],
            createdAt: [mockCreatedDate]
          }
        })

      const result = await wbsRepository.create(createRequest)

      expect(result.levelNumber).toBe(2)
      expect(result.parentId).toBe(1)
    })
  })

  describe('update', () => {
    it('should update WBS item fields', async () => {
      const updateRequest: WBSUpdateRequest = {
        code: '1.0-Updated',
        name: '系統分析更新',
        description: '更新的描述'
      }

      const mockUpdatedItem: WBSItem = {
        id: 1,
        projectId: 100,
        parentId: null,
        code: '1.0-Updated',
        name: '系統分析更新',
        description: '更新的描述',
        levelNumber: 1,
        sortOrder: 0,
        createdAt: new Date()
      }

      // Mock update and findById
      mockConnection.execute.mockResolvedValue({ rowsAffected: 1 })
      jest.spyOn(wbsRepository, 'findById').mockResolvedValue(mockUpdatedItem)

      const result = await wbsRepository.update(1, updateRequest)

      expect(result).toEqual(mockUpdatedItem)
      expect(mockConnection.commit).toHaveBeenCalled()
    })
  })

  describe('delete', () => {
    it('should delete WBS item when it has no children', async () => {
      // Mock children count check and delete
      mockConnection.execute
        .mockResolvedValueOnce({ rows: [{ CHILD_COUNT: 0 }] })
        .mockResolvedValueOnce({ rowsAffected: 1 })

      const result = await wbsRepository.delete(1)

      expect(result).toBe(true)
      expect(mockConnection.commit).toHaveBeenCalled()
    })

    it('should throw error when trying to delete item with children', async () => {
      // Mock children count check
      mockConnection.execute.mockResolvedValueOnce({ rows: [{ CHILD_COUNT: 2 }] })

      await expect(wbsRepository.delete(1)).rejects.toThrow('Cannot delete WBS item with children')
    })
  })

  describe('buildHierarchy', () => {
    it('should build hierarchical structure from flat items', () => {
      const flatItems: WBSItem[] = [
        {
          id: 1,
          projectId: 100,
          parentId: null,
          code: '1.0',
          name: '系統分析',
          levelNumber: 1,
          sortOrder: 0,
          createdAt: new Date()
        },
        {
          id: 2,
          projectId: 100,
          parentId: 1,
          code: '1.1',
          name: '需求分析',
          levelNumber: 2,
          sortOrder: 0,
          createdAt: new Date()
        },
        {
          id: 3,
          projectId: 100,
          parentId: 1,
          code: '1.2',
          name: '系統設計',
          levelNumber: 2,
          sortOrder: 1,
          createdAt: new Date()
        }
      ]

      const hierarchy = wbsRepository.buildHierarchy(flatItems)

      expect(hierarchy).toHaveLength(1)
      expect(hierarchy[0].id).toBe(1)
      expect(hierarchy[0].children).toHaveLength(2)
      expect(hierarchy[0].children?.[0].id).toBe(2)
      expect(hierarchy[0].children?.[1].id).toBe(3)
    })

    it('should handle empty items array', () => {
      const hierarchy = wbsRepository.buildHierarchy([])
      expect(hierarchy).toEqual([])
    })
  })

  describe('reorder', () => {
    it('should reorder WBS item within same parent', async () => {
      const currentItem: WBSItem = {
        id: 2,
        projectId: 100,
        parentId: 1,
        code: '1.1',
        name: '需求分析',
        levelNumber: 2,
        sortOrder: 0,
        createdAt: new Date()
      }

      const reorderRequest: WBSReorderRequest = {
        newSortOrder: 2
      }

      jest.spyOn(wbsRepository, 'findById')
        .mockResolvedValueOnce(currentItem)
        .mockResolvedValueOnce({ ...currentItem, sortOrder: 2 })

      mockConnection.execute.mockResolvedValue({ rowsAffected: 1 })

      const result = await wbsRepository.reorder(2, reorderRequest)

      expect(result?.sortOrder).toBe(2)
      expect(mockConnection.commit).toHaveBeenCalled()
    })

    it('should update level when moving to different parent', async () => {
      const currentItem: WBSItem = {
        id: 3,
        projectId: 100,
        parentId: 1,
        code: '1.2',
        name: '系統設計',
        levelNumber: 2,
        sortOrder: 1,
        createdAt: new Date()
      }

      const reorderRequest: WBSReorderRequest = {
        newParentId: 2,
        newSortOrder: 0
      }

      jest.spyOn(wbsRepository, 'findById')
        .mockResolvedValueOnce(currentItem)
        .mockResolvedValueOnce({ ...currentItem, parentId: 2, levelNumber: 3, sortOrder: 0 })

      // Mock parent level query
      mockConnection.execute
        .mockResolvedValueOnce({ rows: [{ LEVEL_NUMBER: 2 }] })
        .mockResolvedValue({ rowsAffected: 1 })

      const result = await wbsRepository.reorder(3, reorderRequest)

      expect(result?.parentId).toBe(2)
      expect(result?.levelNumber).toBe(3)
    })
  })
})