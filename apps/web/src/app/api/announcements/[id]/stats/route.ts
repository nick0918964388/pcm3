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

    // Check if user has admin or PM role or is the creator
    if (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.PM) {
      const announcement = await announcementRepository.getAnnouncementById(params.id);
      if (!announcement || announcement.createdBy !== session.user.id) {
        return NextResponse.json(
          { error: 'Insufficient permissions to view announcement stats' },
          { status: 403 }
        );
      }
    }

    const stats = await announcementRepository.getAnnouncementStats(params.id);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Get announcement stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch announcement statistics' },
      { status: 500 }
    );
  }
}