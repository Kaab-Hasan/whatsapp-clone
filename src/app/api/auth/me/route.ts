import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { query } from '@/lib/db';
import { User } from '@/types';

export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const decoded = await authenticate(req);
    
    if (!decoded) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user from database
    const users = await query<User[]>(
      'SELECT id, username, email, createdAt, updatedAt FROM users WHERE id = ?',
      [decoded.id]
    );

    if (users.length === 0) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(users[0]);
  } catch (error) {
    console.error('Get current user error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 