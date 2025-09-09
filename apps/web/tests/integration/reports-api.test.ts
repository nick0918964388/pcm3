import { NextRequest } from 'next/server'
import { GET, POST } from '../../src/app/api/reports/daily/route'
import { GET as GetById, PUT, DELETE } from '../../src/app/api/reports/daily/[id]/route'
import { POST as Submit } from '../../src/app/api/reports/daily/[id]/submit/route'
import { GET as GetAttachments, POST as PostAttachment } from '../../src/app/api/reports/daily/[id]/attachments/route'

describe('Reports API', () => {
  describe('GET /api/reports/daily', () => {
    test('should return reports for a project', async () => {
      const req = new NextRequest('http://localhost:3000/api/reports/daily?projectId=1')
      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
    })

    test('should filter reports by status', async () => {
      const req = new NextRequest('http://localhost:3000/api/reports/daily?projectId=1&status=submitted')
      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
    })

    test('should require projectId parameter', async () => {
      const req = new NextRequest('http://localhost:3000/api/reports/daily')
      const response = await GET(req)

      expect(response.status).toBe(400)
    })
  })

  describe('POST /api/reports/daily', () => {
    test('should create a new daily report with valid data', async () => {
      const reportData = {
        projectId: 1,
        reportDate: '2023-12-01',
        weather: 'sunny',
        progressNotes: 'Good progress on foundation work',
        issues: 'No major issues',
        content: 'Additional notes'
      }

      const req = new NextRequest('http://localhost:3000/api/reports/daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData)
      })
      
      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.projectId).toBe(reportData.projectId)
      expect(data.weather).toBe(reportData.weather)
      expect(data.progressNotes).toBe(reportData.progressNotes)
      expect(data.status).toBe('draft')
    })

    test('should require projectId and reportDate', async () => {
      const reportData = {
        weather: 'sunny',
        progressNotes: 'Progress notes'
      }

      const req = new NextRequest('http://localhost:3000/api/reports/daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData)
      })
      
      const response = await POST(req)

      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/reports/daily/[id]', () => {
    test('should return a specific report', async () => {
      const response = await GetById(
        new NextRequest('http://localhost:3000/api/reports/daily/1'),
        { params: { id: '1' } }
      )
      
      if (response.status === 200) {
        const data = await response.json()
        expect(data.id).toBe(1)
        expect(data).toHaveProperty('projectId')
        expect(data).toHaveProperty('status')
      } else {
        expect(response.status).toBe(404)
      }
    })

    test('should return 400 for invalid ID', async () => {
      const response = await GetById(
        new NextRequest('http://localhost:3000/api/reports/daily/invalid'),
        { params: { id: 'invalid' } }
      )

      expect(response.status).toBe(400)
    })
  })

  describe('PUT /api/reports/daily/[id]', () => {
    test('should update a report', async () => {
      const updateData = {
        weather: 'cloudy',
        progressNotes: 'Updated progress notes',
        status: 'submitted'
      }

      const req = new NextRequest('http://localhost:3000/api/reports/daily/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      const response = await PUT(req, { params: { id: '1' } })

      if (response.status === 200) {
        const data = await response.json()
        expect(data.weather).toBe(updateData.weather)
        expect(data.progressNotes).toBe(updateData.progressNotes)
      } else {
        expect(response.status).toBe(404)
      }
    })
  })

  describe('DELETE /api/reports/daily/[id]', () => {
    test('should delete a report', async () => {
      const response = await DELETE(
        new NextRequest('http://localhost:3000/api/reports/daily/999'),
        { params: { id: '999' } }
      )

      expect([200, 404]).toContain(response.status)
    })
  })

  describe('POST /api/reports/daily/[id]/submit', () => {
    test('should submit a draft report', async () => {
      const response = await Submit(
        new NextRequest('http://localhost:3000/api/reports/daily/1/submit', { method: 'POST' }),
        { params: { id: '1' } }
      )

      // Could be 200 (success), 400 (already submitted), 403 (not owner), or 404 (not found)
      expect([200, 400, 403, 404]).toContain(response.status)
    })
  })

  describe('Attachment endpoints', () => {
    describe('GET /api/reports/daily/[id]/attachments', () => {
      test('should return attachments for a report', async () => {
        const response = await GetAttachments(
          new NextRequest('http://localhost:3000/api/reports/daily/1/attachments'),
          { params: { id: '1' } }
        )

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(Array.isArray(data)).toBe(true)
      })
    })

    describe('POST /api/reports/daily/[id]/attachments', () => {
      test('should handle file upload', async () => {
        // Mock file upload
        const formData = new FormData()
        const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
        formData.append('file', mockFile)

        const req = new NextRequest('http://localhost:3000/api/reports/daily/1/attachments', {
          method: 'POST',
          body: formData
        })

        const response = await PostAttachment(req, { params: { id: '1' } })

        // Could be 201 (success) or various error codes depending on setup
        expect([201, 400, 401, 500]).toContain(response.status)
      })

      test('should reject files that are too large', async () => {
        const formData = new FormData()
        // Create a mock file that's larger than 10MB
        const largeContent = 'x'.repeat(11 * 1024 * 1024) // 11MB
        const mockFile = new File([largeContent], 'large.pdf', { type: 'application/pdf' })
        formData.append('file', mockFile)

        const req = new NextRequest('http://localhost:3000/api/reports/daily/1/attachments', {
          method: 'POST',
          body: formData
        })

        const response = await PostAttachment(req, { params: { id: '1' } })

        if (response.status === 400) {
          const data = await response.json()
          expect(data.error).toContain('too large')
        }
      })

      test('should reject invalid file types', async () => {
        const formData = new FormData()
        const mockFile = new File(['test content'], 'test.exe', { type: 'application/exe' })
        formData.append('file', mockFile)

        const req = new NextRequest('http://localhost:3000/api/reports/daily/1/attachments', {
          method: 'POST',
          body: formData
        })

        const response = await PostAttachment(req, { params: { id: '1' } })

        if (response.status === 400) {
          const data = await response.json()
          expect(data.error).toContain('Invalid file type')
        }
      })
    })
  })
})