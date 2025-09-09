// Test setup file
process.env.NODE_ENV = 'test'
process.env.NEXTAUTH_URL = 'http://localhost:3000'
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.DB_USER = 'test_user'
process.env.DB_PASSWORD = 'test_password'
process.env.DB_CONNECT_STRING = 'localhost:1521/XE'