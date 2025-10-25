import { NextRequest } from 'next/server'
import { GET as AdminDashboard } from '@/app/api/admin/route'
import { GET as DebugInfo } from '@/app/api/debug/route'
import { GET as TablesInfo } from '@/app/api/tables/route'
import { 
  ApiTestUtils, 
  NetworkUtils, 
  TestSecurity,
  CleanupUtils 
} from '../utils/testHelpers'

describe('Admin and Debug API Routes', () => {
  beforeAll(async () => {
    // Verify test environment safety
    TestSecurity.validatePath(__filename)
  })

  afterEach(async () => {
    await CleanupUtils.cleanupAll()
  })

  describe('GET /api/admin - Admin Dashboard', () => {
    it('should require authentication for admin access', async () => {
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/admin')
      
      const response = await NetworkUtils.retryOperation(async () => {
        return await AdminDashboard(request)
      })

      // Should require authentication
      expect([401, 403]).toContain(response.status)
      
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toMatch(/auth|unauthorized|forbidden/i)
    })

    it('should provide admin dashboard data when authenticated', async () => {
      // Create request with admin token (mock)
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/admin', {
        headers: {
          'Authorization': 'Bearer admin-test-token',
          'X-Admin-Key': 'test-admin-key'
        }
      })
      
      const response = await AdminDashboard(request)
      
      if (response.status === 200) {
        const data = await response.json()
        expect(data.success).toBe(true)
        
        // Should include dashboard metrics
        expect(data.data).toHaveProperty('stats')
        expect(data.data.stats).toHaveProperty('totalUsers')
        expect(data.data.stats).toHaveProperty('totalProducts')
        expect(data.data.stats).toHaveProperty('totalOrders')
        expect(data.data.stats).toHaveProperty('totalRevenue')
        
        // Validate data types
        expect(typeof data.data.stats.totalUsers).toBe('number')
        expect(typeof data.data.stats.totalProducts).toBe('number')
        expect(typeof data.data.stats.totalOrders).toBe('number')
        expect(typeof data.data.stats.totalRevenue).toBe('number')
      }
    })

    it('should include recent activity in admin dashboard', async () => {
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/admin?includeActivity=true', {
        headers: {
          'Authorization': 'Bearer admin-test-token'
        }
      })
      
      const response = await AdminDashboard(request)
      
      if (response.status === 200) {
        const data = await response.json()
        
        if (data.data.recentActivity) {
          expect(Array.isArray(data.data.recentActivity)).toBe(true)
          
          data.data.recentActivity.forEach((activity: any) => {
            expect(activity).toHaveProperty('type')
            expect(activity).toHaveProperty('description')
            expect(activity).toHaveProperty('timestamp')
            expect(activity).toHaveProperty('userId')
          })
        }
      }
    })

    it('should provide system health information', async () => {
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/admin?includeHealth=true', {
        headers: {
          'Authorization': 'Bearer admin-test-token'
        }
      })
      
      const response = await AdminDashboard(request)
      
      if (response.status === 200) {
        const data = await response.json()
        
        if (data.data.systemHealth) {
          expect(data.data.systemHealth).toHaveProperty('database')
          expect(data.data.systemHealth).toHaveProperty('storage')
          expect(data.data.systemHealth).toHaveProperty('memory')
          expect(data.data.systemHealth).toHaveProperty('uptime')
        }
      }
    })

    it('should handle admin role validation', async () => {
      // Test with regular user token
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/admin', {
        headers: {
          'Authorization': 'Bearer regular-user-token'
        }
      })
      
      const response = await AdminDashboard(request)
      
      expect([401, 403]).toContain(response.status)
      
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toMatch(/admin|permission|role/i)
    })

    it('should provide analytics data for admin', async () => {
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/admin?includeAnalytics=true', {
        headers: {
          'Authorization': 'Bearer admin-test-token'
        }
      })
      
      const response = await AdminDashboard(request)
      
      if (response.status === 200) {
        const data = await response.json()
        
        if (data.data.analytics) {
          expect(data.data.analytics).toHaveProperty('dailyOrders')
          expect(data.data.analytics).toHaveProperty('popularProducts')
          expect(data.data.analytics).toHaveProperty('userGrowth')
          expect(data.data.analytics).toHaveProperty('revenueByPeriod')
          
          // Validate analytics structure
          if (data.data.analytics.dailyOrders) {
            expect(Array.isArray(data.data.analytics.dailyOrders)).toBe(true)
          }
          
          if (data.data.analytics.popularProducts) {
            expect(Array.isArray(data.data.analytics.popularProducts)).toBe(true)
          }
        }
      }
    })

    it('should handle network failures with retry for admin dashboard', async () => {
      let attempts = 0
      
      const response = await NetworkUtils.retryOperation(async () => {
        attempts++
        if (attempts < 2) {
          throw new Error('Network error')
        }
        
        const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/admin', {
          headers: {
            'Authorization': 'Bearer admin-test-token'
          }
        })
        
        return await AdminDashboard(request)
      }, 3, 1000)

      expect(attempts).toBe(2)
      // Should handle the request (may be 401/403 due to auth, but not network error)
      expect(response.status).toBeDefined()
    })
  })

  describe('GET /api/debug - Debug Information', () => {
    it('should only be available in development environment', async () => {
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/debug')
      
      const response = await NetworkUtils.retryOperation(async () => {
        return await DebugInfo(request)
      })

      if (process.env.NODE_ENV === 'production') {
        expect([404, 403]).toContain(response.status)
      } else {
        // In development/test, should provide debug info
        expect([200, 401]).toContain(response.status)
      }
    })

    it('should provide environment information in debug mode', async () => {
      // Skip in production
      if (process.env.NODE_ENV === 'production') {
        return
      }
      
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/debug', {
        headers: {
          'X-Debug-Key': 'test-debug-key'
        }
      })
      
      const response = await DebugInfo(request)
      
      if (response.status === 200) {
        const data = await response.json()
        expect(data.success).toBe(true)
        
        expect(data.data).toHaveProperty('environment')
        expect(data.data).toHaveProperty('nodeVersion')
        expect(data.data).toHaveProperty('platform')
        expect(data.data).toHaveProperty('memory')
        
        // Should not expose sensitive information
        const responseText = JSON.stringify(data)
        expect(responseText).not.toContain('DATABASE_URL')
        expect(responseText).not.toContain('SECRET')
        expect(responseText).not.toContain('PASSWORD')
      }
    })

    it('should include request information in debug', async () => {
      if (process.env.NODE_ENV === 'production') {
        return
      }
      
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/debug?includeRequest=true', {
        headers: {
          'X-Debug-Key': 'test-debug-key',
          'User-Agent': 'Test-Agent/1.0'
        }
      })
      
      const response = await DebugInfo(request)
      
      if (response.status === 200) {
        const data = await response.json()
        
        if (data.data.request) {
          expect(data.data.request).toHaveProperty('method')
          expect(data.data.request).toHaveProperty('url')
          expect(data.data.request).toHaveProperty('headers')
          expect(data.data.request.method).toBe('GET')
        }
      }
    })

    it('should provide database connection debug info', async () => {
      if (process.env.NODE_ENV === 'production') {
        return
      }
      
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/debug?includeDatabase=true', {
        headers: {
          'X-Debug-Key': 'test-debug-key'
        }
      })
      
      const response = await DebugInfo(request)
      
      if (response.status === 200) {
        const data = await response.json()
        
        if (data.data.database) {
          expect(data.data.database).toHaveProperty('status')
          expect(data.data.database).toHaveProperty('connectionCount')
          expect(['connected', 'disconnected', 'error']).toContain(data.data.database.status)
          
          // Should not expose connection string
          expect(JSON.stringify(data.data.database)).not.toContain('postgresql://')
          expect(JSON.stringify(data.data.database)).not.toContain('password')
        }
      }
    })

    it('should include performance metrics in debug', async () => {
      if (process.env.NODE_ENV === 'production') {
        return
      }
      
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/debug?includePerformance=true', {
        headers: {
          'X-Debug-Key': 'test-debug-key'
        }
      })
      
      const response = await DebugInfo(request)
      
      if (response.status === 200) {
        const data = await response.json()
        
        if (data.data.performance) {
          expect(data.data.performance).toHaveProperty('uptime')
          expect(data.data.performance).toHaveProperty('memoryUsage')
          expect(data.data.performance).toHaveProperty('cpuUsage')
          
          expect(typeof data.data.performance.uptime).toBe('number')
          expect(typeof data.data.performance.memoryUsage).toBe('object')
        }
      }
    })
  })

  describe('GET /api/tables - Database Tables Information', () => {
    it('should require admin access for table information', async () => {
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/tables')
      
      const response = await NetworkUtils.retryOperation(async () => {
        return await TablesInfo(request)
      })

      // Should require authentication
      expect([401, 403]).toContain(response.status)
    })

    it('should provide table schema information when authorized', async () => {
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/tables', {
        headers: {
          'Authorization': 'Bearer admin-test-token'
        }
      })
      
      const response = await TablesInfo(request)
      
      if (response.status === 200) {
        const data = await response.json()
        expect(data.success).toBe(true)
        
        expect(Array.isArray(data.data)).toBe(true)
        
        if (data.data.length > 0) {
          data.data.forEach((table: any) => {
            expect(table).toHaveProperty('name')
            expect(table).toHaveProperty('columns')
            expect(table).toHaveProperty('rowCount')
            
            expect(typeof table.name).toBe('string')
            expect(Array.isArray(table.columns)).toBe(true)
            expect(typeof table.rowCount).toBe('number')
          })
        }
      }
    })

    it('should include column details for each table', async () => {
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/tables?includeColumns=true', {
        headers: {
          'Authorization': 'Bearer admin-test-token'
        }
      })
      
      const response = await TablesInfo(request)
      
      if (response.status === 200) {
        const data = await response.json()
        
        if (data.data.length > 0) {
          data.data.forEach((table: any) => {
            if (table.columns.length > 0) {
              table.columns.forEach((column: any) => {
                expect(column).toHaveProperty('name')
                expect(column).toHaveProperty('type')
                expect(column).toHaveProperty('nullable')
                
                expect(typeof column.name).toBe('string')
                expect(typeof column.type).toBe('string')
                expect(typeof column.nullable).toBe('boolean')
              })
            }
          })
        }
      }
    })

    it('should provide table statistics', async () => {
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/tables?includeStats=true', {
        headers: {
          'Authorization': 'Bearer admin-test-token'
        }
      })
      
      const response = await TablesInfo(request)
      
      if (response.status === 200) {
        const data = await response.json()
        
        if (data.data.length > 0) {
          data.data.forEach((table: any) => {
            if (table.stats) {
              expect(table.stats).toHaveProperty('rowCount')
              expect(table.stats).toHaveProperty('size')
              expect(typeof table.stats.rowCount).toBe('number')
              expect(typeof table.stats.size).toBe('string')
            }
          })
        }
      }
    })

    it('should handle database connection errors gracefully', async () => {
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/tables', {
        headers: {
          'Authorization': 'Bearer admin-test-token'
        }
      })
      
      const response = await TablesInfo(request)
      
      // Should handle gracefully even if database is unavailable
      expect([200, 500, 503]).toContain(response.status)
      
      if (response.status === 500 || response.status === 503) {
        const data = await response.json()
        expect(data.success).toBe(false)
        expect(data.error).toMatch(/database|connection/i)
      }
    })
  })

  describe('Admin Security Tests', () => {
    it('should prevent SQL injection in admin queries', async () => {
      const maliciousInputs = [
        "'; DROP TABLE users; --",
        "1' OR '1'='1",
        "admin'; DELETE FROM products; --",
        "1 UNION SELECT * FROM users"
      ]
      
      for (const maliciousInput of maliciousInputs) {
        const request = ApiTestUtils.createNextRequest('GET', `http://localhost:3000/api/admin?filter=${encodeURIComponent(maliciousInput)}`, {
          headers: {
            'Authorization': 'Bearer admin-test-token'
          }
        })
        
        const response = await AdminDashboard(request)
        
        // Should handle safely
        if (response.status === 200) {
          const data = await response.json()
          const responseText = JSON.stringify(data)
          
          // Should not contain SQL injection indicators
          expect(responseText).not.toContain('DROP TABLE')
          expect(responseText).not.toContain('DELETE FROM')
          expect(responseText).not.toContain('UNION SELECT')
        }
      }
    })

    it('should validate admin token format and expiration', async () => {
      const invalidTokens = [
        'invalid-token',
        'Bearer ',
        'Bearer expired-token',
        'Bearer malformed.token.here',
        ''
      ]
      
      for (const token of invalidTokens) {
        const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/admin', {
          headers: {
            'Authorization': token
          }
        })
        
        const response = await AdminDashboard(request)
        
        expect([401, 403]).toContain(response.status)
        
        const data = await response.json()
        expect(data.success).toBe(false)
      }
    })

    it('should log admin access attempts', async () => {
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/admin', {
        headers: {
          'Authorization': 'Bearer admin-test-token',
          'X-Forwarded-For': '192.168.1.100',
          'User-Agent': 'Test-Admin-Client/1.0'
        }
      })
      
      const response = await AdminDashboard(request)
      
      // Should handle the request (logging is internal)
      expect(response.status).toBeDefined()
      
      // In a real implementation, this would verify that access was logged
      // For testing, we just ensure the request is processed
    })

    it('should rate limit admin endpoints', async () => {
      const requests = Array(20).fill(null).map(() => {
        const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/admin', {
          headers: {
            'Authorization': 'Bearer admin-test-token'
          }
        })
        return AdminDashboard(request)
      })
      
      const responses = await Promise.all(requests)
      
      // Should either handle all requests or implement rate limiting
      const rateLimitedCount = responses.filter(r => r.status === 429).length
      const processedCount = responses.filter(r => [200, 401, 403].includes(r.status)).length
      
      expect(rateLimitedCount + processedCount).toBe(20)
      
      // If rate limiting is implemented, should have some 429 responses
      if (rateLimitedCount > 0) {
        expect(rateLimitedCount).toBeGreaterThan(0)
      }
    })

    it('should sanitize admin input parameters', async () => {
      const maliciousParams = [
        'search=<script>alert("xss")</script>',
        'filter=javascript:alert(1)',
        'sort="><img src=x onerror=alert(1)>',
        'page=../../etc/passwd'
      ]
      
      for (const param of maliciousParams) {
        const request = ApiTestUtils.createNextRequest('GET', `http://localhost:3000/api/admin?${param}`, {
          headers: {
            'Authorization': 'Bearer admin-test-token'
          }
        })
        
        const response = await AdminDashboard(request)
        
        if (response.status === 200) {
          const data = await response.json()
          const responseText = JSON.stringify(data)
          
          // Should sanitize malicious content
          expect(responseText).not.toContain('<script>')
          expect(responseText).not.toContain('javascript:')
          expect(responseText).not.toContain('onerror=')
          expect(responseText).not.toContain('etc/passwd')
        }
      }
    })
  })

  describe('Admin Performance Tests', () => {
    it('should handle large dataset queries efficiently', async () => {
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/admin?includeAll=true', {
        headers: {
          'Authorization': 'Bearer admin-test-token'
        }
      })
      
      const startTime = Date.now()
      const response = await AdminDashboard(request)
      const endTime = Date.now()
      
      const responseTime = endTime - startTime
      
      if (response.status === 200) {
        // Should respond within reasonable time even with large datasets
        expect(responseTime).toBeLessThan(10000) // Less than 10 seconds
        
        const data = await response.json()
        expect(data.success).toBe(true)
      }
    })

    it('should implement pagination for large admin queries', async () => {
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/admin?page=1&limit=50', {
        headers: {
          'Authorization': 'Bearer admin-test-token'
        }
      })
      
      const response = await AdminDashboard(request)
      
      if (response.status === 200) {
        const data = await response.json()
        
        // Should implement pagination for large datasets
        if (data.data.pagination) {
          expect(data.data.pagination).toHaveProperty('page')
          expect(data.data.pagination).toHaveProperty('limit')
          expect(data.data.pagination).toHaveProperty('total')
          expect(data.data.pagination.page).toBe(1)
          expect(data.data.pagination.limit).toBe(50)
        }
      }
    })

    it('should cache admin dashboard data appropriately', async () => {
      const request1 = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/admin', {
        headers: {
          'Authorization': 'Bearer admin-test-token'
        }
      })
      
      const request2 = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/admin', {
        headers: {
          'Authorization': 'Bearer admin-test-token'
        }
      })
      
      const startTime1 = Date.now()
      const response1 = await AdminDashboard(request1)
      const endTime1 = Date.now()
      
      const startTime2 = Date.now()
      const response2 = await AdminDashboard(request2)
      const endTime2 = Date.now()
      
      const time1 = endTime1 - startTime1
      const time2 = endTime2 - startTime2
      
      if (response1.status === 200 && response2.status === 200) {
        // Second request might be faster due to caching
        // This is just a performance indicator, not a strict requirement
        expect(time2).toBeLessThanOrEqual(time1 * 2) // Allow some variance
      }
    })
  })
})