import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { query } from '@/lib/db';
import { Conversation, User } from '@/types';

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
    const { name, participantIds } = body;

    // Validate input
    if (!name || !participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      return NextResponse.json(
        { message: 'Group name and at least one participant are required' },
        { status: 400 }
      );
    }

    // Make sure creator is included in participants
    if (!participantIds.includes(decoded.id)) {
      participantIds.push(decoded.id);
    }

    // Create conversation
    const result = await query<any>(
      `INSERT INTO conversations (name, isGroup) VALUES (?, true)`,
      [name]
    );

    const conversationId = result.insertId;

    // Add participants
    const participantValues = participantIds.map(userId => [userId, conversationId]);
    
    await query(
      `INSERT INTO participants (userId, conversationId) VALUES ?`,
      [participantValues]
    );

    // Get the newly created conversation with participants
    const conversations = await query<Conversation[]>(
      `SELECT c.* FROM conversations c WHERE c.id = ?`,
      [conversationId]
    );

    if (conversations.length === 0) {
      return NextResponse.json(
        { message: 'Failed to create group' },
        { status: 500 }
      );
    }

    const conversation = conversations[0];

    // Get participants
    const participants = await query<User[]>(
      `SELECT u.id, u.username, u.email, u.createdAt, u.updatedAt 
       FROM users u 
       JOIN participants p ON u.id = p.userId 
       WHERE p.conversationId = ?`,
      [conversationId]
    );

    conversation.participants = participants;

    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    console.error('Create group error:', error);
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

    // Get all group conversations the user is part of
    const conversations = await query<Conversation[]>(
      `SELECT c.* 
       FROM conversations c 
       JOIN participants p ON c.id = p.conversationId 
       WHERE p.userId = ? AND c.isGroup = true`,
      [decoded.id]
    );

    // Get participants for each conversation
    for (const conversation of conversations) {
      const participants = await query<User[]>(
        `SELECT u.id, u.username, u.email, u.createdAt, u.updatedAt 
         FROM users u 
         JOIN participants p ON u.id = p.userId 
         WHERE p.conversationId = ?`,
        [conversation.id]
      );

      conversation.participants = participants;

      // Get last message
      const messages = await query<any[]>(
        `SELECT * FROM messages 
         WHERE conversationId = ? 
         ORDER BY createdAt DESC 
         LIMIT 1`,
        [conversation.id]
      );

      if (messages.length > 0) {
        conversation.lastMessage = messages[0];
      }
    }

    return NextResponse.json(conversations);
  } catch (error) {
    console.error('Get groups error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 