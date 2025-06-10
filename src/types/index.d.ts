export interface User {
  id: number;
  username: string;
  email: string;
  password?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: number;
  senderId: number;
  conversationId: number;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Conversation {
  id: number;
  name?: string;
  isGroup: boolean;
  createdAt: Date;
  updatedAt: Date;
  participants: User[];
  lastMessage?: Message;
}

export interface Participant {
  id: number;
  userId: number;
  conversationId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResponse {
  user: Omit<User, 'password'>;
  token: string;
}

export interface SocketMessage {
  senderId: number;
  conversationId: number;
  content: string;
}

export interface ApiError {
  message: string;
  status: number;
} 