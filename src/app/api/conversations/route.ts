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
    const { userId } = body;

    // Validate input
    if (!userId) {
      return NextResponse.json(
        { message: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const users = await query<User[]>(
      `SELECT * FROM users WHERE id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if conversation already exists
    const existingConversations = await query<any[]>(
      `SELECT c.id FROM conversations c
       JOIN participants p1 ON c.id = p1.conversationId
       JOIN participants p2 ON c.id = p2.conversationId
       WHERE p1.userId = ? AND p2.userId = ? AND c.isGroup = false`,
      [decoded.id, userId]
    );

    if (existingConversations.length > 0) {
      // Get existing conversation
      const conversationId = existingConversations[0].id;
      
      const conversations = await query<Conversation[]>(
        `SELECT c.* FROM conversations c WHERE c.id = ?`,
        [conversationId]
      );
      
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
    }

    // Create new conversation
    const result = await query<any>(
      `INSERT INTO conversations (isGroup) VALUES (false)`,
      []
    );

    const conversationId = result.insertId;

    // Add participants
    await query(
      `INSERT INTO participants (userId, conversationId) VALUES (?, ?), (?, ?)`,
      [decoded.id, conversationId, userId, conversationId]
    );

    // Get the newly created conversation
    const conversations = await query<Conversation[]>(
      `SELECT c.* FROM conversations c WHERE c.id = ?`,
      [conversationId]
    );

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
    console.error('Create conversation error:', error);
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

    // Get all conversations the user is part of
    const conversations = await query<Conversation[]>(
      `SELECT c.* 
       FROM conversations c 
       JOIN participants p ON c.id = p.conversationId 
       WHERE p.userId = ?`,
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
    console.error('Get conversations error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 