import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const isHealthy = await db.checkHealth();
    
    if (isHealthy) {
      return NextResponse.json(
        { 
          status: 'healthy', 
          database: 'connected',
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { 
          status: 'unhealthy', 
          database: 'disconnected',
          timestamp: new Date().toISOString()
        },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        database: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}