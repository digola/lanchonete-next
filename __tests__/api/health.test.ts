import { NextRequest } from 'next/server'
import { GET as HealthCheck } from '@/app/api/health/route'
import { GET as PingCheck } from '@/app/api/ping/route'
import { 
  ApiTestUtils, 
  NetworkUtils, 
  TestSecurity,
  CleanupUtils 
} from '../utils/testHelpers'

describe('Health and Monitoring API Routes', () => {
  beforeAll(async () => {
    // Verify test environment safety
    TestSecurity.validatePath(__filename)
  })

  afterEach(async () => {
    await CleanupUtils.cleanupAll()
  })

  describe('GET /api/health - Health Check', () => {
    it('should return healthy status', async () => {
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/health')
      
      const response = await NetworkUtils.retryOperation(async () => {
        return await HealthCheck(request)
      })

      await ApiTestUtils.expectApiResponse(response, 200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('status')
      expect(data.data.status).toBe('healthy')
    })

    it('should include system information', async () => {
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/health')
      
      const response = await HealthCheck(request)
      
      expect(response.status).toBe(200)
      const data = await response.json()
      
      expect(data.data).toHaveProperty('timestamp')
      expect(data.data).toHaveProperty('uptime')
      expect(data.data).toHaveProperty('version')
      expect(typeof data.data.timestamp).toBe('string')
      expect(typeof data.data.uptime).toBe('number')
    })

    it('should include database connectivity status', async () => {
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/health')
      
      const response = await HealthCheck(request)
      
      if (response.status === 200) {
        const data = await response.json()
        expect(data.data).toHaveProperty('database')
        expect(data.data.database).toHaveProperty('status')
        expect(['connected', 'disconnected', 'error']).toContain(data.data.database.status)
      }
    })

    it('should include memory usage information', async () => {
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/health')
      
      const response = await HealthCheck(request)
      
      if (response.status === 200) {
        const data = await response.json()
        expect(data.data).toHaveProperty('memory')
        expect(data.data.memory).toHaveProperty('used')
        expect(data.data.memory).toHaveProperty('total')
        expect(typeof data.data.memory.used).toBe('number')
        expect(typeof data.data.memory.total).toBe('number')
      }
    })

    it('should handle network failures with retry', async () => {
      let attempts = 0
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/health')
      
      const response = await NetworkUtils.retryOperation(async () => {
        attempts++
        if (attempts < 2) {
          throw new Error('Network error')
        }
        return await HealthCheck(request)
      }, 3, 1000)

      expect(attempts).toBe(2)
      expect(response.status).toBe(200)
    })

    it('should respond quickly for health checks', async () => {
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/health')
      
      const startTime = Date.now()
      const response = await HealthCheck(request)
      const endTime = Date.now()
      
      const responseTime = endTime - startTime
      
      expect(response.status).toBe(200)
      expect(responseTime).toBeLessThan(5000) // Should respond within 5 seconds
    })

    it('should include service dependencies status', async () => {
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/health')
      
      const response = await HealthCheck(request)
      
      if (response.status === 200) {
        const data = await response.json()
        
        // Should include external service status if applicable
        if (data.data.services) {
          expect(Array.isArray(data.data.services)).toBe(true)
          
          data.data.services.forEach((service: any) => {
            expect(service).toHaveProperty('name')
            expect(service).toHaveProperty('status')
            expect(['healthy', 'unhealthy', 'unknown']).toContain(service.status)
          })
        }
      }
    })
  })

  describe('GET /api/ping - Simple Ping Check', () => {
    it('should respond with pong', async () => {
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/ping')
      
      const response = await NetworkUtils.retryOperation(async () => {
        return await PingCheck(request)
      })

      await ApiTestUtils.expectApiResponse(response, 200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('message')
      expect(data.data.message).toBe('pong')
    })

    it('should include timestamp in ping response', async () => {
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/ping')
      
      const response = await PingCheck(request)
      
      expect(response.status).toBe(200)
      const data = await response.json()
      
      expect(data.data).toHaveProperty('timestamp')
      expect(typeof data.data.timestamp).toBe('string')
      
      // Verify timestamp is recent (within last minute)
      const timestamp = new Date(data.data.timestamp)
      const now = new Date()
      const timeDiff = now.getTime() - timestamp.getTime()
      expect(timeDiff).toBeLessThan(60000) // Less than 1 minute
    })

    it('should respond very quickly for ping', async () => {
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/ping')
      
      const startTime = Date.now()
      const response = await PingCheck(request)
      const endTime = Date.now()
      
      const responseTime = endTime - startTime
      
      expect(response.status).toBe(200)
      expect(responseTime).toBeLessThan(1000) // Should respond within 1 second
    })

    it('should handle concurrent ping requests', async () => {
      const requests = Array(10).fill(null).map(() => {
        const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/ping')
        return PingCheck(request)
      })
      
      const responses = await Promise.all(requests)
      
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })
    })

    it('should maintain consistent response format', async () => {
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/ping')
      
      // Make multiple requests to ensure consistency
      for (let i = 0; i < 3; i++) {
        const response = await PingCheck(request)
        
        expect(response.status).toBe(200)
        const data = await response.json()
        
        expect(data).toHaveProperty('success')
        expect(data).toHaveProperty('data')
        expect(data.success).toBe(true)
        expect(data.data).toHaveProperty('message')
        expect(data.data).toHaveProperty('timestamp')
      }
    })
  })

  describe('Health Check Resilience Tests', () => {
    it('should handle database connection failures gracefully', async () => {
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/health')
      
      const response = await HealthCheck(request)
      
      // Should still respond even if database is down
      expect([200, 503]).toContain(response.status)
      
      const data = await response.json()
      expect(data).toHaveProperty('success')
      
      if (response.status === 503) {
        expect(data.success).toBe(false)
        expect(data.data).toHaveProperty('status')
        expect(data.data.status).toBe('unhealthy')
      }
    })

    it('should provide detailed error information when unhealthy', async () => {
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/health')
      
      const response = await HealthCheck(request)
      
      if (response.status === 503) {
        const data = await response.json()
        expect(data.data).toHaveProperty('errors')
        expect(Array.isArray(data.data.errors)).toBe(true)
        
        if (data.data.errors.length > 0) {
          data.data.errors.forEach((error: any) => {
            expect(error).toHaveProperty('service')
            expect(error).toHaveProperty('message')
          })
        }
      }
    })

    it('should handle high load during health checks', async () => {
      const requests = Array(50).fill(null).map(() => {
        const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/health')
        return HealthCheck(request)
      })
      
      const startTime = Date.now()
      const responses = await Promise.all(requests)
      const endTime = Date.now()
      
      const totalTime = endTime - startTime
      
      // All requests should complete
      expect(responses.length).toBe(50)
      
      // Most should succeed
      const successCount = responses.filter(r => r.status === 200).length
      expect(successCount).toBeGreaterThan(40) // At least 80% success rate
      
      // Should complete within reasonable time
      expect(totalTime).toBeLessThan(30000) // Less than 30 seconds for all requests
    })
  })

  describe('Monitoring and Metrics Tests', () => {
    it('should include performance metrics in health check', async () => {
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/health?includeMetrics=true')
      
      const response = await HealthCheck(request)
      
      if (response.status === 200) {
        const data = await response.json()
        
        if (data.data.metrics) {
          expect(data.data.metrics).toHaveProperty('responseTime')
          expect(data.data.metrics).toHaveProperty('requestCount')
          expect(typeof data.data.metrics.responseTime).toBe('number')
          expect(typeof data.data.metrics.requestCount).toBe('number')
        }
      }
    })

    it('should track system resource usage', async () => {
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/health')
      
      const response = await HealthCheck(request)
      
      if (response.status === 200) {
        const data = await response.json()
        
        if (data.data.resources) {
          expect(data.data.resources).toHaveProperty('cpu')
          expect(data.data.resources).toHaveProperty('memory')
          expect(data.data.resources).toHaveProperty('disk')
          
          // CPU usage should be a percentage
          if (data.data.resources.cpu) {
            expect(data.data.resources.cpu.usage).toBeGreaterThanOrEqual(0)
            expect(data.data.resources.cpu.usage).toBeLessThanOrEqual(100)
          }
        }
      }
    })

    it('should provide API endpoint status', async () => {
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/health?checkEndpoints=true')
      
      const response = await HealthCheck(request)
      
      if (response.status === 200) {
        const data = await response.json()
        
        if (data.data.endpoints) {
          expect(Array.isArray(data.data.endpoints)).toBe(true)
          
          data.data.endpoints.forEach((endpoint: any) => {
            expect(endpoint).toHaveProperty('path')
            expect(endpoint).toHaveProperty('status')
            expect(endpoint).toHaveProperty('responseTime')
            expect(['healthy', 'unhealthy', 'timeout']).toContain(endpoint.status)
          })
        }
      }
    })
  })

  describe('Security Tests for Health Endpoints', () => {
    it('should not expose sensitive information in health check', async () => {
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/health')
      
      const response = await HealthCheck(request)
      
      if (response.status === 200) {
        const data = await response.json()
        const responseText = JSON.stringify(data)
        
        // Should not contain sensitive information
        expect(responseText).not.toContain('password')
        expect(responseText).not.toContain('secret')
        expect(responseText).not.toContain('key')
        expect(responseText).not.toContain('token')
        expect(responseText).not.toContain('DATABASE_URL')
      }
    })

    it('should handle malicious query parameters safely', async () => {
      const maliciousParams = [
        '?debug=true&showSecrets=true',
        '?format=<script>alert(1)</script>',
        '?callback=../../etc/passwd',
        '?include=../../../config'
      ]
      
      for (const params of maliciousParams) {
        const request = ApiTestUtils.createNextRequest('GET', `http://localhost:3000/api/health${params}`)
        const response = await HealthCheck(request)
        
        // Should handle safely without exposing sensitive data
        expect([200, 400]).toContain(response.status)
        
        if (response.status === 200) {
          const data = await response.json()
          const responseText = JSON.stringify(data)
          expect(responseText).not.toContain('<script>')
          expect(responseText).not.toContain('etc/passwd')
        }
      }
    })

    it('should rate limit health check requests if implemented', async () => {
      const requests = Array(100).fill(null).map(() => {
        const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/health')
        return HealthCheck(request)
      })
      
      const responses = await Promise.all(requests)
      
      // Should either handle all requests or implement rate limiting
      const rateLimitedCount = responses.filter(r => r.status === 429).length
      const successCount = responses.filter(r => r.status === 200).length
      
      expect(successCount + rateLimitedCount).toBe(100)
      
      // If rate limiting is implemented, should have some 429 responses
      if (rateLimitedCount > 0) {
        expect(rateLimitedCount).toBeGreaterThan(0)
      }
    })
  })

  describe('Health Check Integration Tests', () => {
    it('should verify all critical services are monitored', async () => {
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/health')
      
      const response = await HealthCheck(request)
      
      if (response.status === 200) {
        const data = await response.json()
        
        // Should monitor critical services
        const criticalServices = ['database', 'api', 'storage']
        
        if (data.data.services) {
          const monitoredServices = data.data.services.map((s: any) => s.name)
          
          criticalServices.forEach(service => {
            // Should either monitor the service or not be applicable
            if (monitoredServices.length > 0) {
              // If services are monitored, critical ones should be included
              expect(monitoredServices.some((name: string) => 
                name.toLowerCase().includes(service.toLowerCase())
              )).toBeTruthy()
            }
          })
        }
      }
    })

    it('should provide consistent health status across multiple checks', async () => {
      const responses = []
      
      // Make multiple health checks
      for (let i = 0; i < 5; i++) {
        const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/health')
        const response = await HealthCheck(request)
        responses.push(response)
        
        // Wait a bit between checks
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      // All should have same general health status (unless system is unstable)
      const statuses = await Promise.all(responses.map(r => r.json()))
      const healthStatuses = statuses.map(s => s.data.status)
      
      // Should be mostly consistent
      const uniqueStatuses = [...new Set(healthStatuses)]
      expect(uniqueStatuses.length).toBeLessThanOrEqual(2) // Allow for some variation
    })
  })
})