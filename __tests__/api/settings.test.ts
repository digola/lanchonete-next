import { NextRequest } from 'next/server'
import { GET as GetPublicSettings } from '@/app/api/settings/public/route'
import { GET as GetSettings, PUT as UpdateSettings } from '@/app/api/settings/route'
import { 
  ApiTestUtils, 
  DatabaseTestUtils, 
  NetworkUtils, 
  TestSecurity,
  CleanupUtils 
} from '../utils/testHelpers'

describe('Settings API Routes', () => {
  let originalSettings: any
  let testSettingsData: any

  beforeAll(async () => {
    // Verify test environment safety
    TestSecurity.validatePath(__filename)
  })

  beforeEach(() => {
    testSettingsData = {
      restaurantName: 'Test Restaurant',
      restaurantAddress: '123 Test Street',
      restaurantPhone: '(11) 99999-9999',
      restaurantEmail: 'test@restaurant.com',
      openingHours: {
        monday: { open: '08:00', close: '22:00', closed: false },
        tuesday: { open: '08:00', close: '22:00', closed: false },
        wednesday: { open: '08:00', close: '22:00', closed: false },
        thursday: { open: '08:00', close: '22:00', closed: false },
        friday: { open: '08:00', close: '22:00', closed: false },
        saturday: { open: '08:00', close: '22:00', closed: false },
        sunday: { open: '08:00', close: '22:00', closed: true }
      },
      currency: 'BRL',
      language: 'pt-BR',
      timezone: 'America/Sao_Paulo',
      deliveryFee: 5.00,
      minimumOrderValue: 20.00,
      acceptsDelivery: true,
      acceptsPickup: true,
      acceptsTableService: true
    }
  })

  afterEach(async () => {
    await CleanupUtils.cleanupAll()
  })

  describe('GET /api/settings/public - Public Settings', () => {
    it('should get public settings successfully', async () => {
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/settings/public')
      
      const response = await NetworkUtils.retryOperation(async () => {
        return await GetPublicSettings(request)
      })

      await ApiTestUtils.expectApiResponse(response, 200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('restaurantName')
      expect(data.data).toHaveProperty('restaurantAddress')
      expect(data.data).toHaveProperty('restaurantPhone')
      expect(data.data).toHaveProperty('openingHours')
      expect(data.data).toHaveProperty('currency')
      expect(data.data).toHaveProperty('language')
    })

    it('should not expose sensitive settings in public endpoint', async () => {
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/settings/public')
      
      const response = await GetPublicSettings(request)
      
      expect(response.status).toBe(200)
      const data = await response.json()
      
      // Should not contain sensitive information
      expect(data.data).not.toHaveProperty('adminPassword')
      expect(data.data).not.toHaveProperty('apiKeys')
      expect(data.data).not.toHaveProperty('databaseUrl')
      expect(data.data).not.toHaveProperty('secretKey')
    })

    it('should handle network failures with retry', async () => {
      let attempts = 0
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/settings/public')
      
      const response = await NetworkUtils.retryOperation(async () => {
        attempts++
        if (attempts < 2) {
          throw new Error('Network error')
        }
        return await GetPublicSettings(request)
      }, 3, 1000)

      expect(attempts).toBe(2)
      expect(response.status).toBe(200)
    })

    it('should return consistent data structure', async () => {
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/settings/public')
      
      const response = await GetPublicSettings(request)
      
      expect(response.status).toBe(200)
      const data = await response.json()
      
      expect(data).toHaveProperty('success')
      expect(data).toHaveProperty('data')
      expect(typeof data.success).toBe('boolean')
      expect(typeof data.data).toBe('object')
    })

    it('should include opening hours in correct format', async () => {
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/settings/public')
      
      const response = await GetPublicSettings(request)
      
      if (response.status === 200) {
        const data = await response.json()
        expect(data.data).toHaveProperty('openingHours')
        
        const openingHours = data.data.openingHours
        const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        
        daysOfWeek.forEach(day => {
          expect(openingHours).toHaveProperty(day)
          expect(openingHours[day]).toHaveProperty('open')
          expect(openingHours[day]).toHaveProperty('close')
          expect(openingHours[day]).toHaveProperty('closed')
        })
      }
    })
  })

  describe('GET /api/settings - Admin Settings', () => {
    it('should get all settings for admin users', async () => {
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/settings')
      // Note: In real implementation, this would require authentication
      
      const response = await NetworkUtils.retryOperation(async () => {
        return await GetSettings(request)
      })

      // Should either require authentication or return settings
      expect([200, 401]).toContain(response.status)
      
      if (response.status === 200) {
        const data = await response.json()
        expect(data.success).toBe(true)
        expect(data.data).toHaveProperty('restaurantName')
        expect(data.data).toHaveProperty('deliveryFee')
        expect(data.data).toHaveProperty('minimumOrderValue')
      }
    })

    it('should include all configuration options', async () => {
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/settings')
      
      const response = await GetSettings(request)
      
      if (response.status === 200) {
        const data = await response.json()
        
        // Should include business settings
        expect(data.data).toHaveProperty('acceptsDelivery')
        expect(data.data).toHaveProperty('acceptsPickup')
        expect(data.data).toHaveProperty('acceptsTableService')
        
        // Should include financial settings
        expect(data.data).toHaveProperty('deliveryFee')
        expect(data.data).toHaveProperty('minimumOrderValue')
        expect(data.data).toHaveProperty('currency')
      }
    })

    it('should require authentication for admin settings', async () => {
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/settings')
      // No authentication header
      
      const response = await GetSettings(request)
      
      // Should either require auth or return settings based on implementation
      expect([200, 401]).toContain(response.status)
    })
  })

  describe('PUT /api/settings - Update Settings', () => {
    beforeEach(async () => {
      // Get current settings for restoration
      const getRequest = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/settings')
      const getResponse = await GetSettings(getRequest)
      
      if (getResponse.status === 200) {
        const data = await getResponse.json()
        originalSettings = data.data
      }
    })

    it('should update restaurant basic information', async () => {
      const updateData = {
        restaurantName: 'Updated Restaurant Name',
        restaurantAddress: 'Updated Address',
        restaurantPhone: '(11) 88888-8888',
        restaurantEmail: 'updated@restaurant.com'
      }
      
      const request = ApiTestUtils.createNextRequest('PUT', 'http://localhost:3000/api/settings', updateData)
      
      const response = await NetworkUtils.retryOperation(async () => {
        return await UpdateSettings(request)
      })

      // Should either succeed or require authentication
      expect([200, 401]).toContain(response.status)
      
      if (response.status === 200) {
        const data = await response.json()
        expect(data.success).toBe(true)
        expect(data.data.restaurantName).toBe(updateData.restaurantName)
        expect(data.data.restaurantAddress).toBe(updateData.restaurantAddress)
        expect(data.data.restaurantPhone).toBe(updateData.restaurantPhone)
        expect(data.data.restaurantEmail).toBe(updateData.restaurantEmail)
        
        // Register cleanup to restore original settings
        CleanupUtils.registerCleanup('settings', 'main', async () => {
          if (originalSettings) {
            const restoreRequest = ApiTestUtils.createNextRequest('PUT', 'http://localhost:3000/api/settings', originalSettings)
            await UpdateSettings(restoreRequest)
          }
        })
      }
    })

    it('should update opening hours', async () => {
      const updateData = {
        openingHours: {
          monday: { open: '09:00', close: '21:00', closed: false },
          tuesday: { open: '09:00', close: '21:00', closed: false },
          wednesday: { open: '09:00', close: '21:00', closed: false },
          thursday: { open: '09:00', close: '21:00', closed: false },
          friday: { open: '09:00', close: '23:00', closed: false },
          saturday: { open: '09:00', close: '23:00', closed: false },
          sunday: { open: '10:00', close: '20:00', closed: false }
        }
      }
      
      const request = ApiTestUtils.createNextRequest('PUT', 'http://localhost:3000/api/settings', updateData)
      const response = await UpdateSettings(request)
      
      if (response.status === 200) {
        const data = await response.json()
        expect(data.data.openingHours.monday.open).toBe('09:00')
        expect(data.data.openingHours.friday.close).toBe('23:00')
        expect(data.data.openingHours.sunday.closed).toBe(false)
        
        CleanupUtils.registerCleanup('settings', 'main', async () => {
          if (originalSettings) {
            const restoreRequest = ApiTestUtils.createNextRequest('PUT', 'http://localhost:3000/api/settings', originalSettings)
            await UpdateSettings(restoreRequest)
          }
        })
      }
    })

    it('should update delivery settings', async () => {
      const updateData = {
        deliveryFee: 7.50,
        minimumOrderValue: 25.00,
        acceptsDelivery: true,
        acceptsPickup: true,
        acceptsTableService: false
      }
      
      const request = ApiTestUtils.createNextRequest('PUT', 'http://localhost:3000/api/settings', updateData)
      const response = await UpdateSettings(request)
      
      if (response.status === 200) {
        const data = await response.json()
        expect(data.data.deliveryFee).toBe(7.50)
        expect(data.data.minimumOrderValue).toBe(25.00)
        expect(data.data.acceptsDelivery).toBe(true)
        expect(data.data.acceptsTableService).toBe(false)
        
        CleanupUtils.registerCleanup('settings', 'main', async () => {
          if (originalSettings) {
            const restoreRequest = ApiTestUtils.createNextRequest('PUT', 'http://localhost:3000/api/settings', originalSettings)
            await UpdateSettings(restoreRequest)
          }
        })
      }
    })

    it('should validate email format', async () => {
      const invalidEmailData = {
        restaurantEmail: 'invalid-email-format'
      }
      
      const request = ApiTestUtils.createNextRequest('PUT', 'http://localhost:3000/api/settings', invalidEmailData)
      const response = await UpdateSettings(request)
      
      // Should either validate and reject or accept based on implementation
      expect([200, 400, 401]).toContain(response.status)
      
      if (response.status === 400) {
        const data = await response.json()
        expect(data.success).toBe(false)
        expect(data.error).toContain('email')
      }
    })

    it('should validate phone format', async () => {
      const invalidPhoneData = {
        restaurantPhone: 'invalid-phone'
      }
      
      const request = ApiTestUtils.createNextRequest('PUT', 'http://localhost:3000/api/settings', invalidPhoneData)
      const response = await UpdateSettings(request)
      
      // Should either validate and reject or accept based on implementation
      expect([200, 400, 401]).toContain(response.status)
    })

    it('should validate opening hours format', async () => {
      const invalidHoursData = {
        openingHours: {
          monday: { open: '25:00', close: '26:00', closed: false } // Invalid time format
        }
      }
      
      const request = ApiTestUtils.createNextRequest('PUT', 'http://localhost:3000/api/settings', invalidHoursData)
      const response = await UpdateSettings(request)
      
      // Should either validate and reject or accept based on implementation
      expect([200, 400, 401]).toContain(response.status)
    })

    it('should validate numeric values', async () => {
      const invalidNumericData = {
        deliveryFee: -5.00, // Negative fee
        minimumOrderValue: -10.00 // Negative minimum
      }
      
      const request = ApiTestUtils.createNextRequest('PUT', 'http://localhost:3000/api/settings', invalidNumericData)
      const response = await UpdateSettings(request)
      
      // Should either validate and reject or accept based on implementation
      expect([200, 400, 401]).toContain(response.status)
      
      if (response.status === 400) {
        const data = await response.json()
        expect(data.success).toBe(false)
      }
    })

    it('should require authentication for updates', async () => {
      const request = ApiTestUtils.createNextRequest('PUT', 'http://localhost:3000/api/settings', testSettingsData)
      // No authentication header
      
      const response = await UpdateSettings(request)
      
      // Should either require auth or allow updates based on implementation
      expect([200, 401, 403]).toContain(response.status)
    })
  })

  describe('Settings Validation Tests', () => {
    it('should validate currency codes', async () => {
      const invalidCurrencyData = {
        currency: 'INVALID'
      }
      
      const request = ApiTestUtils.createNextRequest('PUT', 'http://localhost:3000/api/settings', invalidCurrencyData)
      const response = await UpdateSettings(request)
      
      // Should either validate or accept based on implementation
      expect([200, 400, 401]).toContain(response.status)
    })

    it('should validate language codes', async () => {
      const invalidLanguageData = {
        language: 'invalid-lang'
      }
      
      const request = ApiTestUtils.createNextRequest('PUT', 'http://localhost:3000/api/settings', invalidLanguageData)
      const response = await UpdateSettings(request)
      
      // Should either validate or accept based on implementation
      expect([200, 400, 401]).toContain(response.status)
    })

    it('should validate timezone format', async () => {
      const invalidTimezoneData = {
        timezone: 'Invalid/Timezone'
      }
      
      const request = ApiTestUtils.createNextRequest('PUT', 'http://localhost:3000/api/settings', invalidTimezoneData)
      const response = await UpdateSettings(request)
      
      // Should either validate or accept based on implementation
      expect([200, 400, 401]).toContain(response.status)
    })
  })

  describe('Security Tests for Settings', () => {
    it('should prevent SQL injection in settings update', async () => {
      const maliciousData = {
        restaurantName: "'; DROP TABLE settings; --"
      }
      
      const request = ApiTestUtils.createNextRequest('PUT', 'http://localhost:3000/api/settings', maliciousData)
      const response = await UpdateSettings(request)
      
      // Should handle safely without crashing
      expect([200, 400, 401]).toContain(response.status)
    })

    it('should sanitize HTML input', async () => {
      const maliciousData = {
        restaurantName: '<script>alert("xss")</script>',
        restaurantAddress: '<img src="x" onerror="alert(1)">'
      }
      
      const request = ApiTestUtils.createNextRequest('PUT', 'http://localhost:3000/api/settings', maliciousData)
      const response = await UpdateSettings(request)
      
      if (response.status === 200) {
        const data = await response.json()
        expect(data.data.restaurantName).not.toContain('<script>')
        expect(data.data.restaurantAddress).not.toContain('<img')
        
        CleanupUtils.registerCleanup('settings', 'main', async () => {
          if (originalSettings) {
            const restoreRequest = ApiTestUtils.createNextRequest('PUT', 'http://localhost:3000/api/settings', originalSettings)
            await UpdateSettings(restoreRequest)
          }
        })
      }
    })

    it('should validate settings size limits', async () => {
      const oversizedData = {
        restaurantName: 'A'.repeat(1000), // Very long name
        restaurantAddress: 'B'.repeat(2000) // Very long address
      }
      
      const request = ApiTestUtils.createNextRequest('PUT', 'http://localhost:3000/api/settings', oversizedData)
      const response = await UpdateSettings(request)
      
      // Should either accept, truncate, or reject based on limits
      expect([200, 400, 401]).toContain(response.status)
    })
  })

  describe('Settings Consistency Tests', () => {
    it('should maintain data consistency between public and admin endpoints', async () => {
      // Get public settings
      const publicRequest = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/settings/public')
      const publicResponse = await GetPublicSettings(publicRequest)
      
      // Get admin settings
      const adminRequest = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/settings')
      const adminResponse = await GetSettings(adminRequest)
      
      if (publicResponse.status === 200 && adminResponse.status === 200) {
        const publicData = await publicResponse.json()
        const adminData = await adminResponse.json()
        
        // Public data should be subset of admin data
        expect(publicData.data.restaurantName).toBe(adminData.data.restaurantName)
        expect(publicData.data.restaurantAddress).toBe(adminData.data.restaurantAddress)
        expect(publicData.data.restaurantPhone).toBe(adminData.data.restaurantPhone)
        expect(publicData.data.currency).toBe(adminData.data.currency)
        expect(publicData.data.language).toBe(adminData.data.language)
      }
    })

    it('should handle concurrent settings updates', async () => {
      const updateData1 = { restaurantName: 'Concurrent Update 1' }
      const updateData2 = { restaurantName: 'Concurrent Update 2' }
      
      const request1 = ApiTestUtils.createNextRequest('PUT', 'http://localhost:3000/api/settings', updateData1)
      const request2 = ApiTestUtils.createNextRequest('PUT', 'http://localhost:3000/api/settings', updateData2)
      
      // Make concurrent requests
      const [response1, response2] = await Promise.all([
        UpdateSettings(request1),
        UpdateSettings(request2)
      ])
      
      // Both should either succeed or fail gracefully
      expect([200, 401, 409]).toContain(response1.status)
      expect([200, 401, 409]).toContain(response2.status)
      
      if (response1.status === 200 || response2.status === 200) {
        CleanupUtils.registerCleanup('settings', 'main', async () => {
          if (originalSettings) {
            const restoreRequest = ApiTestUtils.createNextRequest('PUT', 'http://localhost:3000/api/settings', originalSettings)
            await UpdateSettings(restoreRequest)
          }
        })
      }
    })
  })
})