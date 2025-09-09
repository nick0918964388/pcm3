// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Load environment variables for testing
require('dotenv').config({ path: '.env.test' })

// Mock console.log for cleaner test output
global.console = {
  ...console,
  // Uncomment to ignore specific log outputs
  // log: jest.fn(),
}