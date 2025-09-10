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
          document_type,
          document_name,
          version,
          status,
          TO_CHAR(created_at, 'YYYY-MM-DD') as created_date,
          TO_CHAR(reviewed_at, 'YYYY-MM-DD') as reviewed_date,
          reviewed_by
        FROM quality_documents
        WHERE project_id = :projectId
        ORDER BY created_at DESC`,
        { projectId },
        { maxRows: 20 }
      );

      const auditDocs = result.rows?.map((row: any) => ({
        type: row.DOCUMENT_TYPE,
        name: row.DOCUMENT_NAME,
        version: row.VERSION,
        status: row.STATUS,
        createdDate: row.CREATED_DATE,
        reviewedDate: row.REVIEWED_DATE,
        reviewedBy: row.REVIEWED_BY,
      })) || [];

      return NextResponse.json(auditDocs);
    } finally {
      await connection.close();
    }
  } catch (error) {
    console.error('Audit docs API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit documents' },
      { status: 500 }
    );
  }
}