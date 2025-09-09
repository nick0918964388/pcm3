import { NextRequest } from 'next/server'
import { GET, POST } from '../../src/app/api/personnel/route'
import { GET as GetById, PUT, DELETE } from '../../src/app/api/personnel/[id]/route'

describe('Personnel API', () => {
  describe('GET /api/personnel', () => {
    test('should return all personnel', async () => {
      const req = new NextRequest('http://localhost:3000/api/personnel')
      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(Array.isArray(data.data)).toBe(true)
      expect(typeof data.count).toBe('number')
    })

    test('should filter personnel by name', async () => {
      const req = new NextRequest('http://localhost:3000/api/personnel?name=test')
      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(Array.isArray(data.data)).toBe(true)
    })

    test('should filter personnel by subcontractor ID', async () => {
      const req = new NextRequest('http://localhost:3000/api/personnel?subcontractorId=1')
      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(Array.isArray(data.data)).toBe(true)
    })
  })

  describe('POST /api/personnel', () => {
    test('should create a new personnel with valid data', async () => {
      const personnelData = {
        subcontractorId: 1,
        name: 'Test Personnel',
        position: 'Engineer',
        phone: '123-456-7890',
        email: 'personnel@example.com',
        employeeId: 'EMP001'
      }

      const req = new NextRequest('http://localhost:3000/api/personnel', {
        method: 'POST',
        body: JSON.stringify(personnelData)
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.name).toBe(personnelData.name)
      expect(data.data.subcontractorId).toBe(personnelData.subcontractorId)
      expect(data.data.position).toBe(personnelData.position)
      expect(data.data.email).toBe(personnelData.email)
    })

    test('should return 400 for missing required name field', async () => {
      const req = new NextRequest('http://localhost:3000/api/personnel', {
        method: 'POST',
        body: JSON.stringify({ subcontractorId: 1 })
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Name is required')
    })

    test('should return 400 for missing subcontractor ID', async () => {
      const req = new NextRequest('http://localhost:3000/api/personnel', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test Personnel' })
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Valid subcontractorId is required')
    })

    test('should return 400 for invalid email format', async () => {
      const req = new NextRequest('http://localhost:3000/api/personnel', {
        method: 'POST',
        body: JSON.stringify({
          subcontractorId: 1,
          name: 'Test Personnel',
          email: 'invalid-email'
        })
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid email format')
    })

    test('should return 400 for non-existent subcontractor', async () => {
      const req = new NextRequest('http://localhost:3000/api/personnel', {
        method: 'POST',
        body: JSON.stringify({
          subcontractorId: 999999,
          name: 'Test Personnel'
        })
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Subcontractor not found')
    })
  })

  describe('GET /api/personnel/[id]', () => {
    test('should return 400 for invalid ID', async () => {
      const req = new NextRequest('http://localhost:3000/api/personnel/invalid')
      const response = await GetById(req, { params: { id: 'invalid' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid personnel ID')
    })

    test('should return 404 for non-existent ID', async () => {
      const req = new NextRequest('http://localhost:3000/api/personnel/999999')
      const response = await GetById(req, { params: { id: '999999' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Personnel not found')
    })
  })

  describe('PUT /api/personnel/[id]', () => {
    test('should return 400 for invalid ID', async () => {
      const req = new NextRequest('http://localhost:3000/api/personnel/invalid', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated Name' })
      })

      const response = await PUT(req, { params: { id: 'invalid' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid personnel ID')
    })

    test('should return 400 for empty name', async () => {
      const req = new NextRequest('http://localhost:3000/api/personnel/1', {
        method: 'PUT',
        body: JSON.stringify({ name: '' })
      })

      const response = await PUT(req, { params: { id: '1' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Name must be a non-empty string')
    })

    test('should return 400 for invalid subcontractor ID', async () => {
      const req = new NextRequest('http://localhost:3000/api/personnel/1', {
        method: 'PUT',
        body: JSON.stringify({ subcontractorId: 999999 })
      })

      const response = await PUT(req, { params: { id: '1' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Subcontractor not found')
    })
  })

  describe('DELETE /api/personnel/[id]', () => {
    test('should return 400 for invalid ID', async () => {
      const req = new NextRequest('http://localhost:3000/api/personnel/invalid', {
        method: 'DELETE'
      })

      const response = await DELETE(req, { params: { id: 'invalid' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid personnel ID')
    })

    test('should return 404 for non-existent ID', async () => {
      const req = new NextRequest('http://localhost:3000/api/personnel/999999', {
        method: 'DELETE'
      })

      const response = await DELETE(req, { params: { id: '999999' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Personnel not found')
    })
  })
})