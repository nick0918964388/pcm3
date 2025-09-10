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
    const period = searchParams.get('period') || 'current';

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const connection = await getConnection();
    try {
      const result = await connection.execute<any>(
        `SELECT 
          metric_name,
          metric_value,
          target_value,
          unit,
          status,
          trend,
          TO_CHAR(measured_at, 'YYYY-MM-DD') as measured_date
        FROM quality_metrics
        WHERE project_id = :projectId
          AND period = :period
        ORDER BY metric_name`,
        { projectId, period }
      );

      const metrics = result.rows?.map((row: any) => ({
        name: row.METRIC_NAME,
        value: row.METRIC_VALUE,
        target: row.TARGET_VALUE,
        unit: row.UNIT,
        status: row.STATUS,
        trend: row.TREND,
        measuredDate: row.MEASURED_DATE,
      })) || [];

      return NextResponse.json(metrics);
    } finally {
      await connection.close();
    }
  } catch (error) {
    console.error('Quality metrics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quality metrics' },
      { status: 500 }
    );
  }
}