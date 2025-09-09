import { NextRequest } from 'next/server'
import { GET, POST } from '../../src/app/api/subcontractors/route'
import { GET as GetById, PUT, DELETE } from '../../src/app/api/subcontractors/[id]/route'

describe('Subcontractor API', () => {
  describe('GET /api/subcontractors', () => {
    test('should return all subcontractors', async () => {
      const req = new NextRequest('http://localhost:3000/api/subcontractors')
      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(Array.isArray(data.data)).toBe(true)
      expect(typeof data.count).toBe('number')
    })

    test('should filter subcontractors by name', async () => {
      const req = new NextRequest('http://localhost:3000/api/subcontractors?name=test')
      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(Array.isArray(data.data)).toBe(true)
    })
  })

  describe('POST /api/subcontractors', () => {
    test('should create a new subcontractor with valid data', async () => {
      const subcontractorData = {
        name: 'Test Subcontractor',
        contactPerson: 'John Doe',
        phone: '123-456-7890',
        email: 'test@example.com',
        address: 'Test Address'
      }

      const req = new NextRequest('http://localhost:3000/api/subcontractors', {
        method: 'POST',
        body: JSON.stringify(subcontractorData)
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.name).toBe(subcontractorData.name)
      expect(data.data.contactPerson).toBe(subcontractorData.contactPerson)
      expect(data.data.email).toBe(subcontractorData.email)
    })

    test('should return 400 for missing required name field', async () => {
      const req = new NextRequest('http://localhost:3000/api/subcontractors', {
        method: 'POST',
        body: JSON.stringify({})
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Name is required')
    })

    test('should return 400 for invalid email format', async () => {
      const req = new NextRequest('http://localhost:3000/api/subcontractors', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Subcontractor',
          email: 'invalid-email'
        })
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid email format')
    })
  })

  describe('GET /api/subcontractors/[id]', () => {
    test('should return 400 for invalid ID', async () => {
      const req = new NextRequest('http://localhost:3000/api/subcontractors/invalid')
      const response = await GetById(req, { params: { id: 'invalid' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid subcontractor ID')
    })

    test('should return 404 for non-existent ID', async () => {
      const req = new NextRequest('http://localhost:3000/api/subcontractors/999999')
      const response = await GetById(req, { params: { id: '999999' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Subcontractor not found')
    })
  })

  describe('PUT /api/subcontractors/[id]', () => {
    test('should return 400 for invalid ID', async () => {
      const req = new NextRequest('http://localhost:3000/api/subcontractors/invalid', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated Name' })
      })

      const response = await PUT(req, { params: { id: 'invalid' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid subcontractor ID')
    })

    test('should return 400 for empty name', async () => {
      const req = new NextRequest('http://localhost:3000/api/subcontractors/1', {
        method: 'PUT',
        body: JSON.stringify({ name: '' })
      })

      const response = await PUT(req, { params: { id: '1' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Name must be a non-empty string')
    })
  })

  describe('DELETE /api/subcontractors/[id]', () => {
    test('should return 400 for invalid ID', async () => {
      const req = new NextRequest('http://localhost:3000/api/subcontractors/invalid', {
        method: 'DELETE'
      })

      const response = await DELETE(req, { params: { id: 'invalid' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid subcontractor ID')
    })

    test('should return 404 for non-existent ID', async () => {
      const req = new NextRequest('http://localhost:3000/api/subcontractors/999999', {
        method: 'DELETE'
      })

      const response = await DELETE(req, { params: { id: '999999' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Subcontractor not found')
    })
  })
})