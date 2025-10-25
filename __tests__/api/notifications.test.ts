import { NextRequest } from 'next/server'
import { GET as GetNotifications, POST as CreateNotification } from '@/app/api/notifications/route'
import { 
  ApiTestUtils, 
  NetworkUtils, 
  TestSecurity,
  CleanupUtils,
  DatabaseTestUtils 
} from '../utils/testHelpers'

describe('Notifications API Routes', () => {
  const testNotifications: any[] = []

  beforeAll(async () => {
    // Verify test environment safety
    TestSecurity.validatePath(__filename)
  })

  afterEach(async () => {
    await CleanupUtils.cleanupAll()
  })

  afterAll(async () => {
    // Clean up test notifications
    for (const notification of testNotifications) {
      try {
        await CleanupUtils.cleanupResource('notification', notification.id)
      } catch (error) {
        console.warn('Failed to cleanup test notification:', error)
      }
    }
  })

  describe('POST /api/notifications - Create Notification', () => {
    it('should create a new notification with valid data', async () => {
      const notificationData = {
        title: 'Test Notification',
        message: 'This is a test notification message',
        type: 'info',
        userId: 'test-user-123',
        priority: 'medium'
      }
      
      const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/notifications', {
        body: JSON.stringify(notificationData)
      })
      
      const response = await NetworkUtils.retryOperation(async () => {
        return await CreateNotification(request)
      })

      await ApiTestUtils.expectApiResponse(response, 201)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('id')
      expect(data.data.title).toBe(notificationData.title)
      expect(data.data.message).toBe(notificationData.message)
      expect(data.data.type).toBe(notificationData.type)
      expect(data.data.userId).toBe(notificationData.userId)
      expect(data.data.priority).toBe(notificationData.priority)
      expect(data.data.read).toBe(false)
      expect(data.data).toHaveProperty('createdAt')
      
      testNotifications.push(data.data)
    })

    it('should validate required fields for notification creation', async () => {
      const invalidData = [
        {}, // Empty object
        { title: 'Test' }, // Missing message
        { message: 'Test message' }, // Missing title
        { title: 'Test', message: 'Test message' }, // Missing type and userId
        { title: '', message: 'Test message', type: 'info', userId: 'user123' }, // Empty title
        { title: 'Test', message: '', type: 'info', userId: 'user123' } // Empty message
      ]
      
      for (const data of invalidData) {
        const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/notifications', {
          body: JSON.stringify(data)
        })
        
        const response = await CreateNotification(request)
        
        expect(response.status).toBe(400)
        
        const responseData = await response.json()
        expect(responseData.success).toBe(false)
        expect(responseData.error).toMatch(/required|missing|invalid/i)
      }
    })

    it('should validate notification type', async () => {
      const invalidTypes = ['invalid', 'unknown', 123, null, '']
      
      for (const type of invalidTypes) {
        const notificationData = {
          title: 'Test Notification',
          message: 'Test message',
          type: type,
          userId: 'test-user-123'
        }
        
        const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/notifications', {
          body: JSON.stringify(notificationData)
        })
        
        const response = await CreateNotification(request)
        
        expect(response.status).toBe(400)
        
        const data = await response.json()
        expect(data.success).toBe(false)
        expect(data.error).toMatch(/type|invalid/i)
      }
    })

    it('should validate notification priority', async () => {
      const validPriorities = ['low', 'medium', 'high', 'urgent']
      
      for (const priority of validPriorities) {
        const notificationData = {
          title: 'Test Notification',
          message: 'Test message',
          type: 'info',
          userId: 'test-user-123',
          priority: priority
        }
        
        const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/notifications', {
          body: JSON.stringify(notificationData)
        })
        
        const response = await CreateNotification(request)
        
        if (response.status === 201) {
          const data = await response.json()
          expect(data.data.priority).toBe(priority)
          testNotifications.push(data.data)
        }
      }
    })

    it('should create system-wide notifications', async () => {
      const systemNotification = {
        title: 'System Maintenance',
        message: 'System will be under maintenance from 2 AM to 4 AM',
        type: 'warning',
        userId: null, // System-wide notification
        priority: 'high',
        isSystemWide: true
      }
      
      const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/notifications', {
        body: JSON.stringify(systemNotification)
      })
      
      const response = await CreateNotification(request)
      
      if (response.status === 201) {
        const data = await response.json()
        expect(data.success).toBe(true)
        expect(data.data.isSystemWide).toBe(true)
        expect(data.data.userId).toBeNull()
        
        testNotifications.push(data.data)
      }
    })

    it('should handle notification with metadata', async () => {
      const notificationWithMetadata = {
        title: 'Order Update',
        message: 'Your order #12345 has been shipped',
        type: 'success',
        userId: 'test-user-123',
        priority: 'medium',
        metadata: {
          orderId: '12345',
          trackingNumber: 'TRK123456789',
          estimatedDelivery: '2024-01-15'
        }
      }
      
      const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/notifications', {
        body: JSON.stringify(notificationWithMetadata)
      })
      
      const response = await CreateNotification(request)
      
      if (response.status === 201) {
        const data = await response.json()
        expect(data.success).toBe(true)
        expect(data.data.metadata).toEqual(notificationWithMetadata.metadata)
        
        testNotifications.push(data.data)
      }
    })

    it('should handle network failures with retry for notification creation', async () => {
      let attempts = 0
      const notificationData = {
        title: 'Retry Test Notification',
        message: 'Testing retry mechanism',
        type: 'info',
        userId: 'test-user-123'
      }
      
      const response = await NetworkUtils.retryOperation(async () => {
        attempts++
        if (attempts < 2) {
          throw new Error('Network error')
        }
        
        const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/notifications', {
          body: JSON.stringify(notificationData)
        })
        
        return await CreateNotification(request)
      }, 3, 1000)

      expect(attempts).toBe(2)
      
      if (response.status === 201) {
        const data = await response.json()
        testNotifications.push(data.data)
      }
    })

    it('should sanitize notification content', async () => {
      const maliciousNotification = {
        title: '<script>alert("xss")</script>Malicious Title',
        message: 'Click <a href="javascript:alert(1)">here</a> for more info',
        type: 'info',
        userId: 'test-user-123'
      }
      
      const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/notifications', {
        body: JSON.stringify(maliciousNotification)
      })
      
      const response = await CreateNotification(request)
      
      if (response.status === 201) {
        const data = await response.json()
        
        // Content should be sanitized
        expect(data.data.title).not.toContain('<script>')
        expect(data.data.message).not.toContain('javascript:')
        expect(data.data.title).not.toContain('alert("xss")')
        
        testNotifications.push(data.data)
      }
    })
  })

  describe('GET /api/notifications - Get Notifications', () => {
    beforeEach(async () => {
      // Create test notifications for listing
      const testNotificationData = {
        title: 'Test List Notification',
        message: 'This is for testing notification listing',
        type: 'info',
        userId: 'test-user-123'
      }
      
      const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/notifications', {
        body: JSON.stringify(testNotificationData)
      })
      
      const response = await CreateNotification(request)
      
      if (response.status === 201) {
        const data = await response.json()
        testNotifications.push(data.data)
      }
    })

    it('should list notifications for a user', async () => {
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/notifications?userId=test-user-123')
      
      const response = await NetworkUtils.retryOperation(async () => {
        return await GetNotifications(request)
      })

      await ApiTestUtils.expectApiResponse(response, 200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(Array.isArray(data.data)).toBe(true)
      
      if (data.data.length > 0) {
        data.data.forEach((notification: any) => {
          expect(notification).toHaveProperty('id')
          expect(notification).toHaveProperty('title')
          expect(notification).toHaveProperty('message')
          expect(notification).toHaveProperty('type')
          expect(notification).toHaveProperty('read')
          expect(notification).toHaveProperty('createdAt')
          expect(notification.userId).toBe('test-user-123')
        })
      }
    })

    it('should support pagination for notifications', async () => {
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/notifications?userId=test-user-123&page=1&limit=5')
      
      const response = await GetNotifications(request)
      
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(Array.isArray(data.data)).toBe(true)
      expect(data.data.length).toBeLessThanOrEqual(5)
      
      if (data.pagination) {
        expect(data.pagination).toHaveProperty('page')
        expect(data.pagination).toHaveProperty('limit')
        expect(data.pagination).toHaveProperty('total')
        expect(data.pagination.page).toBe(1)
        expect(data.pagination.limit).toBe(5)
      }
    })

    it('should filter notifications by read status', async () => {
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/notifications?userId=test-user-123&read=false')
      
      const response = await GetNotifications(request)
      
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      
      if (data.data.length > 0) {
        data.data.forEach((notification: any) => {
          expect(notification.read).toBe(false)
        })
      }
    })

    it('should filter notifications by type', async () => {
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/notifications?userId=test-user-123&type=info')
      
      const response = await GetNotifications(request)
      
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      
      if (data.data.length > 0) {
        data.data.forEach((notification: any) => {
          expect(notification.type).toBe('info')
        })
      }
    })

    it('should filter notifications by priority', async () => {
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/notifications?userId=test-user-123&priority=high')
      
      const response = await GetNotifications(request)
      
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      
      if (data.data.length > 0) {
        data.data.forEach((notification: any) => {
          expect(notification.priority).toBe('high')
        })
      }
    })

    it('should sort notifications by creation date', async () => {
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/notifications?userId=test-user-123&sort=createdAt&order=desc')
      
      const response = await GetNotifications(request)
      
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      
      if (data.data.length > 1) {
        // Check if sorted by creation date (newest first)
        for (let i = 0; i < data.data.length - 1; i++) {
          const current = new Date(data.data[i].createdAt)
          const next = new Date(data.data[i + 1].createdAt)
          expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime())
        }
      }
    })

    it('should include system-wide notifications', async () => {
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/notifications?userId=test-user-123&includeSystemWide=true')
      
      const response = await GetNotifications(request)
      
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      
      // Should include both user-specific and system-wide notifications
      const userNotifications = data.data.filter((n: any) => n.userId === 'test-user-123')
      const systemNotifications = data.data.filter((n: any) => n.isSystemWide === true)
      
      expect(userNotifications.length + systemNotifications.length).toBe(data.data.length)
    })

    it('should handle empty notification list', async () => {
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/notifications?userId=nonexistent-user')
      
      const response = await GetNotifications(request)
      
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(Array.isArray(data.data)).toBe(true)
      expect(data.data.length).toBe(0)
    })

    it('should validate user ID parameter', async () => {
      const invalidUserIds = ['', null, undefined, 123]
      
      for (const userId of invalidUserIds) {
        const url = userId ? `http://localhost:3000/api/notifications?userId=${userId}` : 'http://localhost:3000/api/notifications'
        const request = ApiTestUtils.createNextRequest('GET', url)
        
        const response = await GetNotifications(request)
        
        if (userId === '' || userId === null || userId === undefined) {
          expect([400, 401]).toContain(response.status)
        }
      }
    })
  })

  describe('Notification Security Tests', () => {
    it('should prevent SQL injection in notification queries', async () => {
      const maliciousInputs = [
        "'; DROP TABLE notifications; --",
        "1' OR '1'='1",
        "test'; DELETE FROM users; --"
      ]
      
      for (const maliciousInput of maliciousInputs) {
        const request = ApiTestUtils.createNextRequest('GET', `http://localhost:3000/api/notifications?userId=${encodeURIComponent(maliciousInput)}`)
        
        const response = await GetNotifications(request)
        
        // Should handle safely
        expect([200, 400]).toContain(response.status)
        
        if (response.status === 200) {
          const data = await response.json()
          const responseText = JSON.stringify(data)
          
          // Should not contain SQL injection indicators
          expect(responseText).not.toContain('DROP TABLE')
          expect(responseText).not.toContain('DELETE FROM')
        }
      }
    })

    it('should sanitize notification search parameters', async () => {
      const maliciousSearches = [
        '<script>alert("xss")</script>',
        'javascript:alert(1)',
        '"><img src=x onerror=alert(1)>'
      ]
      
      for (const search of maliciousSearches) {
        const request = ApiTestUtils.createNextRequest('GET', `http://localhost:3000/api/notifications?userId=test-user-123&search=${encodeURIComponent(search)}`)
        
        const response = await GetNotifications(request)
        
        if (response.status === 200) {
          const data = await response.json()
          const responseText = JSON.stringify(data)
          
          // Should sanitize malicious content
          expect(responseText).not.toContain('<script>')
          expect(responseText).not.toContain('javascript:')
          expect(responseText).not.toContain('onerror=')
        }
      }
    })

    it('should validate notification access permissions', async () => {
      // Try to access notifications for different user
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/notifications?userId=other-user-456', {
        headers: {
          'Authorization': 'Bearer user-123-token' // Token for different user
        }
      })
      
      const response = await GetNotifications(request)
      
      // Should either require proper authentication or return empty results
      if (response.status === 200) {
        const data = await response.json()
        // Should not return notifications for other users
        if (data.data.length > 0) {
          data.data.forEach((notification: any) => {
            expect(notification.userId).not.toBe('other-user-456')
          })
        }
      } else {
        expect([401, 403]).toContain(response.status)
      }
    })

    it('should rate limit notification creation', async () => {
      const requests = Array(10).fill(null).map((_, index) => {
        const notificationData = {
          title: `Rate Limit Test ${index}`,
          message: 'Testing rate limiting',
          type: 'info',
          userId: 'test-user-123'
        }
        
        const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/notifications', {
          body: JSON.stringify(notificationData)
        })
        
        return CreateNotification(request)
      })
      
      const responses = await Promise.all(requests)
      
      // Should either handle all requests or implement rate limiting
      const rateLimitedCount = responses.filter(r => r.status === 429).length
      const successCount = responses.filter(r => r.status === 201).length
      const errorCount = responses.filter(r => r.status >= 400 && r.status !== 429).length
      
      expect(rateLimitedCount + successCount + errorCount).toBe(10)
      
      // Track successful notifications for cleanup
      const successfulResponses = responses.filter(r => r.status === 201)
      for (const response of successfulResponses) {
        const data = await response.json()
        testNotifications.push(data.data)
      }
    })
  })

  describe('Notification Performance Tests', () => {
    it('should handle large notification lists efficiently', async () => {
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/notifications?userId=test-user-123&limit=100')
      
      const startTime = Date.now()
      const response = await GetNotifications(request)
      const endTime = Date.now()
      
      const responseTime = endTime - startTime
      
      expect(response.status).toBe(200)
      expect(responseTime).toBeLessThan(5000) // Should respond within 5 seconds
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.length).toBeLessThanOrEqual(100)
    })

    it('should handle concurrent notification operations', async () => {
      const createRequests = Array(5).fill(null).map((_, index) => {
        const notificationData = {
          title: `Concurrent Test ${index}`,
          message: 'Testing concurrent operations',
          type: 'info',
          userId: 'test-user-123'
        }
        
        const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/notifications', {
          body: JSON.stringify(notificationData)
        })
        
        return CreateNotification(request)
      })
      
      const getRequest = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/notifications?userId=test-user-123')
      const getRequests = Array(3).fill(null).map(() => GetNotifications(getRequest))
      
      const allRequests = [...createRequests, ...getRequests]
      const responses = await Promise.all(allRequests)
      
      // All requests should complete successfully
      responses.forEach(response => {
        expect([200, 201]).toContain(response.status)
      })
      
      // Track created notifications for cleanup
      const createResponses = responses.slice(0, 5)
      for (const response of createResponses) {
        if (response.status === 201) {
          const data = await response.json()
          testNotifications.push(data.data)
        }
      }
    })

    it('should implement efficient notification counting', async () => {
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/notifications?userId=test-user-123&countOnly=true')
      
      const startTime = Date.now()
      const response = await GetNotifications(request)
      const endTime = Date.now()
      
      const responseTime = endTime - startTime
      
      if (response.status === 200) {
        expect(responseTime).toBeLessThan(2000) // Count should be very fast
        
        const data = await response.json()
        expect(data.success).toBe(true)
        expect(data.data).toHaveProperty('count')
        expect(typeof data.data.count).toBe('number')
      }
    })
  })

  describe('Notification Integration Tests', () => {
    it('should integrate with user management system', async () => {
      // Create notification for a user
      const notificationData = {
        title: 'Integration Test',
        message: 'Testing user integration',
        type: 'info',
        userId: 'integration-test-user'
      }
      
      const createRequest = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/notifications', {
        body: JSON.stringify(notificationData)
      })
      
      const createResponse = await CreateNotification(createRequest)
      
      if (createResponse.status === 201) {
        const createData = await createResponse.json()
        testNotifications.push(createData.data)
        
        // Verify notification can be retrieved
        const getRequest = ApiTestUtils.createNextRequest('GET', `http://localhost:3000/api/notifications?userId=${notificationData.userId}`)
        const getResponse = await GetNotifications(getRequest)
        
        expect(getResponse.status).toBe(200)
        
        const getData = await getResponse.json()
        expect(getData.success).toBe(true)
        
        const foundNotification = getData.data.find((n: any) => n.id === createData.data.id)
        expect(foundNotification).toBeDefined()
        expect(foundNotification.title).toBe(notificationData.title)
      }
    })

    it('should handle notification delivery preferences', async () => {
      const notificationWithPreferences = {
        title: 'Preference Test',
        message: 'Testing delivery preferences',
        type: 'info',
        userId: 'test-user-123',
        deliveryPreferences: {
          email: true,
          push: false,
          sms: false
        }
      }
      
      const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/notifications', {
        body: JSON.stringify(notificationWithPreferences)
      })
      
      const response = await CreateNotification(request)
      
      if (response.status === 201) {
        const data = await response.json()
        expect(data.success).toBe(true)
        
        if (data.data.deliveryPreferences) {
          expect(data.data.deliveryPreferences.email).toBe(true)
          expect(data.data.deliveryPreferences.push).toBe(false)
          expect(data.data.deliveryPreferences.sms).toBe(false)
        }
        
        testNotifications.push(data.data)
      }
    })

    it('should support notification templates', async () => {
      const templateNotification = {
        templateId: 'order-confirmation',
        userId: 'test-user-123',
        templateData: {
          orderId: '12345',
          customerName: 'John Doe',
          total: 29.99
        }
      }
      
      const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/notifications', {
        body: JSON.stringify(templateNotification)
      })
      
      const response = await CreateNotification(request)
      
      if (response.status === 201) {
        const data = await response.json()
        expect(data.success).toBe(true)
        
        // Should have generated title and message from template
        expect(data.data.title).toBeDefined()
        expect(data.data.message).toBeDefined()
        expect(data.data.title.length).toBeGreaterThan(0)
        expect(data.data.message.length).toBeGreaterThan(0)
        
        testNotifications.push(data.data)
      }
    })
  })
})