import { GET as getAnnouncements, POST as createAnnouncement } from '@/app/api/announcements/route';
import { GET as getAnnouncement, PUT as updateAnnouncement, DELETE as deleteAnnouncement } from '@/app/api/announcements/[id]/route';
import { POST as markAsRead } from '@/app/api/announcements/[id]/read/route';
import { GET as getStats } from '@/app/api/announcements/[id]/stats/route';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { UserRole } from '@/types/auth';

// Mock next-auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

// Mock announcement repository
jest.mock('@/repositories/announcementRepository', () => ({
  announcementRepository: {
    getAnnouncements: jest.fn(),
    getAnnouncementById: jest.fn(),
    createAnnouncement: jest.fn(),
    updateAnnouncement: jest.fn(),
    deleteAnnouncement: jest.fn(),
    markAsRead: jest.fn(),
    getAnnouncementStats: jest.fn(),
    searchAnnouncements: jest.fn(),
  },
}));

describe('Announcement API Tests', () => {
  const mockSession = {
    user: {
      id: 'user123',
      email: 'admin@test.com',
      name: 'Test Admin',
      role: UserRole.ADMIN,
    },
  };

  const mockAnnouncement = {
    id: '1',
    projectId: 'proj123',
    title: 'Test Announcement',
    content: 'This is a test announcement',
    createdBy: 'user123',
    createdByName: 'Test Admin',
    isActive: true,
    priority: 'high',
    scheduledAt: null,
    publishedAt: new Date(),
    expiresAt: null,
    createdAt: new Date(),
    isRead: false,
    readCount: 0,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
  });

  describe('GET /api/announcements', () => {
    it('should return announcements for authenticated user', async () => {
      const { announcementRepository } = require('@/repositories/announcementRepository');
      announcementRepository.getAnnouncements.mockResolvedValue([mockAnnouncement]);

      const request = new NextRequest(
        'http://localhost:3000/api/announcements?projectId=proj123'
      );

      const response = await getAnnouncements(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data[0]).toMatchObject({
        id: '1',
        title: 'Test Announcement',
        priority: 'high',
      });
    });

    it('should return 401 for unauthenticated request', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest(
        'http://localhost:3000/api/announcements?projectId=proj123'
      );

      const response = await getAnnouncements(request);
      expect(response.status).toBe(401);
    });

    it('should return 400 if projectId is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/announcements');

      const response = await getAnnouncements(request);
      expect(response.status).toBe(400);
    });

    it('should support search functionality', async () => {
      const { announcementRepository } = require('@/repositories/announcementRepository');
      announcementRepository.searchAnnouncements.mockResolvedValue([mockAnnouncement]);

      const request = new NextRequest(
        'http://localhost:3000/api/announcements?projectId=proj123&search=test'
      );

      const response = await getAnnouncements(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(announcementRepository.searchAnnouncements).toHaveBeenCalledWith(
        'proj123',
        'test',
        {}
      );
    });
  });

  describe('POST /api/announcements', () => {
    it('should create announcement for admin user', async () => {
      const { announcementRepository } = require('@/repositories/announcementRepository');
      announcementRepository.createAnnouncement.mockResolvedValue('1');
      announcementRepository.getAnnouncementById.mockResolvedValue(mockAnnouncement);

      const request = new NextRequest('http://localhost:3000/api/announcements', {
        method: 'POST',
        body: JSON.stringify({
          projectId: 'proj123',
          title: 'Test Announcement',
          content: 'This is a test',
          priority: 'high',
        }),
      });

      const response = await createAnnouncement(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.id).toBe('1');
    });

    it('should return 403 for non-admin user', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        ...mockSession,
        user: { ...mockSession.user, role: UserRole.USER },
      });

      const request = new NextRequest('http://localhost:3000/api/announcements', {
        method: 'POST',
        body: JSON.stringify({
          projectId: 'proj123',
          title: 'Test',
          content: 'Test content',
        }),
      });

      const response = await createAnnouncement(request);
      expect(response.status).toBe(403);
    });

    it('should return 400 for missing required fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/announcements', {
        method: 'POST',
        body: JSON.stringify({
          projectId: 'proj123',
          // Missing title and content
        }),
      });

      const response = await createAnnouncement(request);
      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/announcements/[id]', () => {
    it('should return announcement by id', async () => {
      const { announcementRepository } = require('@/repositories/announcementRepository');
      announcementRepository.getAnnouncementById.mockResolvedValue(mockAnnouncement);

      const response = await getAnnouncement(
        {} as NextRequest,
        { params: { id: '1' } }
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe('1');
    });

    it('should return 404 for non-existent announcement', async () => {
      const { announcementRepository } = require('@/repositories/announcementRepository');
      announcementRepository.getAnnouncementById.mockResolvedValue(null);

      const response = await getAnnouncement(
        {} as NextRequest,
        { params: { id: '999' } }
      );

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/announcements/[id]/read', () => {
    it('should mark announcement as read', async () => {
      const { announcementRepository } = require('@/repositories/announcementRepository');
      announcementRepository.getAnnouncementById.mockResolvedValue(mockAnnouncement);
      announcementRepository.markAsRead.mockResolvedValue();

      const response = await markAsRead(
        {} as NextRequest,
        { params: { id: '1' } }
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(announcementRepository.markAsRead).toHaveBeenCalledWith('1', 'user123');
    });

    it('should return 404 for non-existent announcement', async () => {
      const { announcementRepository } = require('@/repositories/announcementRepository');
      announcementRepository.getAnnouncementById.mockResolvedValue(null);

      const response = await markAsRead(
        {} as NextRequest,
        { params: { id: '999' } }
      );

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/announcements/[id]/stats', () => {
    it('should return announcement statistics for admin', async () => {
      const { announcementRepository } = require('@/repositories/announcementRepository');
      const mockStats = {
        totalReaders: 10,
        readCount: 7,
        readPercentage: 70,
        recentReaders: [],
      };
      
      announcementRepository.getAnnouncementStats.mockResolvedValue(mockStats);

      const response = await getStats(
        {} as NextRequest,
        { params: { id: '1' } }
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.readPercentage).toBe(70);
    });

    it('should return 403 for non-admin user without creator permission', async () => {
      const { announcementRepository } = require('@/repositories/announcementRepository');
      
      (getServerSession as jest.Mock).mockResolvedValue({
        ...mockSession,
        user: { ...mockSession.user, role: UserRole.USER, id: 'other-user' },
      });

      announcementRepository.getAnnouncementById.mockResolvedValue({
        ...mockAnnouncement,
        createdBy: 'user123', // Different from logged in user
      });

      const response = await getStats(
        {} as NextRequest,
        { params: { id: '1' } }
      );

      expect(response.status).toBe(403);
    });
  });
});