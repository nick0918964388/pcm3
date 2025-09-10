import { GET as getDashboard } from '@/app/api/dashboard/route';
import { GET as getSchedule } from '@/app/api/dashboard/pm/schedule/route';
import { GET as getDailyHours } from '@/app/api/dashboard/pm/daily-hours/route';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { UserRole } from '@/types/auth';

// Mock next-auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

// Mock database connection
jest.mock('@/lib/database', () => ({
  getConnection: jest.fn(() => ({
    execute: jest.fn(),
    close: jest.fn(),
    commit: jest.fn(),
  })),
}));

// Mock dashboard repository
jest.mock('@/repositories/dashboardRepository', () => ({
  dashboardRepository: {
    getWidgetsByRole: jest.fn(),
    getRecentAnnouncements: jest.fn(),
    markAnnouncementsAsRead: jest.fn(),
    saveDashboardConfig: jest.fn(),
    loadDashboardConfig: jest.fn(),
  },
}));

describe('Dashboard API Tests', () => {
  const mockSession = {
    user: {
      id: 'user123',
      email: 'pm@test.com',
      name: 'Test PM',
      role: UserRole.PM,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
  });

  describe('GET /api/dashboard', () => {
    it('should return dashboard data for authenticated user', async () => {
      const { dashboardRepository } = require('@/repositories/dashboardRepository');
      
      dashboardRepository.getWidgetsByRole.mockResolvedValue([
        {
          id: 'schedule-summary',
          type: 'chart',
          title: '時程摘要',
          data: { labels: [], datasets: [] },
          config: {},
        },
      ]);

      dashboardRepository.getRecentAnnouncements.mockResolvedValue([
        {
          id: 'ann1',
          title: 'Test Announcement',
          content: 'Test content',
          priority: 'high',
          createdAt: new Date(),
          author: 'Admin',
        },
      ]);

      const request = new NextRequest(
        'http://localhost:3000/api/dashboard?projectId=proj123&role=PM'
      );

      const response = await getDashboard(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('role', UserRole.PM);
      expect(data).toHaveProperty('widgets');
      expect(data).toHaveProperty('announcements');
      expect(data).toHaveProperty('lastUpdated');
    });

    it('should return 401 for unauthenticated request', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest(
        'http://localhost:3000/api/dashboard?projectId=proj123'
      );

      const response = await getDashboard(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toHaveProperty('error', 'Unauthorized');
    });

    it('should return 400 if projectId is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/dashboard');

      const response = await getDashboard(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error', 'Project ID is required');
    });
  });

  describe('GET /api/dashboard/pm/schedule', () => {
    it('should return schedule data for PM', async () => {
      const { getConnection } = require('@/lib/database');
      const mockConnection = {
        execute: jest.fn().mockResolvedValue({
          rows: [
            {
              WBS_CODE: '1.0',
              NAME: 'Task 1',
              START_DATE: new Date('2025-01-01'),
              END_DATE: new Date('2025-01-31'),
              PROGRESS: 50,
              STATUS: 'In Progress',
              SUBTASK_COUNT: 3,
              COMPLETED_SUBTASKS: 1,
            },
          ],
        }),
        close: jest.fn(),
      };
      getConnection.mockResolvedValue(mockConnection);

      const request = new NextRequest(
        'http://localhost:3000/api/dashboard/pm/schedule?projectId=proj123'
      );

      const response = await getSchedule(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data[0]).toHaveProperty('wbsCode', '1.0');
      expect(data[0]).toHaveProperty('progress', 50);
    });
  });

  describe('GET /api/dashboard/pm/daily-hours', () => {
    it('should return daily hours data', async () => {
      const { getConnection } = require('@/lib/database');
      const mockConnection = {
        execute: jest.fn().mockResolvedValue({
          rows: [
            {
              DATE: '2025-01-10',
              DAY_NAME: 'FRI',
              PERSONNEL_COUNT: 10,
              TOTAL_HOURS: 80,
              AVG_HOURS: 8,
            },
          ],
        }),
        close: jest.fn(),
      };
      getConnection.mockResolvedValue(mockConnection);

      const request = new NextRequest(
        'http://localhost:3000/api/dashboard/pm/daily-hours?projectId=proj123&days=7'
      );

      const response = await getDailyHours(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data[0]).toHaveProperty('date', '2025-01-10');
      expect(data[0]).toHaveProperty('totalHours', 80);
    });

    it('should default to 7 days if days parameter not provided', async () => {
      const { getConnection } = require('@/lib/database');
      const mockConnection = {
        execute: jest.fn().mockResolvedValue({ rows: [] }),
        close: jest.fn(),
      };
      getConnection.mockResolvedValue(mockConnection);

      const request = new NextRequest(
        'http://localhost:3000/api/dashboard/pm/daily-hours?projectId=proj123'
      );

      await getDailyHours(request);

      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ days: 7 })
      );
    });
  });
});