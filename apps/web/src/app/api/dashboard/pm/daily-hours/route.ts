import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getConnection } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');
    const days = parseInt(searchParams.get('days') || '7');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const connection = await getConnection();
    try {
      const result = await connection.execute<any>(
        `SELECT 
          TO_CHAR(attendance_date, 'YYYY-MM-DD') as date,
          TO_CHAR(attendance_date, 'DY') as day_name,
          COUNT(DISTINCT personnel_id) as personnel_count,
          SUM(hours_worked) as total_hours,
          AVG(hours_worked) as avg_hours
        FROM attendance_records
        WHERE project_id = :projectId
          AND attendance_date >= SYSDATE - :days
        GROUP BY attendance_date
        ORDER BY attendance_date`,
        { projectId, days }
      );

      const dailyHoursData = result.rows?.map((row: any) => ({
        date: row.DATE,
        dayName: row.DAY_NAME,
        personnelCount: row.PERSONNEL_COUNT,
        totalHours: row.TOTAL_HOURS,
        avgHours: Math.round(row.AVG_HOURS * 10) / 10,
      })) || [];

      return NextResponse.json(dailyHoursData);
    } finally {
      await connection.close();
    }
  } catch (error) {
    console.error('Daily hours API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch daily hours data' },
      { status: 500 }
    );
  }
}