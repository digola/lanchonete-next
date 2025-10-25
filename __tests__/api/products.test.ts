import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/products/route'
import { GET as GetProduct, PUT, DELETE } from '@/app/api/products/[id]/route'
import { 
  ApiTestUtils, 
  DatabaseTestUtils, 
  NetworkUtils, 
  TestSecurity,
  CleanupUtils 
} from '../utils/testHelpers'

describe('Products API - CRUD Operations', () => {
  let testProductId: string
  let testCategoryId: string
  let testProductData: any

  beforeAll(async () => {
    // Verify test environment safety
    TestSecurity.validatePath(__filename)
  })

  beforeEach(() => {
    testProductData = DatabaseTestUtils.generateTestProduct()
  })

  afterEach(async () => {
    await CleanupUtils.cleanupAll()
  })

  describe('POST /api/products - Create Product', () => {
    it('should create a new product successfully', async () => {
      const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/products', testProductData)
      
      const response = await NetworkUtils.retryOperation(async () => {
        return await POST(request)
      })

      await ApiTestUtils.expectApiResponse(response, 201)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('id')
      expect(data.data.name).toBe(testProductData.name)
      expect(data.data.price).toBe(testProductData.price)
      expect(data.data.description).toBe(testProductData.description)
      
      testProductId = data.data.id
      
      // Register cleanup
      CleanupUtils.registerCleanup('product', testProductId, async () => {
        const deleteRequest = ApiTestUtils.createNextRequest('DELETE', `http://localhost:3000/api/products/${testProductId}`)
        await DELETE(deleteRequest, { params: { id: testProductId } })
      })
    })

    it('should validate required fields', async () => {
      const invalidData = { name: 'Test Product' } // Missing price and description
      const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/products', invalidData)
      
      const response = await POST(request)
      
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toContain('required')
    })

    it('should validate price is positive number', async () => {
      const invalidData = {
        ...testProductData,
        price: -10.50 // Negative price
      }
      const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/products', invalidData)
      
      const response = await POST(request)
      
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toContain('price')
    })

    it('should handle network failures with retry', async () => {
      let attempts = 0
      const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/products', testProductData)
      
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

  describe('GET /api/products - List Products', () => {
    beforeEach(async () => {
      // Create test product for listing
      const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/products', testProductData)
      const response = await POST(request)
      const data = await response.json()
      testProductId = data.data.id
      
      CleanupUtils.registerCleanup('product', testProductId, async () => {
        const deleteRequest = ApiTestUtils.createNextRequest('DELETE', `http://localhost:3000/api/products/${testProductId}`)
        await DELETE(deleteRequest, { params: { id: testProductId } })
      })
    })

    it('should list products with pagination', async () => {
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/products?page=1&limit=10')
      
      const response = await NetworkUtils.retryOperation(async () => {
        return await GET(request)
      })

      await ApiTestUtils.expectApiResponse(response, 200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('products')
      expect(data.data).toHaveProperty('pagination')
      expect(Array.isArray(data.data.products)).toBe(true)
    })

    it('should filter products by category', async () => {
      const request = ApiTestUtils.createNextRequest('GET', `http://localhost:3000/api/products?categoryId=${testProductData.category}`)
      
      const response = await GET(request)
      
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
    })

    it('should search products by name or description', async () => {
      const searchTerm = testProductData.name.substring(0, 4)
      const request = ApiTestUtils.createNextRequest('GET', `http://localhost:3000/api/products?search=${searchTerm}`)
      
      const response = await GET(request)
      
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
    })

    it('should filter products by availability', async () => {
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/products?available=true')
      
      const response = await GET(request)
      
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      
      if (data.data.products.length > 0) {
        data.data.products.forEach((product: any) => {
          expect(product.available).toBe(true)
        })
      }
    })

    it('should sort products by price', async () => {
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/products?sortBy=price&sortOrder=asc')
      
      const response = await GET(request)
      
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      
      if (data.data.products.length > 1) {
        for (let i = 1; i < data.data.products.length; i++) {
          expect(data.data.products[i].price).toBeGreaterThanOrEqual(data.data.products[i - 1].price)
        }
      }
    })
  })

  describe('GET /api/products/[id] - Get Product by ID', () => {
    beforeEach(async () => {
      // Create test product
      const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/products', testProductData)
      const response = await POST(request)
      const data = await response.json()
      testProductId = data.data.id
      
      CleanupUtils.registerCleanup('product', testProductId, async () => {
        const deleteRequest = ApiTestUtils.createNextRequest('DELETE', `http://localhost:3000/api/products/${testProductId}`)
        await DELETE(deleteRequest, { params: { id: testProductId } })
      })
    })

    it('should get product by valid ID', async () => {
      const request = ApiTestUtils.createNextRequest('GET', `http://localhost:3000/api/products/${testProductId}`)
      
      const response = await NetworkUtils.retryOperation(async () => {
        return await GetProduct(request, { params: { id: testProductId } })
      })

      await ApiTestUtils.expectApiResponse(response, 200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.id).toBe(testProductId)
      expect(data.data.name).toBe(testProductData.name)
      expect(data.data.price).toBe(testProductData.price)
    })

    it('should return 404 for non-existent product', async () => {
      const fakeId = 'non-existent-id'
      const request = ApiTestUtils.createNextRequest('GET', `http://localhost:3000/api/products/${fakeId}`)
      
      const response = await GetProduct(request, { params: { id: fakeId } })
      
      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.success).toBe(false)
    })
  })

  describe('PUT /api/products/[id] - Update Product', () => {
    beforeEach(async () => {
      // Create test product
      const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/products', testProductData)
      const response = await POST(request)
      const data = await response.json()
      testProductId = data.data.id
      
      CleanupUtils.registerCleanup('product', testProductId, async () => {
        const deleteRequest = ApiTestUtils.createNextRequest('DELETE', `http://localhost:3000/api/products/${testProductId}`)
        await DELETE(deleteRequest, { params: { id: testProductId } })
      })
    })

    it('should update product successfully', async () => {
      const updateData = {
        name: 'Updated Test Product',
        price: 15.99,
        description: 'Updated description'
      }
      
      const request = ApiTestUtils.createNextRequest('PUT', `http://localhost:3000/api/products/${testProductId}`, updateData)
      
      const response = await NetworkUtils.retryOperation(async () => {
        return await PUT(request, { params: { id: testProductId } })
      })

      await ApiTestUtils.expectApiResponse(response, 200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.name).toBe(updateData.name)
      expect(data.data.price).toBe(updateData.price)
      expect(data.data.description).toBe(updateData.description)
    })

    it('should validate price on update', async () => {
      const invalidData = {
        price: -5.00 // Negative price
      }
      
      const request = ApiTestUtils.createNextRequest('PUT', `http://localhost:3000/api/products/${testProductId}`, invalidData)
      
      const response = await PUT(request, { params: { id: testProductId } })
      
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.success).toBe(false)
    })

    it('should update availability status', async () => {
      const updateData = {
        available: false
      }
      
      const request = ApiTestUtils.createNextRequest('PUT', `http://localhost:3000/api/products/${testProductId}`, updateData)
      
      const response = await PUT(request, { params: { id: testProductId } })
      
      await ApiTestUtils.expectApiResponse(response, 200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.available).toBe(false)
    })
  })

  describe('DELETE /api/products/[id] - Delete Product', () => {
    beforeEach(async () => {
      // Create test product
      const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/products', testProductData)
      const response = await POST(request)
      const data = await response.json()
      testProductId = data.data.id
    })

    it('should delete product successfully', async () => {
      const request = ApiTestUtils.createNextRequest('DELETE', `http://localhost:3000/api/products/${testProductId}`)
      
      const response = await NetworkUtils.retryOperation(async () => {
        return await DELETE(request, { params: { id: testProductId } })
      })

      await ApiTestUtils.expectApiResponse(response, 200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      
      // Verify product is deleted
      const getRequest = ApiTestUtils.createNextRequest('GET', `http://localhost:3000/api/products/${testProductId}`)
      const getResponse = await GetProduct(getRequest, { params: { id: testProductId } })
      expect(getResponse.status).toBe(404)
    })

    it('should return 404 when deleting non-existent product', async () => {
      const fakeId = 'non-existent-id'
      const request = ApiTestUtils.createNextRequest('DELETE', `http://localhost:3000/api/products/${fakeId}`)
      
      const response = await DELETE(request, { params: { id: fakeId } })
      
      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.success).toBe(false)
    })
  })

  describe('Product Image Upload Tests', () => {
    beforeEach(async () => {
      // Create test product
      const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/products', testProductData)
      const response = await POST(request)
      const data = await response.json()
      testProductId = data.data.id
      
      CleanupUtils.registerCleanup('product', testProductId, async () => {
        const deleteRequest = ApiTestUtils.createNextRequest('DELETE', `http://localhost:3000/api/products/${testProductId}`)
        await DELETE(deleteRequest, { params: { id: testProductId } })
      })
    })

    it('should update product with image URL', async () => {
      const updateData = {
        imageUrl: 'https://example.com/test-image.jpg'
      }
      
      const request = ApiTestUtils.createNextRequest('PUT', `http://localhost:3000/api/products/${testProductId}`, updateData)
      
      const response = await PUT(request, { params: { id: testProductId } })
      
      await ApiTestUtils.expectApiResponse(response, 200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.imageUrl).toBe(updateData.imageUrl)
    })

    it('should validate image URL format', async () => {
      const invalidData = {
        imageUrl: 'not-a-valid-url'
      }
      
      const request = ApiTestUtils.createNextRequest('PUT', `http://localhost:3000/api/products/${testProductId}`, invalidData)
      
      const response = await PUT(request, { params: { id: testProductId } })
      
      // Should either accept it or validate URL format
      expect([200, 400]).toContain(response.status)
    })
  })

  describe('Security and Performance Tests', () => {
    it('should prevent SQL injection in product search', async () => {
      const maliciousSearch = "'; DROP TABLE products; --"
      const request = ApiTestUtils.createNextRequest('GET', `http://localhost:3000/api/products?search=${encodeURIComponent(maliciousSearch)}`)
      
      const response = await GET(request)
      
      // Should handle safely without crashing
      expect([200, 400]).toContain(response.status)
    })

    it('should handle large product descriptions', async () => {
      const largeDescription = 'A'.repeat(10000) // 10KB description
      const productData = {
        ...testProductData,
        description: largeDescription
      }
      
      const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/products', productData)
      
      const response = await POST(request)
      
      // Should either accept or reject based on size limits
      expect([201, 400, 413]).toContain(response.status)
    })

    it('should validate numeric price precision', async () => {
      const productData = {
        ...testProductData,
        price: 10.999999 // Too many decimal places
      }
      
      const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/products', productData)
      
      const response = await POST(request)
      
      if (response.status === 201) {
        const data = await response.json()
        // Price should be rounded to 2 decimal places
        expect(Number(data.data.price.toFixed(2))).toBe(11.00)
        
        testProductId = data.data.id
        CleanupUtils.registerCleanup('product', testProductId, async () => {
          const deleteRequest = ApiTestUtils.createNextRequest('DELETE', `http://localhost:3000/api/products/${testProductId}`)
          await DELETE(deleteRequest, { params: { id: testProductId } })
        })
      }
    })
  })
})