import { NextRequest, NextResponse } from 'next/server';
import { initDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    // Initialize database tables
    await initDb();
    
    return NextResponse.json({ 
      message: 'Database initialized successfully' 
    });
  } catch (error) {
    console.error('Database initialization error:', error);
    return NextResponse.json(
      { message: 'Failed to initialize database' },
      { status: 500 }
    );
  }
} 