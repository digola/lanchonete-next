import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/users/route'
import { GET as GetUser, PUT, DELETE } from '@/app/api/users/[id]/route'
import { 
  ApiTestUtils, 
  DatabaseTestUtils, 
  NetworkUtils, 
  TestSecurity,
  CleanupUtils 
} from '../utils/testHelpers'

describe('Users API - CRUD Operations', () => {
  let testUserId: string
  let testUserData: any

  beforeAll(async () => {
    // Verify test environment safety
    TestSecurity.validatePath(__filename)
  })

  beforeEach(() => {
    testUserData = DatabaseTestUtils.generateTestUser()
  })

  afterEach(async () => {
    await CleanupUtils.cleanupAll()
  })

  describe('POST /api/users - Create User', () => {
    it('should create a new user successfully', async () => {
      const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/users', testUserData)
      
      const response = await NetworkUtils.retryOperation(async () => {
        return await POST(request)
      })

      await ApiTestUtils.expectApiResponse(response, 201)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('id')
      expect(data.data.email).toBe(testUserData.email)
      expect(data.data.name).toBe(testUserData.name)
      
      testUserId = data.data.id
      
      // Register cleanup
      CleanupUtils.registerCleanup('user', testUserId, async () => {
        const deleteRequest = ApiTestUtils.createNextRequest('DELETE', `http://localhost:3000/api/users/${testUserId}`)
        await DELETE(deleteRequest, { params: { id: testUserId } })
      })
    })

    it('should validate required fields', async () => {
      const invalidData = { name: 'Test' } // Missing email and password
      const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/users', invalidData)
      
      const response = await POST(request)
      
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toContain('required')
    })

    it('should prevent duplicate email registration', async () => {
      // Create first user
      const request1 = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/users', testUserData)
      const response1 = await POST(request1)
      
      expect(response1.status).toBe(201)
      const data1 = await response1.json()
      testUserId = data1.data.id
      
      // Register cleanup
      CleanupUtils.registerCleanup('user', testUserId, async () => {
        const deleteRequest = ApiTestUtils.createNextRequest('DELETE', `http://localhost:3000/api/users/${testUserId}`)
        await DELETE(deleteRequest, { params: { id: testUserId } })
      })

      // Try to create user with same email
      const request2 = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/users', testUserData)
      const response2 = await POST(request2)
      
      expect(response2.status).toBe(409)
      const data2 = await response2.json()
      expect(data2.success).toBe(false)
      expect(data2.error).toContain('email')
    })

    it('should handle network failures with retry', async () => {
      let attempts = 0
      const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/users', testUserData)
      
      const response = await NetworkUtils.retryOperation(async () => {
        attempts++
        if (attempts < 2) {
          throw new Error('Network error')
        }
        return await POST(request)
      }, 3, 1000)

      expect(attempts).toBe(2)
      expect(response.status).toBe(201)
    })
  })

  describe('GET /api/users - List Users', () => {
    beforeEach(async () => {
      // Create test user for listing
      const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/users', testUserData)
      const response = await POST(request)
      const data = await response.json()
      testUserId = data.data.id
      
      CleanupUtils.registerCleanup('user', testUserId, async () => {
        const deleteRequest = ApiTestUtils.createNextRequest('DELETE', `http://localhost:3000/api/users/${testUserId}`)
        await DELETE(deleteRequest, { params: { id: testUserId } })
      })
    })

    it('should list users with pagination', async () => {
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/users?page=1&limit=10')
      
      const response = await NetworkUtils.retryOperation(async () => {
        return await GET(request)
      })

      await ApiTestUtils.expectApiResponse(response, 200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('users')
      expect(data.data).toHaveProperty('pagination')
      expect(Array.isArray(data.data.users)).toBe(true)
    })

    it('should filter users by role', async () => {
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/users?role=customer')
      
      const response = await GET(request)
      
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      
      if (data.data.users.length > 0) {
        data.data.users.forEach((user: any) => {
          expect(user.role).toBe('customer')
        })
      }
    })

    it('should search users by name or email', async () => {
      const searchTerm = testUserData.name.substring(0, 4)
      const request = ApiTestUtils.createNextRequest('GET', `http://localhost:3000/api/users?search=${searchTerm}`)
      
      const response = await GET(request)
      
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
    })
  })

  describe('GET /api/users/[id] - Get User by ID', () => {
    beforeEach(async () => {
      // Create test user
      const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/users', testUserData)
      const response = await POST(request)
      const data = await response.json()
      testUserId = data.data.id
      
      CleanupUtils.registerCleanup('user', testUserId, async () => {
        const deleteRequest = ApiTestUtils.createNextRequest('DELETE', `http://localhost:3000/api/users/${testUserId}`)
        await DELETE(deleteRequest, { params: { id: testUserId } })
      })
    })

    it('should get user by valid ID', async () => {
      const request = ApiTestUtils.createNextRequest('GET', `http://localhost:3000/api/users/${testUserId}`)
      
      const response = await NetworkUtils.retryOperation(async () => {
        return await GetUser(request, { params: { id: testUserId } })
      })

      await ApiTestUtils.expectApiResponse(response, 200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.id).toBe(testUserId)
      expect(data.data.email).toBe(testUserData.email)
    })

    it('should return 404 for non-existent user', async () => {
      const fakeId = 'non-existent-id'
      const request = ApiTestUtils.createNextRequest('GET', `http://localhost:3000/api/users/${fakeId}`)
      
      const response = await GetUser(request, { params: { id: fakeId } })
      
      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.success).toBe(false)
    })
  })

  describe('PUT /api/users/[id] - Update User', () => {
    beforeEach(async () => {
      // Create test user
      const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/users', testUserData)
      const response = await POST(request)
      const data = await response.json()
      testUserId = data.data.id
      
      CleanupUtils.registerCleanup('user', testUserId, async () => {
        const deleteRequest = ApiTestUtils.createNextRequest('DELETE', `http://localhost:3000/api/users/${testUserId}`)
        await DELETE(deleteRequest, { params: { id: testUserId } })
      })
    })

    it('should update user successfully', async () => {
      const updateData = {
        name: 'Updated Test User',
        phone: '(11) 88888-8888'
      }
      
      const request = ApiTestUtils.createNextRequest('PUT', `http://localhost:3000/api/users/${testUserId}`, updateData)
      
      const response = await NetworkUtils.retryOperation(async () => {
        return await PUT(request, { params: { id: testUserId } })
      })

      await ApiTestUtils.expectApiResponse(response, 200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.name).toBe(updateData.name)
      expect(data.data.phone).toBe(updateData.phone)
    })

    it('should validate update data', async () => {
      const invalidData = {
        email: 'invalid-email' // Invalid email format
      }
      
      const request = ApiTestUtils.createNextRequest('PUT', `http://localhost:3000/api/users/${testUserId}`, invalidData)
      
      const response = await PUT(request, { params: { id: testUserId } })
      
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.success).toBe(false)
    })
  })

  describe('DELETE /api/users/[id] - Delete User', () => {
    beforeEach(async () => {
      // Create test user
      const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/users', testUserData)
      const response = await POST(request)
      const data = await response.json()
      testUserId = data.data.id
    })

    it('should delete user successfully', async () => {
      const request = ApiTestUtils.createNextRequest('DELETE', `http://localhost:3000/api/users/${testUserId}`)
      
      const response = await NetworkUtils.retryOperation(async () => {
        return await DELETE(request, { params: { id: testUserId } })
      })

      await ApiTestUtils.expectApiResponse(response, 200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      
      // Verify user is deleted
      const getRequest = ApiTestUtils.createNextRequest('GET', `http://localhost:3000/api/users/${testUserId}`)
      const getResponse = await GetUser(getRequest, { params: { id: testUserId } })
      expect(getResponse.status).toBe(404)
    })

    it('should return 404 when deleting non-existent user', async () => {
      const fakeId = 'non-existent-id'
      const request = ApiTestUtils.createNextRequest('DELETE', `http://localhost:3000/api/users/${fakeId}`)
      
      const response = await DELETE(request, { params: { id: fakeId } })
      
      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.success).toBe(false)
    })
  })

  describe('Security and Safety Tests', () => {
    it('should prevent SQL injection attempts', async () => {
      const maliciousData = {
        name: "'; DROP TABLE users; --",
        email: 'test@example.com',
        password: 'Test123!@#'
      }
      
      const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/users', maliciousData)
      
      // Should either sanitize input or reject request
      const response = await POST(request)
      
      // Response should be handled safely (either success with sanitized data or error)
      expect([200, 201, 400, 422]).toContain(response.status)
    })

    it('should validate file path safety', () => {
      expect(() => {
        TestSecurity.validatePath('C:\\Windows\\System32\\test.txt')
      }).toThrow('SECURITY VIOLATION')
      
      expect(() => {
        TestSecurity.validatePath('__tests__/api/users.test.ts')
      }).not.toThrow()
    })

    it('should sanitize user input', () => {
      const maliciousInput = '<script>alert("xss")</script>'
      const sanitized = TestSecurity.sanitizeInput(maliciousInput)
      
      expect(sanitized).not.toContain('<script>')
      expect(sanitized).not.toContain('alert')
    })
  })
})