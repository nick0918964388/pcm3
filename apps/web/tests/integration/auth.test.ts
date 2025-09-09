import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'
import { userRepository } from '../../src/repositories/userRepository'

// Mock oracledb
jest.mock('oracledb', () => ({
  getConnection: jest.fn(),
  OUT_FORMAT_OBJECT: 'OBJECT'
}))

// Mock bcrypt
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn()
}))

describe('Authentication System', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('UserRepository', () => {
    describe('findByUsername', () => {
      it('should find user by username', async () => {
        const mockUser = {
          ID: 1,
          USERNAME: 'testuser',
          HASHED_PASSWORD: 'hashed123',
          FULL_NAME: 'Test User',
          EMAIL: 'test@example.com',
          CREATED_AT: new Date()
        }

        const mockConnection = {
          execute: jest.fn().mockResolvedValue({
            rows: [mockUser]
          }),
          close: jest.fn().mockResolvedValue(undefined)
        }

        const oracledb = require('oracledb')
        oracledb.getConnection.mockResolvedValue(mockConnection)

        const result = await userRepository.findByUsername('testuser')

        expect(result).toEqual({
          id: 1,
          username: 'testuser',
          hashedPassword: 'hashed123',
          fullName: 'Test User',
          email: 'test@example.com',
          createdAt: mockUser.CREATED_AT
        })

        expect(mockConnection.execute).toHaveBeenCalledWith(
          expect.stringContaining('SELECT id, username, hashed_password'),
          { username: 'testuser' },
          { outFormat: 'OBJECT' }
        )
        expect(mockConnection.close).toHaveBeenCalled()
      })

      it('should return null when user not found', async () => {
        const mockConnection = {
          execute: jest.fn().mockResolvedValue({
            rows: []
          }),
          close: jest.fn().mockResolvedValue(undefined)
        }

        const oracledb = require('oracledb')
        oracledb.getConnection.mockResolvedValue(mockConnection)

        const result = await userRepository.findByUsername('nonexistent')

        expect(result).toBeNull()
        expect(mockConnection.close).toHaveBeenCalled()
      })

      it('should handle database errors', async () => {
        const oracledb = require('oracledb')
        oracledb.getConnection.mockRejectedValue(new Error('DB Error'))

        await expect(userRepository.findByUsername('testuser'))
          .rejects
          .toThrow('Database connection failed')
      })
    })

    describe('validatePassword', () => {
      it('should validate correct password', async () => {
        const bcrypt = require('bcrypt')
        bcrypt.compare.mockResolvedValue(true)

        const result = await userRepository.validatePassword('password123', 'hashed123')

        expect(result).toBe(true)
        expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed123')
      })

      it('should reject incorrect password', async () => {
        const bcrypt = require('bcrypt')
        bcrypt.compare.mockResolvedValue(false)

        const result = await userRepository.validatePassword('wrongpassword', 'hashed123')

        expect(result).toBe(false)
      })

      it('should handle bcrypt errors gracefully', async () => {
        const bcrypt = require('bcrypt')
        bcrypt.compare.mockRejectedValue(new Error('Bcrypt error'))

        const result = await userRepository.validatePassword('password123', 'hashed123')

        expect(result).toBe(false)
      })
    })

    describe('getUserRoles', () => {
      it('should fetch user roles', async () => {
        const mockRoles = [
          { USER_ID: 1, ROLE_NAME: 'admin' },
          { USER_ID: 1, ROLE_NAME: 'user' }
        ]

        const mockConnection = {
          execute: jest.fn().mockResolvedValue({
            rows: mockRoles
          }),
          close: jest.fn().mockResolvedValue(undefined)
        }

        const oracledb = require('oracledb')
        oracledb.getConnection.mockResolvedValue(mockConnection)

        const result = await userRepository.getUserRoles(1)

        expect(result).toEqual([
          { userId: 1, roleName: 'admin' },
          { userId: 1, roleName: 'user' }
        ])

        expect(mockConnection.execute).toHaveBeenCalledWith(
          expect.stringContaining('SELECT ur.user_id, r.role_name'),
          { userId: 1 },
          { outFormat: 'OBJECT' }
        )
        expect(mockConnection.close).toHaveBeenCalled()
      })

      it('should return empty array when no roles found', async () => {
        const mockConnection = {
          execute: jest.fn().mockResolvedValue({
            rows: []
          }),
          close: jest.fn().mockResolvedValue(undefined)
        }

        const oracledb = require('oracledb')
        oracledb.getConnection.mockResolvedValue(mockConnection)

        const result = await userRepository.getUserRoles(1)

        expect(result).toEqual([])
      })
    })

    describe('hashPassword', () => {
      it('should hash password with correct salt rounds', async () => {
        const bcrypt = require('bcrypt')
        bcrypt.hash.mockResolvedValue('hashed_password_123')

        const result = await userRepository.hashPassword('plaintext123')

        expect(result).toBe('hashed_password_123')
        expect(bcrypt.hash).toHaveBeenCalledWith('plaintext123', 12)
      })

      it('should handle hash errors', async () => {
        const bcrypt = require('bcrypt')
        bcrypt.hash.mockRejectedValue(new Error('Hash error'))

        await expect(userRepository.hashPassword('plaintext123'))
          .rejects
          .toThrow('Failed to hash password')
      })
    })
  })
})