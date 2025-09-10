import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { announcementRepository } from '@/repositories/announcementRepository';
import { UserRole } from '@/types/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');
    const includeRead = searchParams.get('includeRead') === 'true';
    const priority = searchParams.get('priority') as 'high' | 'normal' | 'low' | null;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;
    const search = searchParams.get('search');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    let announcements;

    if (search) {
      // Search functionality
      const filters: any = {};
      if (priority) filters.priority = priority;
      
      announcements = await announcementRepository.searchAnnouncements(
        projectId,
        search,
        filters
      );
    } else {
      // Regular listing
      announcements = await announcementRepository.getAnnouncements(
        projectId,
        session.user.id,
        {
          includeRead,
          priority: priority || undefined,
          limit,
          offset,
        }
      );
    }

    return NextResponse.json(announcements);
  } catch (error) {
    console.error('Get announcements error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch announcements' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin or PM role for creating announcements
    if (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.PM) {
      return NextResponse.json(
        { error: 'Insufficient permissions to create announcements' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { projectId, title, content, priority, scheduledAt, expiresAt } = body;

    if (!projectId || !title || !content) {
      return NextResponse.json(
        { error: 'Project ID, title, and content are required' },
        { status: 400 }
      );
    }

    const announcementId = await announcementRepository.createAnnouncement({
      projectId,
      title,
      content,
      createdBy: session.user.id,
      priority: priority || 'normal',
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });

    const announcement = await announcementRepository.getAnnouncementById(
      announcementId,
      session.user.id
    );

    return NextResponse.json(announcement, { status: 201 });
  } catch (error) {
    console.error('Create announcement error:', error);
    return NextResponse.json(
      { error: 'Failed to create announcement' },
      { status: 500 }
    );
  }
}