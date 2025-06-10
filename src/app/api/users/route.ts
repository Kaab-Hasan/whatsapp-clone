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

    // Get search query from URL params
    const url = new URL(req.url);
    const search = url.searchParams.get('search');

    let users: User[];

    if (search) {
      // Search for users by username or email
      users = await query<User[]>(
        `SELECT id, username, email, createdAt, updatedAt 
         FROM users 
         WHERE (username LIKE ? OR email LIKE ?) AND id != ? 
         LIMIT 20`,
        [`%${search}%`, `%${search}%`, decoded.id]
      );
    } else {
      // Get all users except current user
      users = await query<User[]>(
        `SELECT id, username, email, createdAt, updatedAt 
         FROM users 
         WHERE id != ? 
         LIMIT 20`,
        [decoded.id]
      );
    }

    return NextResponse.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 