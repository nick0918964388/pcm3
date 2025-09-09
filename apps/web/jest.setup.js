import '@testing-library/jest-dom'

// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Load environment variables for testing
require('dotenv').config({ path: '.env.test' })

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}

  disconnect() {
    return null
  }

  observe() {
    return null
  }

  unobserve() {
    return null
  }
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}

  disconnect() {
    return null
  }

  observe() {
    return null
  }

  unobserve() {
    return null
  }
}

// Mock console.log for cleaner test output
global.console = {
  ...console,
  // Uncomment to ignore specific log outputs
  // log: jest.fn(),
}