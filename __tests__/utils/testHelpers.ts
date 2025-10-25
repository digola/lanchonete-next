import { NextRequest } from 'next/server'

// Security utilities for testing
export class TestSecurity {
  private static readonly SAFE_PATHS = [
    'test',
    '__tests__',
    'coverage',
    'node_modules',
    '.next',
    'build',
    'dist',
    'tmp',
    'temp',
    '/tmp',
    '/temp',
    '/var/tmp',
    'C:\\temp',
    'C:\\tmp'
  ]

  private static readonly DANGEROUS_PATHS = [
    '/etc',
    '/var',
    '/usr',
    '/bin',
    '/sbin',
    '/sys',
    '/proc',
    '/root',
    'C:\\Windows',
    'C:\\Program Files',
    'C:\\Users\\Administrator'
  ]

  static validatePath(path: string): boolean {
    const normalizedPath = path.toLowerCase()
    
    // Check for dangerous paths
    const isDangerousPath = this.DANGEROUS_PATHS.some(dangerousPath => 
      normalizedPath.includes(dangerousPath.toLowerCase())
    )
    
    if (isDangerousPath) {
      throw new Error(`SECURITY VIOLATION: Attempted to access dangerous path: ${path}`)
    }

    // Ensure path is in safe testing area
    const isSafePath = this.SAFE_PATHS.some(safePath => 
      normalizedPath.includes(safePath.toLowerCase())
    )

    if (!isSafePath) {
      console.warn(`Warning: Path may not be safe for testing: ${path}`)
    }

    return true
  }

  static sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      // Remove potentially dangerous characters
      return input.replace(/[<>\"'%;()&+]/g, '')
    }
    return input
  }
}

// Network resilience utilities
export class NetworkUtils {
  static async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 10000
  ): Promise<T> {
    let lastError: Error

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error
        
        if (attempt === maxRetries) {
          throw new Error(`Operation failed after ${maxRetries} attempts: ${lastError.message}`)
        }

        console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`)
        console.log(`Error: ${lastError.message}`)
        
        await this.delay(delay)
      }
    }

    throw lastError!
  }

  static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  static async waitForCondition(
    condition: () => boolean | Promise<boolean>,
    timeout: number = 30000,
    interval: number = 1000
  ): Promise<void> {
    const startTime = Date.now()
    
    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return
      }
      await this.delay(interval)
    }
    
    throw new Error(`Condition not met within ${timeout}ms`)
  }
}

// API testing utilities
export class ApiTestUtils {
  static createNextRequest(
    method: string = 'GET',
    url: string = '/',
    body?: any,
    options?: { headers?: Record<string, string> }
  ): NextRequest {
    const requestInit: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      }
    }

    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      requestInit.body = JSON.stringify(body)
    }

    return new NextRequest(url, requestInit)
  }

  static createNextRequest(
    method: string = 'GET',
    url: string = 'http://localhost:3000/',
    body?: any,
    headers?: Record<string, string>
  ): NextRequest {
    const init: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    }

    if (body && method !== 'GET') {
      init.body = JSON.stringify(body)
    }

    return new NextRequest(url, init)
  }

  static async expectApiResponse(
    response: Response,
    expectedStatus: number,
    expectedData?: any
  ) {
    expect(response.status).toBe(expectedStatus)
    
    if (expectedData) {
      const data = await response.json()
      expect(data).toMatchObject(expectedData)
    }
  }
}

// Database testing utilities
export class DatabaseTestUtils {
  static generateTestUser(overrides: Partial<any> = {}) {
    return {
      name: 'Test User',
      email: `test-${Date.now()}@example.com`,
      password: 'Test123!@#',
      role: 'customer',
      phone: '(11) 99999-9999',
      ...overrides
    }
  }

  static generateTestProduct(overrides: Partial<any> = {}) {
    return {
      name: 'Test Product',
      description: 'Test product description',
      price: 10.99,
      category: 'test-category',
      available: true,
      ...overrides
    }
  }

  static generateTestCategory(overrides: Partial<any> = {}) {
    return {
      name: 'Test Category',
      description: 'Test category description',
      active: true,
      ...overrides
    }
  }

  static generateTestOrder(overrides: Partial<any> = {}) {
    return {
      customerName: 'Test Customer',
      items: [
        {
          productId: 'test-product-id',
          quantity: 2,
          price: 10.99
        }
      ],
      total: 21.98,
      status: 'pending',
      ...overrides
    }
  }
}

// Test data cleanup utilities
export class CleanupUtils {
  private static createdResources: Array<{
    type: string
    id: string
    cleanup: () => Promise<void>
  }> = []

  static registerCleanup(type: string, id: string, cleanup: () => Promise<void>) {
    this.createdResources.push({ type, id, cleanup })
  }

  static async cleanupAll() {
    const errors: Error[] = []

    for (const resource of this.createdResources.reverse()) {
      try {
        await resource.cleanup()
        console.log(`Cleaned up ${resource.type}: ${resource.id}`)
      } catch (error) {
        errors.push(error as Error)
        console.error(`Failed to cleanup ${resource.type}: ${resource.id}`, error)
      }
    }

    this.createdResources = []

    if (errors.length > 0) {
      throw new Error(`Cleanup failed for ${errors.length} resources`)
    }
  }
}

// Export all utilities
export {
  TestSecurity,
  NetworkUtils,
  ApiTestUtils,
  DatabaseTestUtils,
  CleanupUtils
}