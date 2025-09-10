import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { announcementRepository } from '@/repositories/announcementRepository';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if announcement exists
    const announcement = await announcementRepository.getAnnouncementById(params.id);
    if (!announcement) {
      return NextResponse.json(
        { error: 'Announcement not found' },
        { status: 404 }
      );
    }

    await announcementRepository.markAsRead(params.id, session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Mark as read error:', error);
    return NextResponse.json(
      { error: 'Failed to mark announcement as read' },
      { status: 500 }
    );
  }
}