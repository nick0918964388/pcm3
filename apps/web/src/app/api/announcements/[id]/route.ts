import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { announcementRepository } from '@/repositories/announcementRepository';
import { UserRole } from '@/types/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const announcement = await announcementRepository.getAnnouncementById(
      params.id,
      session.user.id
    );

    if (!announcement) {
      return NextResponse.json(
        { error: 'Announcement not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(announcement);
  } catch (error) {
    console.error('Get announcement error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch announcement' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin or PM role or is the creator
    if (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.PM) {
      // Check if user is the creator
      const announcement = await announcementRepository.getAnnouncementById(params.id);
      if (!announcement || announcement.createdBy !== session.user.id) {
        return NextResponse.json(
          { error: 'Insufficient permissions to update this announcement' },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const { title, content, priority, scheduledAt, expiresAt, isActive } = body;

    const success = await announcementRepository.updateAnnouncement(params.id, {
      title,
      content,
      priority,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      isActive,
    });

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update announcement' },
        { status: 400 }
      );
    }

    const updatedAnnouncement = await announcementRepository.getAnnouncementById(
      params.id,
      session.user.id
    );

    return NextResponse.json(updatedAnnouncement);
  } catch (error) {
    console.error('Update announcement error:', error);
    return NextResponse.json(
      { error: 'Failed to update announcement' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin role or is the creator
    if (session.user.role !== UserRole.ADMIN) {
      // Check if user is the creator
      const announcement = await announcementRepository.getAnnouncementById(params.id);
      if (!announcement || announcement.createdBy !== session.user.id) {
        return NextResponse.json(
          { error: 'Insufficient permissions to delete this announcement' },
          { status: 403 }
        );
      }
    }

    const success = await announcementRepository.deleteAnnouncement(params.id);

    if (!success) {
      return NextResponse.json(
        { error: 'Announcement not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete announcement error:', error);
    return NextResponse.json(
      { error: 'Failed to delete announcement' },
      { status: 500 }
    );
  }
}