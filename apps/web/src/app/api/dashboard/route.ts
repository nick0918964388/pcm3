import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@/types/auth';
import { dashboardRepository } from '@/repositories/dashboardRepository';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');
    const role = searchParams.get('role') as UserRole;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Get role-specific widgets
    const widgets = await dashboardRepository.getWidgetsByRole(role || session.user.role, projectId);
    
    // Get recent announcements
    const announcements = await dashboardRepository.getRecentAnnouncements(projectId, 5);
    
    // Mark announcements as read for user
    if (announcements.length > 0) {
      await dashboardRepository.markAnnouncementsAsRead(
        announcements.map(a => a.id),
        session.user.id
      );
    }

    const dashboardData = {
      role: role || session.user.role,
      widgets,
      announcements,
      lastUpdated: new Date(),
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}