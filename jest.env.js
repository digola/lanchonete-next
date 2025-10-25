// Test environment variables
process.env.NODE_ENV = 'test'
process.env.NEXTAUTH_SECRET = 'test-secret-key-for-testing-only'
process.env.NEXTAUTH_URL = 'http://localhost:3000'

// Test database configuration
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/lanchonete_test'
process.env.DIRECT_URL = process.env.TEST_DIRECT_URL || 'postgresql://test:test@localhost:5432/lanchonete_test'

// Supabase test configuration
process.env.SUPABASE_URL = process.env.TEST_SUPABASE_URL || 'https://test.supabase.co'
process.env.SUPABASE_ANON_KEY = process.env.TEST_SUPABASE_ANON_KEY || 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.TEST_SUPABASE_SERVICE_ROLE_KEY || 'test-service-role-key'

// JWT configuration for tests
process.env.JWT_SECRET = 'test-jwt-secret-key'
process.env.JWT_EXPIRES_IN = '1h'

// Disable external services in tests
process.env.DISABLE_EXTERNAL_SERVICES = 'true'

// Test-specific settings
process.env.TEST_TIMEOUT = '30000'
process.env.RETRY_ATTEMPTS = '3'
process.env.RETRY_DELAY = '10000'