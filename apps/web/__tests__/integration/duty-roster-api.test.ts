import { GET, POST } from '../../src/app/api/duty-rosters/route'
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'

// Mock dependencies
jest.mock('next-auth')
jest.mock('../../src/repositories/dutyRosterRepository')

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>

describe('/api/duty-rosters', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('should return 401 when not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/duty-rosters')
      const response = await GET(request)

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Unauthorized')
    })

    it('should return duty rosters with filters', async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: '1' } } as any)

      const { dutyRosterRepository } = require('../../src/repositories/dutyRosterRepository')
      dutyRosterRepository.findAll.mockResolvedValue([
        {
          id: 1,
          projectId: 1,
          personnelId: 1,
          dutyDate: new Date('2024-01-15'),
          shiftType: 'day',
          notes: 'Test duty'
        }
      ])

      const request = new NextRequest('http://localhost/api/duty-rosters?projectId=1&startDate=2024-01-01')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(1)
    })
  })

  describe('POST', () => {
    it('should create duty roster successfully', async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: '1' } } as any)

      const { dutyRosterRepository } = require('../../src/repositories/dutyRosterRepository')
      dutyRosterRepository.create.mockResolvedValue({
        id: 1,
        projectId: 1,
        personnelId: 1,
        dutyDate: new Date('2024-01-15'),
        shiftType: 'day',
        notes: 'Test duty'
      })

      const request = new NextRequest('http://localhost/api/duty-rosters', {
        method: 'POST',
        body: JSON.stringify({
          projectId: 1,
          personnelId: 1,
          dutyDate: '2024-01-15',
          shiftType: 'day',
          notes: 'Test duty'
        }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.id).toBe(1)
    })

    it('should return 400 for missing required fields', async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: '1' } } as any)

      const request = new NextRequest('http://localhost/api/duty-rosters', {
        method: 'POST',
        body: JSON.stringify({
          projectId: 1
          // Missing required fields
        }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toContain('Missing required fields')
    })

    it('should return 409 for conflict', async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: '1' } } as any)

      const { dutyRosterRepository } = require('../../src/repositories/dutyRosterRepository')
      const { DatabaseError } = require('../../src/lib/errors')
      dutyRosterRepository.create.mockRejectedValue(new DatabaseError('Conflict', 'CONFLICT_ERROR'))

      const request = new NextRequest('http://localhost/api/duty-rosters', {
        method: 'POST',
        body: JSON.stringify({
          projectId: 1,
          personnelId: 1,
          dutyDate: '2024-01-15',
          shiftType: 'day'
        }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)

      expect(response.status).toBe(409)
      const data = await response.json()
      expect(data.success).toBe(false)
    })
  })
})