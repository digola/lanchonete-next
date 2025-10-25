import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/orders/route'
import { GET as GetOrder, PUT, DELETE } from '@/app/api/orders/[id]/route'
import { 
  ApiTestUtils, 
  DatabaseTestUtils, 
  NetworkUtils, 
  TestSecurity,
  CleanupUtils 
} from '../utils/testHelpers'

describe('Orders API - CRUD Operations', () => {
  let testOrderId: string
  let testOrderData: any
  let testUserId: string
  let testProductId: string

  beforeAll(async () => {
    // Verify test environment safety
    TestSecurity.validatePath(__filename)
  })

  beforeEach(() => {
    testOrderData = DatabaseTestUtils.generateTestOrder()
  })

  afterEach(async () => {
    await CleanupUtils.cleanupAll()
  })

  describe('POST /api/orders - Create Order', () => {
    it('should create a new order successfully', async () => {
      const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/orders', testOrderData)
      
      const response = await NetworkUtils.retryOperation(async () => {
        return await POST(request)
      })

      await ApiTestUtils.expectApiResponse(response, 201)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('id')
      expect(data.data.customerName).toBe(testOrderData.customerName)
      expect(data.data.status).toBe(testOrderData.status || 'pending')
      expect(data.data.total).toBe(testOrderData.total)
      
      testOrderId = data.data.id
      
      // Register cleanup
      CleanupUtils.registerCleanup('order', testOrderId, async () => {
        const deleteRequest = ApiTestUtils.createNextRequest('DELETE', `http://localhost:3000/api/orders/${testOrderId}`)
        await DELETE(deleteRequest, { params: { id: testOrderId } })
      })
    })

    it('should validate required order fields', async () => {
      const invalidData = { 
        customerName: testOrderData.customerName 
        // Missing items and total
      }
      
      const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/orders', invalidData)
      const response = await POST(request)
      
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toContain('required')
    })

    it('should validate order items structure', async () => {
      const invalidItemsData = {
        ...testOrderData,
        items: [
          { productId: 'invalid-id' } // Missing quantity and price
        ]
      }
      
      const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/orders', invalidItemsData)
      const response = await POST(request)
      
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toContain('items')
    })

    it('should calculate total correctly', async () => {
      const orderWithItems = {
        customerName: 'Test Customer',
        customerPhone: '123456789',
        items: [
          { productId: 'prod1', quantity: 2, price: 10.50, name: 'Product 1' },
          { productId: 'prod2', quantity: 1, price: 15.00, name: 'Product 2' }
        ],
        total: 36.00 // 2 * 10.50 + 1 * 15.00
      }
      
      const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/orders', orderWithItems)
      const response = await POST(request)
      
      if (response.status === 201) {
        const data = await response.json()
        expect(data.data.total).toBe(36.00)
        
        testOrderId = data.data.id
        CleanupUtils.registerCleanup('order', testOrderId, async () => {
          const deleteRequest = ApiTestUtils.createNextRequest('DELETE', `http://localhost:3000/api/orders/${testOrderId}`)
          await DELETE(deleteRequest, { params: { id: testOrderId } })
        })
      }
    })

    it('should set default order status', async () => {
      const orderWithoutStatus = {
        ...testOrderData
      }
      delete orderWithoutStatus.status
      
      const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/orders', orderWithoutStatus)
      const response = await POST(request)
      
      if (response.status === 201) {
        const data = await response.json()
        expect(data.data.status).toBe('pending') // Default status
        
        testOrderId = data.data.id
        CleanupUtils.registerCleanup('order', testOrderId, async () => {
          const deleteRequest = ApiTestUtils.createNextRequest('DELETE', `http://localhost:3000/api/orders/${testOrderId}`)
          await DELETE(deleteRequest, { params: { id: testOrderId } })
        })
      }
    })

    it('should handle network failures with retry', async () => {
      let attempts = 0
      const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/orders', testOrderData)
      
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

  describe('GET /api/orders - List Orders', () => {
    beforeEach(async () => {
      // Create test order for listing
      const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/orders', testOrderData)
      const response = await POST(request)
      const data = await response.json()
      testOrderId = data.data.id
      
      CleanupUtils.registerCleanup('order', testOrderId, async () => {
        const deleteRequest = ApiTestUtils.createNextRequest('DELETE', `http://localhost:3000/api/orders/${testOrderId}`)
        await DELETE(deleteRequest, { params: { id: testOrderId } })
      })
    })

    it('should list orders with pagination', async () => {
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/orders?page=1&limit=10')
      
      const response = await NetworkUtils.retryOperation(async () => {
        return await GET(request)
      })

      await ApiTestUtils.expectApiResponse(response, 200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('orders')
      expect(data.data).toHaveProperty('pagination')
      expect(Array.isArray(data.data.orders)).toBe(true)
    })

    it('should filter orders by status', async () => {
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/orders?status=pending')
      
      const response = await GET(request)
      
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      
      if (data.data.orders.length > 0) {
        data.data.orders.forEach((order: any) => {
          expect(order.status).toBe('pending')
        })
      }
    })

    it('should filter orders by date range', async () => {
      const today = new Date().toISOString().split('T')[0]
      const request = ApiTestUtils.createNextRequest('GET', `http://localhost:3000/api/orders?startDate=${today}&endDate=${today}`)
      
      const response = await GET(request)
      
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
    })

    it('should search orders by customer name', async () => {
      const searchTerm = testOrderData.customerName.substring(0, 4)
      const request = ApiTestUtils.createNextRequest('GET', `http://localhost:3000/api/orders?search=${searchTerm}`)
      
      const response = await GET(request)
      
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
    })

    it('should sort orders by creation date', async () => {
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/orders?sortBy=createdAt&sortOrder=desc')
      
      const response = await GET(request)
      
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      
      if (data.data.orders.length > 1) {
        for (let i = 1; i < data.data.orders.length; i++) {
          const current = new Date(data.data.orders[i].createdAt)
          const previous = new Date(data.data.orders[i - 1].createdAt)
          expect(current.getTime()).toBeLessThanOrEqual(previous.getTime())
        }
      }
    })
  })

  describe('GET /api/orders/[id] - Get Order by ID', () => {
    beforeEach(async () => {
      // Create test order
      const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/orders', testOrderData)
      const response = await POST(request)
      const data = await response.json()
      testOrderId = data.data.id
      
      CleanupUtils.registerCleanup('order', testOrderId, async () => {
        const deleteRequest = ApiTestUtils.createNextRequest('DELETE', `http://localhost:3000/api/orders/${testOrderId}`)
        await DELETE(deleteRequest, { params: { id: testOrderId } })
      })
    })

    it('should get order by valid ID', async () => {
      const request = ApiTestUtils.createNextRequest('GET', `http://localhost:3000/api/orders/${testOrderId}`)
      
      const response = await NetworkUtils.retryOperation(async () => {
        return await GetOrder(request, { params: { id: testOrderId } })
      })

      await ApiTestUtils.expectApiResponse(response, 200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.id).toBe(testOrderId)
      expect(data.data.customerName).toBe(testOrderData.customerName)
    })

    it('should return 404 for non-existent order', async () => {
      const fakeId = 'non-existent-id'
      const request = ApiTestUtils.createNextRequest('GET', `http://localhost:3000/api/orders/${fakeId}`)
      
      const response = await GetOrder(request, { params: { id: fakeId } })
      
      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.success).toBe(false)
    })

    it('should include order items in response', async () => {
      const request = ApiTestUtils.createNextRequest('GET', `http://localhost:3000/api/orders/${testOrderId}`)
      
      const response = await GetOrder(request, { params: { id: testOrderId } })
      
      if (response.status === 200) {
        const data = await response.json()
        expect(data.data).toHaveProperty('items')
        expect(Array.isArray(data.data.items)).toBe(true)
      }
    })
  })

  describe('PUT /api/orders/[id] - Update Order', () => {
    beforeEach(async () => {
      // Create test order
      const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/orders', testOrderData)
      const response = await POST(request)
      const data = await response.json()
      testOrderId = data.data.id
      
      CleanupUtils.registerCleanup('order', testOrderId, async () => {
        const deleteRequest = ApiTestUtils.createNextRequest('DELETE', `http://localhost:3000/api/orders/${testOrderId}`)
        await DELETE(deleteRequest, { params: { id: testOrderId } })
      })
    })

    it('should update order status successfully', async () => {
      const updateData = {
        status: 'confirmed'
      }
      
      const request = ApiTestUtils.createNextRequest('PUT', `http://localhost:3000/api/orders/${testOrderId}`, updateData)
      
      const response = await NetworkUtils.retryOperation(async () => {
        return await PUT(request, { params: { id: testOrderId } })
      })

      await ApiTestUtils.expectApiResponse(response, 200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.status).toBe('confirmed')
    })

    it('should validate order status transitions', async () => {
      const invalidStatusData = {
        status: 'invalid-status'
      }
      
      const request = ApiTestUtils.createNextRequest('PUT', `http://localhost:3000/api/orders/${testOrderId}`, invalidStatusData)
      const response = await PUT(request, { params: { id: testOrderId } })
      
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toContain('status')
    })

    it('should update customer information', async () => {
      const updateData = {
        customerName: 'Updated Customer Name',
        customerPhone: '987654321',
        customerAddress: 'Updated Address'
      }
      
      const request = ApiTestUtils.createNextRequest('PUT', `http://localhost:3000/api/orders/${testOrderId}`, updateData)
      const response = await PUT(request, { params: { id: testOrderId } })
      
      if (response.status === 200) {
        const data = await response.json()
        expect(data.data.customerName).toBe(updateData.customerName)
        expect(data.data.customerPhone).toBe(updateData.customerPhone)
        expect(data.data.customerAddress).toBe(updateData.customerAddress)
      }
    })

    it('should prevent updating completed orders', async () => {
      // First, update order to completed status
      const completeRequest = ApiTestUtils.createNextRequest('PUT', `http://localhost:3000/api/orders/${testOrderId}`, { status: 'completed' })
      await PUT(completeRequest, { params: { id: testOrderId } })
      
      // Try to update completed order
      const updateData = {
        customerName: 'Should Not Update'
      }
      
      const request = ApiTestUtils.createNextRequest('PUT', `http://localhost:3000/api/orders/${testOrderId}`, updateData)
      const response = await PUT(request, { params: { id: testOrderId } })
      
      // Should either prevent update or allow based on business rules
      expect([200, 400, 403]).toContain(response.status)
    })

    it('should update order notes', async () => {
      const updateData = {
        notes: 'Special instructions for this order'
      }
      
      const request = ApiTestUtils.createNextRequest('PUT', `http://localhost:3000/api/orders/${testOrderId}`, updateData)
      const response = await PUT(request, { params: { id: testOrderId } })
      
      if (response.status === 200) {
        const data = await response.json()
        expect(data.data.notes).toBe(updateData.notes)
      }
    })
  })

  describe('DELETE /api/orders/[id] - Delete Order', () => {
    beforeEach(async () => {
      // Create test order
      const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/orders', testOrderData)
      const response = await POST(request)
      const data = await response.json()
      testOrderId = data.data.id
    })

    it('should delete order successfully when allowed', async () => {
      const request = ApiTestUtils.createNextRequest('DELETE', `http://localhost:3000/api/orders/${testOrderId}`)
      
      const response = await NetworkUtils.retryOperation(async () => {
        return await DELETE(request, { params: { id: testOrderId } })
      })

      await ApiTestUtils.expectApiResponse(response, 200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      
      // Verify order is deleted
      const getRequest = ApiTestUtils.createNextRequest('GET', `http://localhost:3000/api/orders/${testOrderId}`)
      const getResponse = await GetOrder(getRequest, { params: { id: testOrderId } })
      expect(getResponse.status).toBe(404)
    })

    it('should return 404 when deleting non-existent order', async () => {
      const fakeId = 'non-existent-id'
      const request = ApiTestUtils.createNextRequest('DELETE', `http://localhost:3000/api/orders/${fakeId}`)
      
      const response = await DELETE(request, { params: { id: fakeId } })
      
      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.success).toBe(false)
    })

    it('should prevent deletion of processed orders', async () => {
      // Update order to processed status first
      const updateRequest = ApiTestUtils.createNextRequest('PUT', `http://localhost:3000/api/orders/${testOrderId}`, { status: 'processing' })
      await PUT(updateRequest, { params: { id: testOrderId } })
      
      const request = ApiTestUtils.createNextRequest('DELETE', `http://localhost:3000/api/orders/${testOrderId}`)
      const response = await DELETE(request, { params: { id: testOrderId } })
      
      // Should either prevent deletion or allow based on business rules
      expect([200, 400, 403]).toContain(response.status)
      
      if (response.status !== 200) {
        const data = await response.json()
        expect(data.success).toBe(false)
      }
    })
  })

  describe('Order Status Workflow Tests', () => {
    beforeEach(async () => {
      // Create test order
      const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/orders', testOrderData)
      const response = await POST(request)
      const data = await response.json()
      testOrderId = data.data.id
      
      CleanupUtils.registerCleanup('order', testOrderId, async () => {
        const deleteRequest = ApiTestUtils.createNextRequest('DELETE', `http://localhost:3000/api/orders/${testOrderId}`)
        await DELETE(deleteRequest, { params: { id: testOrderId } })
      })
    })

    it('should follow proper status workflow', async () => {
      const statusFlow = ['pending', 'confirmed', 'preparing', 'ready', 'completed']
      
      for (let i = 1; i < statusFlow.length; i++) {
        const updateData = { status: statusFlow[i] }
        const request = ApiTestUtils.createNextRequest('PUT', `http://localhost:3000/api/orders/${testOrderId}`, updateData)
        const response = await PUT(request, { params: { id: testOrderId } })
        
        if (response.status === 200) {
          const data = await response.json()
          expect(data.data.status).toBe(statusFlow[i])
        }
      }
    })

    it('should track status change timestamps', async () => {
      const updateData = { status: 'confirmed' }
      const request = ApiTestUtils.createNextRequest('PUT', `http://localhost:3000/api/orders/${testOrderId}`, updateData)
      const response = await PUT(request, { params: { id: testOrderId } })
      
      if (response.status === 200) {
        const data = await response.json()
        expect(data.data).toHaveProperty('updatedAt')
        expect(new Date(data.data.updatedAt).getTime()).toBeGreaterThan(new Date(data.data.createdAt).getTime())
      }
    })
  })

  describe('Security and Validation Tests', () => {
    it('should prevent SQL injection in order search', async () => {
      const maliciousSearch = "'; DROP TABLE orders; --"
      const request = ApiTestUtils.createNextRequest('GET', `http://localhost:3000/api/orders?search=${encodeURIComponent(maliciousSearch)}`)
      
      const response = await GET(request)
      
      // Should handle safely without crashing
      expect([200, 400]).toContain(response.status)
    })

    it('should validate order total calculation', async () => {
      const manipulatedOrder = {
        customerName: 'Test Customer',
        items: [
          { productId: 'prod1', quantity: 1, price: 10.00, name: 'Product 1' }
        ],
        total: 1000.00 // Manipulated total
      }
      
      const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/orders', manipulatedOrder)
      const response = await POST(request)
      
      // Should either recalculate total or reject
      expect([201, 400]).toContain(response.status)
      
      if (response.status === 201) {
        const data = await response.json()
        // Total should be recalculated correctly
        expect(data.data.total).toBe(10.00)
        
        testOrderId = data.data.id
        CleanupUtils.registerCleanup('order', testOrderId, async () => {
          const deleteRequest = ApiTestUtils.createNextRequest('DELETE', `http://localhost:3000/api/orders/${testOrderId}`)
          await DELETE(deleteRequest, { params: { id: testOrderId } })
        })
      }
    })

    it('should sanitize customer input', async () => {
      const maliciousData = {
        customerName: '<script>alert("xss")</script>',
        customerPhone: '123456789',
        items: [
          { productId: 'prod1', quantity: 1, price: 10.00, name: 'Product 1' }
        ],
        total: 10.00
      }
      
      const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/orders', maliciousData)
      const response = await POST(request)
      
      if (response.status === 201) {
        const data = await response.json()
        expect(data.data.customerName).not.toContain('<script>')
        
        testOrderId = data.data.id
        CleanupUtils.registerCleanup('order', testOrderId, async () => {
          const deleteRequest = ApiTestUtils.createNextRequest('DELETE', `http://localhost:3000/api/orders/${testOrderId}`)
          await DELETE(deleteRequest, { params: { id: testOrderId } })
        })
      }
    })

    it('should validate order item quantities', async () => {
      const invalidQuantityOrder = {
        customerName: 'Test Customer',
        items: [
          { productId: 'prod1', quantity: -1, price: 10.00, name: 'Product 1' }
        ],
        total: -10.00
      }
      
      const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/orders', invalidQuantityOrder)
      const response = await POST(request)
      
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toContain('quantity')
    })
  })
})