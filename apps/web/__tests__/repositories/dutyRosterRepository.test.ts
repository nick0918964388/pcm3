import { dutyRosterRepository, CreateDutyRosterData, UpdateDutyRosterData } from '../../src/repositories/dutyRosterRepository'
import { DatabaseError } from '../../src/lib/errors'

// Mock oracledb
jest.mock('oracledb', () => ({
  getConnection: jest.fn(),
  BIND_OUT: 'BIND_OUT',
  NUMBER: 'NUMBER',
  OUT_FORMAT_OBJECT: 'OUT_FORMAT_OBJECT'
}))

describe('DutyRosterRepository', () => {
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

  describe('create', () => {
    const mockCreateData: CreateDutyRosterData = {
      projectId: 1,
      personnelId: 1,
      dutyDate: new Date('2024-01-15'),
      shiftType: 'day',
      notes: 'Test notes'
    }

    it('should create duty roster successfully', async () => {
      const mockConflictResult = { rows: [{ COUNT: 0 }] }
      const mockInsertResult = { outBinds: { id: 123 } }
      const mockFindResult = {
        rows: [{
          ID: 123,
          PROJECT_ID: 1,
          PERSONNEL_ID: 1,
          DUTY_DATE: new Date('2024-01-15'),
          SHIFT_TYPE: 'day',
          NOTES: 'Test notes',
          CREATED_AT: new Date(),
          PERSONNEL_NAME: 'John Doe',
          PERSONNEL_POSITION: 'Engineer',
          SUBCONTRACTOR_NAME: 'Test Company'
        }]
      }

      mockConnection.execute
        .mockResolvedValueOnce(mockConflictResult) // Conflict check
        .mockResolvedValueOnce(mockInsertResult) // Insert
        .mockResolvedValueOnce(mockFindResult) // Find by ID

      const result = await dutyRosterRepository.create(mockCreateData)

      expect(result).toMatchObject({
        id: 123,
        projectId: 1,
        personnelId: 1,
        shiftType: 'day',
        notes: 'Test notes'
      })
      expect(mockConnection.commit).toHaveBeenCalled()
    })

    it('should throw error when conflict exists', async () => {
      const mockConflictResult = { rows: [{ COUNT: 1 }] }

      mockConnection.execute.mockResolvedValueOnce(mockConflictResult)

      await expect(dutyRosterRepository.create(mockCreateData))
        .rejects.toThrow('Personnel already assigned to this shift on this date')
    })

    it('should rollback on database error', async () => {
      mockConnection.execute.mockRejectedValue(new Error('Database error'))

      await expect(dutyRosterRepository.create(mockCreateData))
        .rejects.toThrow(DatabaseError)
      expect(mockConnection.rollback).toHaveBeenCalled()
    })
  })

  describe('findById', () => {
    it('should return duty roster when found', async () => {
      const mockResult = {
        rows: [{
          ID: 1,
          PROJECT_ID: 1,
          PERSONNEL_ID: 1,
          DUTY_DATE: new Date('2024-01-15'),
          SHIFT_TYPE: 'day',
          NOTES: 'Test notes',
          CREATED_AT: new Date(),
          PERSONNEL_NAME: 'John Doe',
          PERSONNEL_POSITION: 'Engineer',
          SUBCONTRACTOR_NAME: 'Test Company'
        }]
      }

      mockConnection.execute.mockResolvedValue(mockResult)

      const result = await dutyRosterRepository.findById(1)

      expect(result).toMatchObject({
        id: 1,
        projectId: 1,
        personnelId: 1,
        shiftType: 'day'
      })
    })

    it('should return null when not found', async () => {
      mockConnection.execute.mockResolvedValue({ rows: [] })

      const result = await dutyRosterRepository.findById(999)

      expect(result).toBeNull()
    })
  })

  describe('findAll', () => {
    it('should return filtered duty rosters', async () => {
      const mockResult = {
        rows: [
          {
            ID: 1,
            PROJECT_ID: 1,
            PERSONNEL_ID: 1,
            DUTY_DATE: new Date('2024-01-15'),
            SHIFT_TYPE: 'day',
            NOTES: null,
            CREATED_AT: new Date(),
            PERSONNEL_NAME: 'John Doe',
            PERSONNEL_POSITION: 'Engineer',
            SUBCONTRACTOR_NAME: 'Test Company'
          }
        ]
      }

      mockConnection.execute.mockResolvedValue(mockResult)

      const filters = {
        projectId: 1,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31')
      }

      const result = await dutyRosterRepository.findAll(filters)

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        id: 1,
        projectId: 1,
        personnelId: 1
      })
    })
  })

  describe('update', () => {
    const mockUpdateData: UpdateDutyRosterData = {
      shiftType: 'night',
      notes: 'Updated notes'
    }

    it('should update duty roster successfully', async () => {
      const mockCurrentRoster = {
        id: 1,
        projectId: 1,
        personnelId: 1,
        dutyDate: new Date('2024-01-15'),
        shiftType: 'day',
        notes: 'Original notes'
      }

      const mockConflictResult = { rows: [{ COUNT: 0 }] }
      const mockUpdatedRoster = { ...mockCurrentRoster, ...mockUpdateData }

      // Mock findById calls
      dutyRosterRepository.findById = jest.fn()
        .mockResolvedValueOnce(mockCurrentRoster) // For conflict check
        .mockResolvedValueOnce(mockUpdatedRoster) // For return

      mockConnection.execute
        .mockResolvedValueOnce(mockConflictResult) // Conflict check
        .mockResolvedValueOnce({ rowsAffected: 1 }) // Update

      const result = await dutyRosterRepository.update(1, mockUpdateData)

      expect(result).toMatchObject({
        shiftType: 'night',
        notes: 'Updated notes'
      })
      expect(mockConnection.commit).toHaveBeenCalled()
    })
  })

  describe('delete', () => {
    it('should delete duty roster successfully', async () => {
      mockConnection.execute.mockResolvedValue({ rowsAffected: 1 })

      const result = await dutyRosterRepository.delete(1)

      expect(result).toBe(true)
      expect(mockConnection.commit).toHaveBeenCalled()
    })

    it('should return false when no rows affected', async () => {
      mockConnection.execute.mockResolvedValue({ rowsAffected: 0 })

      const result = await dutyRosterRepository.delete(999)

      expect(result).toBe(false)
    })
  })

  describe('checkConflicts', () => {
    it('should return true when conflict exists', async () => {
      const mockResult = { rows: [{ COUNT: 1 }] }
      mockConnection.execute.mockResolvedValue(mockResult)

      const result = await dutyRosterRepository.checkConflicts(
        1, 1, new Date('2024-01-15'), 'day'
      )

      expect(result).toBe(true)
    })

    it('should return false when no conflict', async () => {
      const mockResult = { rows: [{ COUNT: 0 }] }
      mockConnection.execute.mockResolvedValue(mockResult)

      const result = await dutyRosterRepository.checkConflicts(
        1, 1, new Date('2024-01-15'), 'day'
      )

      expect(result).toBe(false)
    })
  })
})