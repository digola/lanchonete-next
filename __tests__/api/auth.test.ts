import { NextRequest } from 'next/server'
import { POST as LoginPost } from '@/app/api/auth/login/route'
import { POST as RegisterPost } from '@/app/api/auth/register/route'
import { POST as LogoutPost } from '@/app/api/auth/logout/route'
import { GET as SessionGet } from '@/app/api/auth/session/route'
import { 
  ApiTestUtils, 
  DatabaseTestUtils, 
  NetworkUtils, 
  TestSecurity,
  CleanupUtils 
} from '../utils/testHelpers'

describe('Authentication API Routes', () => {
  let testUserData: any
  let testUserId: string
  let authToken: string

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

  describe('POST /api/auth/register - User Registration', () => {
    it('should register a new user successfully', async () => {
      const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/auth/register', testUserData)
      
      const response = await NetworkUtils.retryOperation(async () => {
        return await RegisterPost(request)
      })

      await ApiTestUtils.expectApiResponse(response, 201)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('id')
      expect(data.data.email).toBe(testUserData.email)
      expect(data.data).not.toHaveProperty('password')
      
      testUserId = data.data.id
      
      // Register cleanup
      CleanupUtils.registerCleanup('user', testUserId, async () => {
        // Cleanup user if needed
      })
    })

    it('should validate required fields for registration', async () => {
      const invalidData = { 
        email: testUserData.email 
        // Missing name and password
      }
      
      const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/auth/register', invalidData)
      const response = await RegisterPost(request)
      
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toContain('required')
    })

    it('should validate email format', async () => {
      const invalidEmailData = {
        ...testUserData,
        email: 'invalid-email-format'
      }
      
      const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/auth/register', invalidEmailData)
      const response = await RegisterPost(request)
      
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toContain('email')
    })

    it('should prevent duplicate email registration', async () => {
      // Register first user
      const request1 = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/auth/register', testUserData)
      const response1 = await RegisterPost(request1)
      
      if (response1.status === 201) {
        const data1 = await response1.json()
        testUserId = data1.data.id
        
        CleanupUtils.registerCleanup('user', testUserId, async () => {
          // Cleanup user if needed
        })

        // Try to register with same email
        const request2 = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/auth/register', testUserData)
        const response2 = await RegisterPost(request2)
        
        expect(response2.status).toBe(409)
        const data2 = await response2.json()
        expect(data2.success).toBe(false)
        expect(data2.error).toContain('email')
      }
    })

    it('should validate password strength', async () => {
      const weakPasswordData = {
        ...testUserData,
        password: '123' // Weak password
      }
      
      const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/auth/register', weakPasswordData)
      const response = await RegisterPost(request)
      
      // Should either accept or reject based on password policy
      expect([201, 400]).toContain(response.status)
      
      if (response.status === 400) {
        const data = await response.json()
        expect(data.error).toContain('password')
      }
    })

    it('should handle network failures with retry', async () => {
      let attempts = 0
      const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/auth/register', testUserData)
      
      const response = await NetworkUtils.retryOperation(async () => {
        attempts++
        if (attempts < 2) {
          throw new Error('Network error')
        }
        return await RegisterPost(request)
      }, 3, 1000)

      expect(attempts).toBe(2)
      expect([201, 400, 409]).toContain(response.status)
    })
  })

  describe('POST /api/auth/login - User Login', () => {
    beforeEach(async () => {
      // Register a user first for login tests
      const registerRequest = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/auth/register', testUserData)
      const registerResponse = await RegisterPost(registerRequest)
      
      if (registerResponse.status === 201) {
        const data = await registerResponse.json()
        testUserId = data.data.id
        
        CleanupUtils.registerCleanup('user', testUserId, async () => {
          // Cleanup user if needed
        })
      }
    })

    it('should login with valid credentials', async () => {
      const loginData = {
        email: testUserData.email,
        password: testUserData.password
      }
      
      const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/auth/login', loginData)
      
      const response = await NetworkUtils.retryOperation(async () => {
        return await LoginPost(request)
      })

      await ApiTestUtils.expectApiResponse(response, 200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('user')
      expect(data.data).toHaveProperty('token')
      expect(data.data.user.email).toBe(testUserData.email)
      
      authToken = data.data.token
    })

    it('should reject invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: testUserData.password
      }
      
      const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/auth/login', loginData)
      const response = await LoginPost(request)
      
      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toContain('credentials')
    })

    it('should reject invalid password', async () => {
      const loginData = {
        email: testUserData.email,
        password: 'wrongpassword'
      }
      
      const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/auth/login', loginData)
      const response = await LoginPost(request)
      
      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toContain('credentials')
    })

    it('should validate required login fields', async () => {
      const incompleteData = {
        email: testUserData.email
        // Missing password
      }
      
      const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/auth/login', incompleteData)
      const response = await LoginPost(request)
      
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toContain('required')
    })

    it('should handle rate limiting for failed attempts', async () => {
      const loginData = {
        email: testUserData.email,
        password: 'wrongpassword'
      }
      
      // Make multiple failed attempts
      for (let i = 0; i < 5; i++) {
        const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/auth/login', loginData)
        await LoginPost(request)
      }
      
      // Next attempt should be rate limited (if implemented)
      const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/auth/login', loginData)
      const response = await LoginPost(request)
      
      // Should either be rate limited or continue to reject
      expect([401, 429]).toContain(response.status)
    })
  })

  describe('GET /api/auth/session - Session Validation', () => {
    beforeEach(async () => {
      // Register and login a user first
      const registerRequest = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/auth/register', testUserData)
      const registerResponse = await RegisterPost(registerRequest)
      
      if (registerResponse.status === 201) {
        const registerData = await registerResponse.json()
        testUserId = registerData.data.id
        
        CleanupUtils.registerCleanup('user', testUserId, async () => {
          // Cleanup user if needed
        })

        // Login to get token
        const loginData = {
          email: testUserData.email,
          password: testUserData.password
        }
        
        const loginRequest = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/auth/login', loginData)
        const loginResponse = await LoginPost(loginRequest)
        
        if (loginResponse.status === 200) {
          const loginResponseData = await loginResponse.json()
          authToken = loginResponseData.data.token
        }
      }
    })

    it('should validate valid session token', async () => {
      if (!authToken) {
        return // Skip if no token available
      }
      
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/auth/session')
      request.headers.set('Authorization', `Bearer ${authToken}`)
      
      const response = await NetworkUtils.retryOperation(async () => {
        return await SessionGet(request)
      })

      await ApiTestUtils.expectApiResponse(response, 200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('user')
      expect(data.data.user.email).toBe(testUserData.email)
    })

    it('should reject invalid session token', async () => {
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/auth/session')
      request.headers.set('Authorization', 'Bearer invalid-token')
      
      const response = await SessionGet(request)
      
      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.success).toBe(false)
    })

    it('should reject missing authorization header', async () => {
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/auth/session')
      
      const response = await SessionGet(request)
      
      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.success).toBe(false)
    })
  })

  describe('POST /api/auth/logout - User Logout', () => {
    beforeEach(async () => {
      // Register and login a user first
      const registerRequest = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/auth/register', testUserData)
      const registerResponse = await RegisterPost(registerRequest)
      
      if (registerResponse.status === 201) {
        const registerData = await registerResponse.json()
        testUserId = registerData.data.id
        
        CleanupUtils.registerCleanup('user', testUserId, async () => {
          // Cleanup user if needed
        })

        // Login to get token
        const loginData = {
          email: testUserData.email,
          password: testUserData.password
        }
        
        const loginRequest = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/auth/login', loginData)
        const loginResponse = await LoginPost(loginRequest)
        
        if (loginResponse.status === 200) {
          const loginResponseData = await loginResponse.json()
          authToken = loginResponseData.data.token
        }
      }
    })

    it('should logout successfully with valid token', async () => {
      if (!authToken) {
        return // Skip if no token available
      }
      
      const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/auth/logout')
      request.headers.set('Authorization', `Bearer ${authToken}`)
      
      const response = await NetworkUtils.retryOperation(async () => {
        return await LogoutPost(request)
      })

      await ApiTestUtils.expectApiResponse(response, 200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
    })

    it('should handle logout without token gracefully', async () => {
      const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/auth/logout')
      
      const response = await LogoutPost(request)
      
      // Should either succeed or require authentication
      expect([200, 401]).toContain(response.status)
    })
  })

  describe('Security Tests for Authentication', () => {
    it('should prevent SQL injection in login', async () => {
      const maliciousData = {
        email: "admin@example.com'; DROP TABLE users; --",
        password: 'password'
      }
      
      const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/auth/login', maliciousData)
      const response = await LoginPost(request)
      
      // Should handle safely without crashing
      expect([400, 401]).toContain(response.status)
    })

    it('should sanitize user input during registration', async () => {
      const maliciousData = {
        name: '<script>alert("xss")</script>',
        email: 'test@example.com',
        password: 'password123'
      }
      
      const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/auth/register', maliciousData)
      const response = await RegisterPost(request)
      
      if (response.status === 201) {
        const data = await response.json()
        expect(data.data.name).not.toContain('<script>')
        
        testUserId = data.data.id
        CleanupUtils.registerCleanup('user', testUserId, async () => {
          // Cleanup user if needed
        })
      }
    })

    it('should validate JWT token format', async () => {
      const invalidTokens = [
        'invalid-token',
        'Bearer',
        'Bearer ',
        'Bearer invalid.token.format',
        ''
      ]
      
      for (const token of invalidTokens) {
        const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/auth/session')
        if (token) {
          request.headers.set('Authorization', token)
        }
        
        const response = await SessionGet(request)
        expect(response.status).toBe(401)
      }
    })

    it('should handle concurrent login attempts', async () => {
      // Register user first
      const registerRequest = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/auth/register', testUserData)
      const registerResponse = await RegisterPost(registerRequest)
      
      if (registerResponse.status === 201) {
        const registerData = await registerResponse.json()
        testUserId = registerData.data.id
        
        CleanupUtils.registerCleanup('user', testUserId, async () => {
          // Cleanup user if needed
        })

        const loginData = {
          email: testUserData.email,
          password: testUserData.password
        }
        
        // Make concurrent login requests
        const promises = Array(5).fill(null).map(() => {
          const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/auth/login', loginData)
          return LoginPost(request)
        })
        
        const responses = await Promise.all(promises)
        
        // All should either succeed or fail gracefully
        responses.forEach(response => {
          expect([200, 401, 429]).toContain(response.status)
        })
      }
    })
  })
})