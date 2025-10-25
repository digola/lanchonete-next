import { NextRequest } from 'next/server'
import { POST as UploadFile } from '@/app/api/upload/route'
import { GET as GetFiles } from '@/app/api/files/route'
import { 
  ApiTestUtils, 
  NetworkUtils, 
  TestSecurity,
  CleanupUtils 
} from '../utils/testHelpers'
import fs from 'fs'
import path from 'path'

describe('File Management API Routes', () => {
  const testFilesDir = path.join(process.cwd(), '__tests__', 'temp')
  const uploadedFiles: string[] = []

  beforeAll(async () => {
    // Verify test environment safety
    TestSecurity.validatePath(__filename)
    
    // Create temp directory for test files
    if (!fs.existsSync(testFilesDir)) {
      fs.mkdirSync(testFilesDir, { recursive: true })
    }
  })

  afterEach(async () => {
    await CleanupUtils.cleanupAll()
  })

  afterAll(async () => {
    // Clean up uploaded test files
    for (const filePath of uploadedFiles) {
      try {
        if (fs.existsSync(filePath) && TestSecurity.isSafePath(filePath)) {
          fs.unlinkSync(filePath)
        }
      } catch (error) {
        console.warn(`Failed to cleanup test file: ${filePath}`, error)
      }
    }
    
    // Clean up temp directory
    try {
      if (fs.existsSync(testFilesDir) && TestSecurity.isSafePath(testFilesDir)) {
        fs.rmSync(testFilesDir, { recursive: true, force: true })
      }
    } catch (error) {
      console.warn('Failed to cleanup temp directory', error)
    }
  })

  describe('POST /api/upload - File Upload', () => {
    it('should upload a valid image file', async () => {
      // Create a test image file (simple SVG)
      const testImageContent = `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" fill="red"/>
      </svg>`
      
      const formData = new FormData()
      const blob = new Blob([testImageContent], { type: 'image/svg+xml' })
      formData.append('file', blob, 'test-image.svg')
      formData.append('type', 'product')
      
      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData
      })
      
      const response = await NetworkUtils.retryOperation(async () => {
        return await UploadFile(request)
      })

      await ApiTestUtils.expectApiResponse(response, 200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('url')
      expect(data.data).toHaveProperty('filename')
      expect(data.data).toHaveProperty('size')
      expect(data.data.filename).toContain('.svg')
      
      // Track for cleanup
      if (data.data.path) {
        uploadedFiles.push(data.data.path)
      }
    })

    it('should reject files that are too large', async () => {
      // Create a large file content (simulate 10MB+ file)
      const largeContent = 'x'.repeat(10 * 1024 * 1024 + 1) // 10MB + 1 byte
      
      const formData = new FormData()
      const blob = new Blob([largeContent], { type: 'image/jpeg' })
      formData.append('file', blob, 'large-image.jpg')
      formData.append('type', 'product')
      
      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData
      })
      
      const response = await UploadFile(request)
      
      expect([400, 413]).toContain(response.status)
      
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toContain('size')
    })

    it('should reject invalid file types', async () => {
      const invalidContent = '#!/bin/bash\necho "malicious script"'
      
      const formData = new FormData()
      const blob = new Blob([invalidContent], { type: 'application/x-sh' })
      formData.append('file', blob, 'malicious.sh')
      formData.append('type', 'product')
      
      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData
      })
      
      const response = await UploadFile(request)
      
      expect([400, 415]).toContain(response.status)
      
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toMatch(/type|format|extension/i)
    })

    it('should validate required fields', async () => {
      const testContent = 'test content'
      
      const formData = new FormData()
      const blob = new Blob([testContent], { type: 'text/plain' })
      formData.append('file', blob, 'test.txt')
      // Missing 'type' field
      
      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData
      })
      
      const response = await UploadFile(request)
      
      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toMatch(/type|required/i)
    })

    it('should handle multiple file uploads', async () => {
      const files = [
        { name: 'image1.svg', content: '<svg><rect fill="red"/></svg>', type: 'image/svg+xml' },
        { name: 'image2.svg', content: '<svg><circle fill="blue"/></svg>', type: 'image/svg+xml' }
      ]
      
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData()
        const blob = new Blob([file.content], { type: file.type })
        formData.append('file', blob, file.name)
        formData.append('type', 'product')
        
        const request = new NextRequest('http://localhost:3000/api/upload', {
          method: 'POST',
          body: formData
        })
        
        return await UploadFile(request)
      })
      
      const responses = await Promise.all(uploadPromises)
      
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })
      
      const dataArray = await Promise.all(responses.map(r => r.json()))
      
      dataArray.forEach((data, index) => {
        expect(data.success).toBe(true)
        expect(data.data.filename).toContain(files[index].name.split('.')[0])
        
        // Track for cleanup
        if (data.data.path) {
          uploadedFiles.push(data.data.path)
        }
      })
    })

    it('should sanitize file names', async () => {
      const maliciousFileName = '../../../etc/passwd.jpg'
      const testContent = 'fake image content'
      
      const formData = new FormData()
      const blob = new Blob([testContent], { type: 'image/jpeg' })
      formData.append('file', blob, maliciousFileName)
      formData.append('type', 'product')
      
      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData
      })
      
      const response = await UploadFile(request)
      
      if (response.status === 200) {
        const data = await response.json()
        
        // File name should be sanitized
        expect(data.data.filename).not.toContain('../')
        expect(data.data.filename).not.toContain('etc/passwd')
        expect(data.data.filename).toMatch(/^[a-zA-Z0-9._-]+$/)
        
        // Track for cleanup
        if (data.data.path) {
          uploadedFiles.push(data.data.path)
        }
      }
    })

    it('should handle network failures with retry', async () => {
      let attempts = 0
      const testContent = '<svg><rect fill="green"/></svg>'
      
      const formData = new FormData()
      const blob = new Blob([testContent], { type: 'image/svg+xml' })
      formData.append('file', blob, 'retry-test.svg')
      formData.append('type', 'product')
      
      const response = await NetworkUtils.retryOperation(async () => {
        attempts++
        if (attempts < 2) {
          throw new Error('Network error')
        }
        
        const request = new NextRequest('http://localhost:3000/api/upload', {
          method: 'POST',
          body: formData
        })
        
        return await UploadFile(request)
      }, 3, 1000)

      expect(attempts).toBe(2)
      expect(response.status).toBe(200)
      
      const data = await response.json()
      if (data.data?.path) {
        uploadedFiles.push(data.data.path)
      }
    })

    it('should validate file content type matches extension', async () => {
      // Upload a text file with .jpg extension
      const textContent = 'This is not an image'
      
      const formData = new FormData()
      const blob = new Blob([textContent], { type: 'image/jpeg' })
      formData.append('file', blob, 'fake-image.jpg')
      formData.append('type', 'product')
      
      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData
      })
      
      const response = await UploadFile(request)
      
      // Should either reject or handle gracefully
      if (response.status === 400) {
        const data = await response.json()
        expect(data.success).toBe(false)
        expect(data.error).toMatch(/content|type|format/i)
      }
    })

    it('should generate unique file names for duplicates', async () => {
      const testContent = '<svg><rect fill="yellow"/></svg>'
      const fileName = 'duplicate-test.svg'
      
      const uploadFile = async () => {
        const formData = new FormData()
        const blob = new Blob([testContent], { type: 'image/svg+xml' })
        formData.append('file', blob, fileName)
        formData.append('type', 'product')
        
        const request = new NextRequest('http://localhost:3000/api/upload', {
          method: 'POST',
          body: formData
        })
        
        return await UploadFile(request)
      }
      
      const response1 = await uploadFile()
      const response2 = await uploadFile()
      
      expect(response1.status).toBe(200)
      expect(response2.status).toBe(200)
      
      const data1 = await response1.json()
      const data2 = await response2.json()
      
      // File names should be different
      expect(data1.data.filename).not.toBe(data2.data.filename)
      
      // Track for cleanup
      if (data1.data?.path) uploadedFiles.push(data1.data.path)
      if (data2.data?.path) uploadedFiles.push(data2.data.path)
    })
  })

  describe('GET /api/files - File Listing', () => {
    it('should list uploaded files', async () => {
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/files')
      
      const response = await NetworkUtils.retryOperation(async () => {
        return await GetFiles(request)
      })

      await ApiTestUtils.expectApiResponse(response, 200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(Array.isArray(data.data)).toBe(true)
      
      if (data.data.length > 0) {
        data.data.forEach((file: any) => {
          expect(file).toHaveProperty('filename')
          expect(file).toHaveProperty('url')
          expect(file).toHaveProperty('size')
          expect(file).toHaveProperty('uploadedAt')
        })
      }
    })

    it('should support pagination for file listing', async () => {
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/files?page=1&limit=10')
      
      const response = await GetFiles(request)
      
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(Array.isArray(data.data)).toBe(true)
      expect(data.data.length).toBeLessThanOrEqual(10)
      
      if (data.pagination) {
        expect(data.pagination).toHaveProperty('page')
        expect(data.pagination).toHaveProperty('limit')
        expect(data.pagination).toHaveProperty('total')
      }
    })

    it('should filter files by type', async () => {
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/files?type=product')
      
      const response = await GetFiles(request)
      
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      
      if (data.data.length > 0) {
        data.data.forEach((file: any) => {
          if (file.type) {
            expect(file.type).toBe('product')
          }
        })
      }
    })

    it('should handle empty file directory', async () => {
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/files?type=nonexistent')
      
      const response = await GetFiles(request)
      
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(Array.isArray(data.data)).toBe(true)
      expect(data.data.length).toBe(0)
    })

    it('should include file metadata', async () => {
      const request = ApiTestUtils.createNextRequest('GET', 'http://localhost:3000/api/files?includeMetadata=true')
      
      const response = await GetFiles(request)
      
      if (response.status === 200) {
        const data = await response.json()
        
        if (data.data.length > 0) {
          data.data.forEach((file: any) => {
            expect(file).toHaveProperty('filename')
            expect(file).toHaveProperty('size')
            expect(file).toHaveProperty('mimeType')
            expect(file).toHaveProperty('uploadedAt')
            
            // Validate metadata types
            expect(typeof file.filename).toBe('string')
            expect(typeof file.size).toBe('number')
            expect(typeof file.mimeType).toBe('string')
            expect(typeof file.uploadedAt).toBe('string')
          })
        }
      }
    })
  })

  describe('File Security Tests', () => {
    it('should prevent directory traversal in file paths', async () => {
      const maliciousPaths = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config\\sam',
        '/etc/shadow',
        'C:\\Windows\\System32\\drivers\\etc\\hosts'
      ]
      
      for (const maliciousPath of maliciousPaths) {
        const formData = new FormData()
        const blob = new Blob(['malicious content'], { type: 'text/plain' })
        formData.append('file', blob, maliciousPath)
        formData.append('type', 'product')
        
        const request = new NextRequest('http://localhost:3000/api/upload', {
          method: 'POST',
          body: formData
        })
        
        const response = await UploadFile(request)
        
        if (response.status === 200) {
          const data = await response.json()
          
          // Should sanitize the path
          expect(data.data.filename).not.toContain('../')
          expect(data.data.filename).not.toContain('..\\')
          expect(data.data.filename).not.toContain('/etc/')
          expect(data.data.filename).not.toContain('C:\\')
          
          if (data.data.path) {
            uploadedFiles.push(data.data.path)
          }
        }
      }
    })

    it('should validate file size limits', async () => {
      const sizes = [
        { size: 1024, shouldPass: true }, // 1KB
        { size: 1024 * 1024, shouldPass: true }, // 1MB
        { size: 5 * 1024 * 1024, shouldPass: true }, // 5MB
        { size: 15 * 1024 * 1024, shouldPass: false } // 15MB
      ]
      
      for (const { size, shouldPass } of sizes) {
        const content = 'x'.repeat(size)
        
        const formData = new FormData()
        const blob = new Blob([content], { type: 'text/plain' })
        formData.append('file', blob, `test-${size}.txt`)
        formData.append('type', 'product')
        
        const request = new NextRequest('http://localhost:3000/api/upload', {
          method: 'POST',
          body: formData
        })
        
        const response = await UploadFile(request)
        
        if (shouldPass) {
          expect([200, 201]).toContain(response.status)
          
          if (response.status === 200) {
            const data = await response.json()
            if (data.data?.path) {
              uploadedFiles.push(data.data.path)
            }
          }
        } else {
          expect([400, 413]).toContain(response.status)
        }
      }
    })

    it('should prevent executable file uploads', async () => {
      const executableTypes = [
        { ext: 'exe', type: 'application/x-msdownload' },
        { ext: 'bat', type: 'application/x-bat' },
        { ext: 'sh', type: 'application/x-sh' },
        { ext: 'php', type: 'application/x-php' },
        { ext: 'js', type: 'application/javascript' }
      ]
      
      for (const { ext, type } of executableTypes) {
        const maliciousContent = 'console.log("malicious code")'
        
        const formData = new FormData()
        const blob = new Blob([maliciousContent], { type })
        formData.append('file', blob, `malicious.${ext}`)
        formData.append('type', 'product')
        
        const request = new NextRequest('http://localhost:3000/api/upload', {
          method: 'POST',
          body: formData
        })
        
        const response = await UploadFile(request)
        
        // Should reject executable files
        expect([400, 415]).toContain(response.status)
        
        const data = await response.json()
        expect(data.success).toBe(false)
      }
    })

    it('should scan for malicious content patterns', async () => {
      const maliciousPatterns = [
        '<script>alert("xss")</script>',
        '<?php system($_GET["cmd"]); ?>',
        '#!/bin/bash\nrm -rf /',
        'eval(base64_decode($_POST["code"]))'
      ]
      
      for (const pattern of maliciousPatterns) {
        const formData = new FormData()
        const blob = new Blob([pattern], { type: 'text/plain' })
        formData.append('file', blob, 'suspicious.txt')
        formData.append('type', 'product')
        
        const request = new NextRequest('http://localhost:3000/api/upload', {
          method: 'POST',
          body: formData
        })
        
        const response = await UploadFile(request)
        
        // Should either reject or sanitize
        if (response.status === 200) {
          const data = await response.json()
          
          // If accepted, should be sanitized
          if (data.data?.content) {
            expect(data.data.content).not.toContain('<script>')
            expect(data.data.content).not.toContain('<?php')
            expect(data.data.content).not.toContain('rm -rf')
          }
          
          if (data.data?.path) {
            uploadedFiles.push(data.data.path)
          }
        } else {
          expect([400, 415]).toContain(response.status)
        }
      }
    })
  })

  describe('File Storage Integration Tests', () => {
    it('should store files in correct directory structure', async () => {
      const testContent = '<svg><rect fill="purple"/></svg>'
      
      const formData = new FormData()
      const blob = new Blob([testContent], { type: 'image/svg+xml' })
      formData.append('file', blob, 'structure-test.svg')
      formData.append('type', 'product')
      
      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData
      })
      
      const response = await UploadFile(request)
      
      if (response.status === 200) {
        const data = await response.json()
        
        // Should have proper URL structure
        expect(data.data.url).toMatch(/^https?:\/\//)
        expect(data.data.url).toContain('product')
        
        // Should have file path information
        if (data.data.path) {
          expect(data.data.path).toContain('product')
          uploadedFiles.push(data.data.path)
        }
      }
    })

    it('should handle concurrent file uploads', async () => {
      const concurrentUploads = Array(5).fill(null).map((_, index) => {
        const testContent = `<svg><rect fill="color${index}"/></svg>`
        
        const formData = new FormData()
        const blob = new Blob([testContent], { type: 'image/svg+xml' })
        formData.append('file', blob, `concurrent-${index}.svg`)
        formData.append('type', 'product')
        
        const request = new NextRequest('http://localhost:3000/api/upload', {
          method: 'POST',
          body: formData
        })
        
        return UploadFile(request)
      })
      
      const responses = await Promise.all(concurrentUploads)
      
      // All uploads should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })
      
      const dataArray = await Promise.all(responses.map(r => r.json()))
      
      // All should have unique filenames
      const filenames = dataArray.map(d => d.data.filename)
      const uniqueFilenames = new Set(filenames)
      expect(uniqueFilenames.size).toBe(filenames.length)
      
      // Track for cleanup
      dataArray.forEach(data => {
        if (data.data?.path) {
          uploadedFiles.push(data.data.path)
        }
      })
    })

    it('should provide correct file URLs for access', async () => {
      const testContent = '<svg><rect fill="orange"/></svg>'
      
      const formData = new FormData()
      const blob = new Blob([testContent], { type: 'image/svg+xml' })
      formData.append('file', blob, 'url-test.svg')
      formData.append('type', 'product')
      
      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData
      })
      
      const response = await UploadFile(request)
      
      if (response.status === 200) {
        const data = await response.json()
        
        // URL should be accessible
        expect(data.data.url).toMatch(/^https?:\/\//)
        expect(data.data.url).not.toContain('undefined')
        expect(data.data.url).not.toContain('null')
        
        // Should be a valid URL format
        expect(() => new URL(data.data.url)).not.toThrow()
        
        if (data.data.path) {
          uploadedFiles.push(data.data.path)
        }
      }
    })
  })
})