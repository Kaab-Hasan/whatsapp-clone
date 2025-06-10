import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { query } from '@/lib/db';
import { Conversation, User } from '@/types';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const decoded = await authenticate(req);
    
    if (!decoded) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const conversationId = parseInt(params.id);

    if (isNaN(conversationId)) {
      return NextResponse.json(
        { message: 'Invalid conversation ID' },
        { status: 400 }
      );
    }

    // Check if user is a participant in this conversation
    const participants = await query<any[]>(
      `SELECT * FROM participants WHERE userId = ? AND conversationId = ?`,
      [decoded.id, conversationId]
    );

    if (participants.length === 0) {
      return NextResponse.json(
        { message: 'Conversation not found or you are not a participant' },
        { status: 404 }
      );
    }

    // Get conversation
    const conversations = await query<Conversation[]>(
      `SELECT * FROM conversations WHERE id = ?`,
      [conversationId]
    );

    if (conversations.length === 0) {
      return NextResponse.json(
        { message: 'Conversation not found' },
        { status: 404 }
      );
    }

    const conversation = conversations[0];

    // Get all participants
    const allParticipants = await query<User[]>(
      `SELECT u.id, u.username, u.email, u.createdAt, u.updatedAt 
       FROM users u 
       JOIN participants p ON u.id = p.userId 
       WHERE p.conversationId = ?`,
      [conversationId]
    );

    conversation.participants = allParticipants;

    // Get last message
    const messages = await query<any[]>(
      `SELECT * FROM messages 
       WHERE conversationId = ? 
       ORDER BY createdAt DESC 
       LIMIT 1`,
      [conversationId]
    );

    if (messages.length > 0) {
      conversation.lastMessage = messages[0];
    }

    return NextResponse.json(conversation);
  } catch (error) {
    console.error('Get conversation error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 