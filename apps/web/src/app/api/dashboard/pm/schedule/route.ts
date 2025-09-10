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

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const connection = await getConnection();
    try {
      const result = await connection.execute<any>(
        `SELECT 
          w.wbs_code,
          w.name,
          w.start_date,
          w.end_date,
          w.progress,
          w.status,
          (SELECT COUNT(*) FROM wbs_items WHERE parent_id = w.wbs_id) as subtask_count,
          (SELECT COUNT(*) FROM wbs_items WHERE parent_id = w.wbs_id AND status = 'Completed') as completed_subtasks
        FROM wbs_items w
        WHERE w.project_id = :projectId
          AND w.parent_id IS NULL
        ORDER BY w.wbs_code`,
        { projectId }
      );

      const scheduleData = result.rows?.map((row: any) => ({
        wbsCode: row.WBS_CODE,
        name: row.NAME,
        startDate: row.START_DATE,
        endDate: row.END_DATE,
        progress: row.PROGRESS,
        status: row.STATUS,
        subtaskCount: row.SUBTASK_COUNT,
        completedSubtasks: row.COMPLETED_SUBTASKS,
      })) || [];

      return NextResponse.json(scheduleData);
    } finally {
      await connection.close();
    }
  } catch (error) {
    console.error('Schedule API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schedule data' },
      { status: 500 }
    );
  }
}