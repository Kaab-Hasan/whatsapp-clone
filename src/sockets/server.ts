import { Server as SocketIOServer } from 'socket.io';
import { Server as NetServer } from 'http';
import { NextApiRequest } from 'next';
import { SocketMessage } from '@/types';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

interface SocketWithAuth extends NodeJS.EventEmitter {
  auth: { userId: number };
  id: string;
  join: (room: string) => void;
  leave: (room: string) => void;
}

let io: SocketIOServer | null = null;

export function initSocketServer(server: NetServer) {
  if (io) return io;

  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Authentication middleware
  io.use((socket: any, next) => {
    const token = socket.handshake.auth.token || 
                 socket.handshake.headers.cookie?.split('token=')[1]?.split(';')[0];
    
    if (!token) {
      return next(new Error('Authentication error'));
    }

    const user = verifyToken(token);
    if (!user) {
      return next(new Error('Authentication error'));
    }

    socket.auth = { userId: user.id };
    next();
  });

  // Connection handler
  io.on('connection', (socket: SocketWithAuth) => {
    console.log(`User ${socket.auth.userId} connected`);

    // Join conversation room
    socket.on('join_conversation', async ({ conversationId }) => {
      try {
        // Verify user is a participant in this conversation
        const participants = await query<any[]>(
          `SELECT * FROM participants WHERE userId = ? AND conversationId = ?`,
          [socket.auth.userId, conversationId]
        );

        if (participants.length > 0) {
          const roomName = `conversation:${conversationId}`;
          socket.join(roomName);
          console.log(`User ${socket.auth.userId} joined room ${roomName}`);
        }
      } catch (error) {
        console.error('Error joining conversation:', error);
      }
    });

    // Leave conversation room
    socket.on('leave_conversation', ({ conversationId }) => {
      const roomName = `conversation:${conversationId}`;
      socket.leave(roomName);
      console.log(`User ${socket.auth.userId} left room ${roomName}`);
    });

    // Handle new messages
    socket.on('message', async (messageData: SocketMessage) => {
      try {
        const { senderId, conversationId, content } = messageData;
        
        // Verify sender is the authenticated user
        if (senderId !== socket.auth.userId) {
          return;
        }
        
        // Verify user is a participant in this conversation
        const participants = await query<any[]>(
          `SELECT * FROM participants WHERE userId = ? AND conversationId = ?`,
          [senderId, conversationId]
        );

        if (participants.length === 0) {
          return;
        }

        // Save message to database
        const result = await query<any>(
          `INSERT INTO messages (senderId, conversationId, content) VALUES (?, ?, ?)`,
          [senderId, conversationId, content]
        );

        // Get the newly created message
        const [message] = await query<any[]>(
          `SELECT * FROM messages WHERE id = ?`,
          [result.insertId]
        );

        // Broadcast message to conversation room
        const roomName = `conversation:${conversationId}`;
        io?.to(roomName).emit('message', message);
      } catch (error) {
        console.error('Error handling message:', error);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User ${socket.auth.userId} disconnected`);
    });
  });

  return io;
}

export function getSocketIO() {
  if (!io) {
    throw new Error('Socket.IO has not been initialized');
  }
  return io;
}

// For Next.js API routes
export function getSocketIOServer(req: NextApiRequest) {
  if (!io) {
    // @ts-ignore
    const httpServer = req.socket.server.httpServer || req.socket.server;
    return initSocketServer(httpServer);
  }
  return io;
}

export default {
  initSocketServer,
  getSocketIO,
  getSocketIOServer,
}; 