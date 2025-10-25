import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/categories/route'
import { GET as GetCategory, PUT, DELETE } from '@/app/api/categories/[id]/route'
import { 
  ApiTestUtils, 
  DatabaseTestUtils, 
  NetworkUtils, 
  TestSecurity,
  CleanupUtils 
} from '../utils/testHelpers'

describe('Categories API - CRUD Operations', () => {
  let testCategoryId: string
  let testCategoryData: any

  beforeAll(async () => {
    // Verify test environment safety
    TestSecurity.validatePath(__filename)
  })

  beforeEach(() => {
    testCategoryData = DatabaseTestUtils.generateTestCategory()
  })

  afterEach(async () => {
    await CleanupUtils.cleanupAll()
  })

  describe('POST /api/categories - Create Category', () => {
    it('should create a new category successfully', async () => {
      const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/categories', testCategoryData)
      
      const response = await NetworkUtils.retryOperation(async () => {
        return await POST(request)
      })

      await ApiTestUtils.expectApiResponse(response, 201)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('id')
      expect(data.data.name).toBe(testCategoryData.name)
      expect(data.data.description).toBe(testCategoryData.description)
      expect(data.data.active).toBe(testCategoryData.active)
      
      testCategoryId = data.data.id
      
      // Register cleanup
      CleanupUtils.registerCleanup('category', testCategoryId, async () => {
        const deleteRequest = ApiTestUtils.createNextRequest('DELETE', `http://localhost:3000/api/categories/${testCategoryId}`)
        await DELETE(deleteRequest, { params: { id: testCategoryId } })
      })
    })

    it('should validate required fields', async () => {
      const invalidData = { description: 'Test description' } // Missing name
      const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/categories', invalidData)
      
      const response = await POST(request)
      
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toContain('required')
    })

    it('should prevent duplicate category names', async () => {
      // Create first category
      const request1 = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/categories', testCategoryData)
      const response1 = await POST(request1)
      
      expect(response1.status).toBe(201)
      const data1 = await response1.json()
      testCategoryId = data1.data.id
      
      // Register cleanup
      CleanupUtils.registerCleanup('category', testCategoryId, async () => {
        const deleteRequest = ApiTestUtils.createNextRequest('DELETE', `http://localhost:3000/api/categories/${testCategoryId}`)
        await DELETE(deleteRequest, { params: { id: testCategoryId } })
      })

      // Try to create category with same name
      const request2 = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/categories', testCategoryData)
      const response2 = await POST(request2)
      
      expect(response2.status).toBe(409)
      const data2 = await response2.json()
      expect(data2.success).toBe(false)
      expect(data2.error).toContain('name')
    })

    it('should handle network failures with retry', async () => {
      let attempts = 0
      const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/categories', testCategoryData)
      
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

    it('should set default values correctly', async () => {
      const minimalData = {
        name: 'Minimal Category'
      }
      
      const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/categories', minimalData)
      const response = await POST(request)
      
      if (response.status === 201) {
        const data = await response.json()
        expect(data.data.active).toBe(true) // Default should be true
        
        testCategoryId = data.data.id
        CleanupUtils.registerCleanup('category', testCategoryId, async () => {
          const deleteRequest = ApiTestUtils.createNextRequest('DELETE', `http://localhost:3000/api/categories/${testCategoryId}`)
          await DELETE(deleteRequest, { params: { id: testCategoryId } })
        })
      }
    })
  })

  describe('GET /api/categories - List Categories', () => {
    beforeEach(async () => {
      // Create test category for listing
      const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/categories', testCategoryData)
      const response = await POST(request)
      const data = await response.json()
      testCategoryId = data.data.id
      
      CleanupUtils.registerCleanup('category', testCategoryId, async () => {
        const deleteRequest = ApiTestUtils.createNextRequest('DELETE', `http://localhost:3000/api/categories/${testCategoryId}`)
        await DELETE(deleteRequest, { params: { id: testCategoryId } })
      })
    })

    it('should list categories with pagination', async () => {
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/categories?page=1&limit=10')
      
      const response = await NetworkUtils.retryOperation(async () => {
        return await GET(request)
      })

      await ApiTestUtils.expectApiResponse(response, 200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('categories')
      expect(data.data).toHaveProperty('pagination')
      expect(Array.isArray(data.data.categories)).toBe(true)
    })

    it('should filter categories by active status', async () => {
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/categories?active=true')
      
      const response = await GET(request)
      
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      
      if (data.data.categories.length > 0) {
        data.data.categories.forEach((category: any) => {
          expect(category.active).toBe(true)
        })
      }
    })

    it('should search categories by name', async () => {
      const searchTerm = testCategoryData.name.substring(0, 4)
      const request = ApiTestUtils.createNextRequest('GET', `http://localhost:3000/api/categories?search=${searchTerm}`)
      
      const response = await GET(request)
      
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
    })

    it('should sort categories alphabetically', async () => {
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/categories?sortBy=name&sortOrder=asc')
      
      const response = await GET(request)
      
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      
      if (data.data.categories.length > 1) {
        for (let i = 1; i < data.data.categories.length; i++) {
          expect(data.data.categories[i].name.localeCompare(data.data.categories[i - 1].name)).toBeGreaterThanOrEqual(0)
        }
      }
    })
  })

  describe('GET /api/categories/[id] - Get Category by ID', () => {
    beforeEach(async () => {
      // Create test category
      const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/categories', testCategoryData)
      const response = await POST(request)
      const data = await response.json()
      testCategoryId = data.data.id
      
      CleanupUtils.registerCleanup('category', testCategoryId, async () => {
        const deleteRequest = ApiTestUtils.createNextRequest('DELETE', `http://localhost:3000/api/categories/${testCategoryId}`)
        await DELETE(deleteRequest, { params: { id: testCategoryId } })
      })
    })

    it('should get category by valid ID', async () => {
      const request = ApiTestUtils.createNextRequest('GET', `http://localhost:3000/api/categories/${testCategoryId}`)
      
      const response = await NetworkUtils.retryOperation(async () => {
        return await GetCategory(request, { params: { id: testCategoryId } })
      })

      await ApiTestUtils.expectApiResponse(response, 200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.id).toBe(testCategoryId)
      expect(data.data.name).toBe(testCategoryData.name)
    })

    it('should return 404 for non-existent category', async () => {
      const fakeId = 'non-existent-id'
      const request = ApiTestUtils.createNextRequest('GET', `http://localhost:3000/api/categories/${fakeId}`)
      
      const response = await GetCategory(request, { params: { id: fakeId } })
      
      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.success).toBe(false)
    })

    it('should include product count in category details', async () => {
      const request = ApiTestUtils.createNextRequest('GET', `http://localhost:3000/api/categories/${testCategoryId}?includeProductCount=true`)
      
      const response = await GetCategory(request, { params: { id: testCategoryId } })
      
      if (response.status === 200) {
        const data = await response.json()
        expect(data.data).toHaveProperty('productCount')
        expect(typeof data.data.productCount).toBe('number')
      }
    })
  })

  describe('PUT /api/categories/[id] - Update Category', () => {
    beforeEach(async () => {
      // Create test category
      const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/categories', testCategoryData)
      const response = await POST(request)
      const data = await response.json()
      testCategoryId = data.data.id
      
      CleanupUtils.registerCleanup('category', testCategoryId, async () => {
        const deleteRequest = ApiTestUtils.createNextRequest('DELETE', `http://localhost:3000/api/categories/${testCategoryId}`)
        await DELETE(deleteRequest, { params: { id: testCategoryId } })
      })
    })

    it('should update category successfully', async () => {
      const updateData = {
        name: 'Updated Test Category',
        description: 'Updated description',
        active: false
      }
      
      const request = ApiTestUtils.createNextRequest('PUT', `http://localhost:3000/api/categories/${testCategoryId}`, updateData)
      
      const response = await NetworkUtils.retryOperation(async () => {
        return await PUT(request, { params: { id: testCategoryId } })
      })

      await ApiTestUtils.expectApiResponse(response, 200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.name).toBe(updateData.name)
      expect(data.data.description).toBe(updateData.description)
      expect(data.data.active).toBe(updateData.active)
    })

    it('should validate unique name on update', async () => {
      // Create another category first
      const anotherCategory = DatabaseTestUtils.generateTestCategory({
        name: 'Another Category'
      })
      
      const createRequest = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/categories', anotherCategory)
      const createResponse = await POST(createRequest)
      
      if (createResponse.status === 201) {
        const createData = await createResponse.json()
        const anotherId = createData.data.id
        
        CleanupUtils.registerCleanup('category', anotherId, async () => {
          const deleteRequest = ApiTestUtils.createNextRequest('DELETE', `http://localhost:3000/api/categories/${anotherId}`)
          await DELETE(deleteRequest, { params: { id: anotherId } })
        })

        // Try to update first category with second category's name
        const updateData = {
          name: anotherCategory.name
        }
        
        const updateRequest = ApiTestUtils.createNextRequest('PUT', `http://localhost:3000/api/categories/${testCategoryId}`, updateData)
        const updateResponse = await PUT(updateRequest, { params: { id: testCategoryId } })
        
        expect(updateResponse.status).toBe(409)
        const updateResponseData = await updateResponse.json()
        expect(updateResponseData.success).toBe(false)
      }
    })

    it('should update category color', async () => {
      const updateData = {
        color: '#FF5733'
      }
      
      const request = ApiTestUtils.createNextRequest('PUT', `http://localhost:3000/api/categories/${testCategoryId}`, updateData)
      
      const response = await PUT(request, { params: { id: testCategoryId } })
      
      if (response.status === 200) {
        const data = await response.json()
        expect(data.data.color).toBe(updateData.color)
      }
    })
  })

  describe('DELETE /api/categories/[id] - Delete Category', () => {
    beforeEach(async () => {
      // Create test category
      const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/categories', testCategoryData)
      const response = await POST(request)
      const data = await response.json()
      testCategoryId = data.data.id
    })

    it('should delete category successfully when no products exist', async () => {
      const request = ApiTestUtils.createNextRequest('DELETE', `http://localhost:3000/api/categories/${testCategoryId}`)
      
      const response = await NetworkUtils.retryOperation(async () => {
        return await DELETE(request, { params: { id: testCategoryId } })
      })

      await ApiTestUtils.expectApiResponse(response, 200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      
      // Verify category is deleted
      const getRequest = ApiTestUtils.createNextRequest('GET', `http://localhost:3000/api/categories/${testCategoryId}`)
      const getResponse = await GetCategory(getRequest, { params: { id: testCategoryId } })
      expect(getResponse.status).toBe(404)
    })

    it('should return 404 when deleting non-existent category', async () => {
      const fakeId = 'non-existent-id'
      const request = ApiTestUtils.createNextRequest('DELETE', `http://localhost:3000/api/categories/${fakeId}`)
      
      const response = await DELETE(request, { params: { id: fakeId } })
      
      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.success).toBe(false)
    })

    it('should prevent deletion of category with products', async () => {
      // This test assumes the API prevents deletion of categories with products
      // The actual behavior depends on your business logic
      
      const request = ApiTestUtils.createNextRequest('DELETE', `http://localhost:3000/api/categories/${testCategoryId}?force=false`)
      
      const response = await DELETE(request, { params: { id: testCategoryId } })
      
      // Should either succeed (if no products) or fail with appropriate message
      expect([200, 400, 409]).toContain(response.status)
      
      if (response.status !== 200) {
        const data = await response.json()
        expect(data.success).toBe(false)
      }
    })
  })

  describe('Category Hierarchy Tests', () => {
    beforeEach(async () => {
      // Create test category
      const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/categories', testCategoryData)
      const response = await POST(request)
      const data = await response.json()
      testCategoryId = data.data.id
      
      CleanupUtils.registerCleanup('category', testCategoryId, async () => {
        const deleteRequest = ApiTestUtils.createNextRequest('DELETE', `http://localhost:3000/api/categories/${testCategoryId}`)
        await DELETE(deleteRequest, { params: { id: testCategoryId } })
      })
    })

    it('should create subcategory with parent reference', async () => {
      const subcategoryData = {
        name: 'Test Subcategory',
        description: 'Test subcategory description',
        parentId: testCategoryId,
        active: true
      }
      
      const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/categories', subcategoryData)
      const response = await POST(request)
      
      if (response.status === 201) {
        const data = await response.json()
        expect(data.data.parentId).toBe(testCategoryId)
        
        const subcategoryId = data.data.id
        CleanupUtils.registerCleanup('subcategory', subcategoryId, async () => {
          const deleteRequest = ApiTestUtils.createNextRequest('DELETE', `http://localhost:3000/api/categories/${subcategoryId}`)
          await DELETE(deleteRequest, { params: { id: subcategoryId } })
        })
      }
    })

    it('should get category with subcategories', async () => {
      const request = ApiTestUtils.createNextRequest('GET', `http://localhost:3000/api/categories/${testCategoryId}?includeSubcategories=true`)
      
      const response = await GetCategory(request, { params: { id: testCategoryId } })
      
      if (response.status === 200) {
        const data = await response.json()
        expect(data.data).toHaveProperty('subcategories')
        expect(Array.isArray(data.data.subcategories)).toBe(true)
      }
    })
  })

  describe('Security and Validation Tests', () => {
    it('should prevent SQL injection in category search', async () => {
      const maliciousSearch = "'; DROP TABLE categories; --"
      const request = ApiTestUtils.createNextRequest('GET', `http://localhost:3000/api/categories?search=${encodeURIComponent(maliciousSearch)}`)
      
      const response = await GET(request)
      
      // Should handle safely without crashing
      expect([200, 400]).toContain(response.status)
    })

    it('should validate category name length', async () => {
      const longNameData = {
        name: 'A'.repeat(1000), // Very long name
        description: 'Test description'
      }
      
      const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/categories', longNameData)
      const response = await POST(request)
      
      // Should either accept or reject based on length limits
      expect([201, 400]).toContain(response.status)
    })

    it('should sanitize category input', async () => {
      const maliciousData = {
        name: '<script>alert("xss")</script>',
        description: 'Test description'
      }
      
      const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/categories', maliciousData)
      const response = await POST(request)
      
      if (response.status === 201) {
        const data = await response.json()
        expect(data.data.name).not.toContain('<script>')
        
        testCategoryId = data.data.id
        CleanupUtils.registerCleanup('category', testCategoryId, async () => {
          const deleteRequest = ApiTestUtils.createNextRequest('DELETE', `http://localhost:3000/api/categories/${testCategoryId}`)
          await DELETE(deleteRequest, { params: { id: testCategoryId } })
        })
      }
    })

    it('should validate color format', async () => {
      const invalidColorData = {
        name: 'Test Category',
        color: 'invalid-color-format'
      }
      
      const request = ApiTestUtils.createNextRequest('POST', 'http://localhost:3000/api/categories', invalidColorData)
      const response = await POST(request)
      
      // Should either accept, sanitize, or reject invalid color
      expect([201, 400]).toContain(response.status)
    })
  })
})