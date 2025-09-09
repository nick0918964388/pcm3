/**
 * Basic setup test to verify Jest configuration
 */
describe('Project Setup', () => {
  it('should have Jest configured correctly', () => {
    expect(true).toBe(true)
  })

  it('should have access to shared package types', () => {
    // This test verifies that the monorepo structure allows importing from shared package
    expect(() => {
      const { UserRole } = require('@pcm/shared')
      return UserRole
    }).not.toThrow()
  })
})