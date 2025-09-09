/** @type {import('jest').Config} */
const config = {
  projects: [
    {
      displayName: 'web-app',
      testMatch: ['<rootDir>/apps/web/__tests__/**/*.(test|spec).{js,jsx,ts,tsx}'],
      setupFilesAfterEnv: ['<rootDir>/apps/web/jest.setup.js'],
      testEnvironment: 'jsdom',
      moduleNameMapping: {
        '^@/(.*)$': '<rootDir>/apps/web/$1',
        '^@pcm/shared$': '<rootDir>/packages/shared/src',
      },
    },
    {
      displayName: 'infrastructure',
      testMatch: ['<rootDir>/__tests__/**/*.(test|spec).{js,ts}'],
      testEnvironment: 'node',
    },
  ],
  collectCoverageFrom: [
    'apps/web/app/**/*.{js,ts,jsx,tsx}',
    'apps/web/components/**/*.{js,ts,jsx,tsx}',
    'apps/web/lib/**/*.{js,ts,jsx,tsx}',
    'apps/web/hooks/**/*.{js,ts,jsx,tsx}',
    'packages/shared/src/**/*.{js,ts}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
}

module.exports = config