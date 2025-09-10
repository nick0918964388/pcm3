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

    // Check if user has admin or PM role
    if (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.PM) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const scheduledAnnouncements = await announcementRepository.getScheduledAnnouncements();

    return NextResponse.json(scheduledAnnouncements);
  } catch (error) {
    console.error('Get scheduled announcements error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scheduled announcements' },
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

    // Check if user has admin or PM role
    if (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.PM) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get scheduled announcements that are ready to be published
    const scheduledAnnouncements = await announcementRepository.getScheduledAnnouncements();
    const publishedCount = { count: 0, announcements: [] as any[] };

    for (const announcement of scheduledAnnouncements) {
      try {
        const success = await announcementRepository.publishScheduledAnnouncement(announcement.id);
        if (success) {
          publishedCount.count++;
          publishedCount.announcements.push(announcement);
        }
      } catch (error) {
        console.error(`Failed to publish announcement ${announcement.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      publishedCount: publishedCount.count,
      publishedAnnouncements: publishedCount.announcements,
    });
  } catch (error) {
    console.error('Publish scheduled announcements error:', error);
    return NextResponse.json(
      { error: 'Failed to publish scheduled announcements' },
      { status: 500 }
    );
  }
}