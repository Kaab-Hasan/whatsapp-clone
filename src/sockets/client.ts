import { io, Socket } from 'socket.io-client';
import { Message, SocketMessage } from '@/types';

let socket: Socket | null = null;

export function initializeSocket() {
  if (socket) return socket;

  // Connect to the WebSocket server
  socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || '', {
    withCredentials: true,
    autoConnect: false,
  });

  // Handle connection events
  socket.on('connect', () => {
    console.log('Socket connected');
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });

  return socket;
}

export function connectSocket(userId: number) {
  const socketInstance = socket || initializeSocket();
  
  if (!socketInstance.connected) {
    socketInstance.auth = { userId };
    socketInstance.connect();
  }
  
  return socketInstance;
}

export function disconnectSocket() {
  if (socket && socket.connected) {
    socket.disconnect();
  }
}

export function subscribeToMessages(callback: (message: Message) => void) {
  if (!socket) return;
  
  socket.on('message', (message: Message) => {
    callback(message);
  });
}

export function sendMessage(message: SocketMessage) {
  if (!socket || !socket.connected) return false;
  
  socket.emit('message', message);
  return true;
}

export function joinConversation(conversationId: number) {
  if (!socket || !socket.connected) return;
  
  socket.emit('join_conversation', { conversationId });
}

export function leaveConversation(conversationId: number) {
  if (!socket || !socket.connected) return;
  
  socket.emit('leave_conversation', { conversationId });
}

export default {
  initializeSocket,
  connectSocket,
  disconnectSocket,
  subscribeToMessages,
  sendMessage,
  joinConversation,
  leaveConversation,
}; 