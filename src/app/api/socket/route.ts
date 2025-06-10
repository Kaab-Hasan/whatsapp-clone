import { NextRequest, NextResponse } from 'next/server';
import { getSocketIOServer } from '@/sockets/server';

export async function GET(req: NextRequest) {
  try {
    // Initialize Socket.IO server
    getSocketIOServer(req as any);
    
    return NextResponse.json({ message: 'Socket.IO server initialized' });
  } catch (error) {
    console.error('Socket.IO initialization error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 