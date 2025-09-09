import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET } from '../../src/app/api/auth/session/route'

// Mock the auth function
jest.mock('../../src/lib/auth', () => ({
  auth: jest.fn()
}))

describe('Auth API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('/api/auth/session', () => {
    it('should return session data when authenticated', async () => {
      const { auth } = require('../../src/lib/auth')
      const mockSession = {
        user: {
          id: '1',
          username: 'testuser',
          name: 'Test User',
          email: 'test@example.com'
        },
        expires: '2024-12-31T23:59:59.000Z'
      }

      auth.mockResolvedValue(mockSession)

      const request = new NextRequest('http://localhost:3000/api/auth/session')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        user: {
          id: '1',
          username: 'testuser',
          name: 'Test User',
          email: 'test@example.com'
        },
        expires: '2024-12-31T23:59:59.000Z'
      })
    })

    it('should return 401 when not authenticated', async () => {
      const { auth } = require('../../src/lib/auth')
      auth.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/auth/session')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({
        error: 'No active session'
      })
    })

    it('should handle auth errors', async () => {
      const { auth } = require('../../src/lib/auth')
      auth.mockRejectedValue(new Error('Auth error'))

      const request = new NextRequest('http://localhost:3000/api/auth/session')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({
        error: 'Internal server error'
      })
    })
  })
})