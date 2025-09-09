const nextJest = require('next/jest')

/** @type {import('jest').Config} */
const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@pcm/shared$': '<rootDir>/../../packages/shared/src',
  },
  testMatch: [
    '<rootDir>/__tests__/**/*.(test|spec).{js,jsx,ts,tsx}',
    '<rootDir>/app/**/*.(test|spec).{js,jsx,ts,tsx}',
    '<rootDir>/components/**/*.(test|spec).{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.(test|spec).{js,jsx,ts,tsx}',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/tests/integration/'
  ],
  collectCoverageFrom: [
    'app/**/*.{js,ts,jsx,tsx}',
    'components/**/*.{js,ts,jsx,tsx}',
    'lib/**/*.{js,ts,jsx,tsx}',
    'hooks/**/*.{js,ts,jsx,tsx}',
    'src/**/*.{js,ts,jsx,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(config)
