import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { query } from '@/lib/db';
import { Message } from '@/types';
import { getSocketIO } from '@/sockets/server';

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const decoded = await authenticate(req);
    
    if (!decoded) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { conversationId, content } = body;

    // Validate input
    if (!conversationId || !content) {
      return NextResponse.json(
        { message: 'Conversation ID and content are required' },
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
        { message: 'You are not a participant in this conversation' },
        { status: 403 }
      );
    }

    // Save message to database
    const result = await query<any>(
      `INSERT INTO messages (senderId, conversationId, content) VALUES (?, ?, ?)`,
      [decoded.id, conversationId, content]
    );

    // Get the newly created message
    const [message] = await query<Message[]>(
      `SELECT * FROM messages WHERE id = ?`,
      [result.insertId]
    );

    // Emit message to conversation room via Socket.IO
    try {
      const io = getSocketIO();
      const roomName = `conversation:${conversationId}`;
      io.to(roomName).emit('message', message);
    } catch (socketError) {
      console.error('Socket.IO error:', socketError);
      // Continue even if socket emission fails
    }

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    // Get conversation ID from query params
    const url = new URL(req.url);
    const conversationId = url.searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json(
        { message: 'Conversation ID is required' },
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
        { message: 'You are not a participant in this conversation' },
        { status: 403 }
      );
    }

    // Get messages for this conversation
    const messages = await query<Message[]>(
      `SELECT * FROM messages WHERE conversationId = ? ORDER BY createdAt ASC`,
      [conversationId]
    );

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 