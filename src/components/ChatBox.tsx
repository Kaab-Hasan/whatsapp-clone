'use client';

import { useState, useEffect, useRef } from 'react';
import { Conversation, Message, User } from '@/types';
import api from '@/services/fetcher';
import MessageComponent from './Message';
import { connectSocket, subscribeToMessages, sendMessage, joinConversation, leaveConversation } from '@/sockets/client';

interface ChatBoxProps {
  conversation: Conversation;
  currentUser: User;
}

export default function ChatBox({ conversation, currentUser }: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get conversation name
  const getConversationName = () => {
    if (conversation.isGroup) {
      return conversation.name || 'Group Chat';
    }

    const otherUser = conversation.participants.find(
      (participant) => participant.id !== currentUser.id
    );
    return otherUser ? otherUser.username : 'Unknown User';
  };

  // Get sender for a message
  const getSender = (senderId: number) => {
    return conversation.participants.find(
      (participant) => participant.id === senderId
    );
  };

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      setIsLoading(true);
      try {
        const data = await api.get<Message[]>(`/messages?conversationId=${conversation.id}`);
        setMessages(data);
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, [conversation.id]);

  // Connect to socket and join conversation room
  useEffect(() => {
    const socket = connectSocket(currentUser.id);
    
    joinConversation(conversation.id);
    
    const handleNewMessage = (message: Message) => {
      if (message.conversationId === conversation.id) {
        setMessages((prevMessages) => [...prevMessages, message]);
      }
    };
    
    subscribeToMessages(handleNewMessage);
    
    return () => {
      leaveConversation(conversation.id);
    };
  }, [conversation.id, currentUser.id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle sending a new message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    
    try {
      await api.post('/messages', {
        conversationId: conversation.id,
        content: newMessage
      });
      
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return (
    <div className="h-full flex-1 flex flex-col bg-gray-50">
      {/* Header */}
      <div className="p-4 bg-gray-100 border-b border-gray-300 flex items-center">
        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center mr-3">
          {conversation.isGroup ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-1a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v1h-3zM4.75 12.094A5.973 5.973 0 004 15v1H1v-1a3 3 0 013.75-2.906z" />
            </svg>
          ) : (
            getConversationName().charAt(0).toUpperCase()
          )}
        </div>
        <div>
          <div className="font-medium">{getConversationName()}</div>
          <div className="text-xs text-gray-500">
            {conversation.participants.length} participants
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex justify-center items-center h-full text-gray-500">
            No messages yet
          </div>
        ) : (
          messages.map((message) => (
            <MessageComponent
              key={message.id}
              message={message}
              currentUser={currentUser}
              sender={getSender(message.senderId)}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-300 bg-white">
        <div className="flex">
          <input
            type="text"
            placeholder="Type a message"
            className="flex-1 p-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button
            type="submit"
            className="bg-green-500 text-white px-4 rounded-r-lg hover:bg-green-600"
            disabled={!newMessage.trim()}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
} 