'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Conversation, User } from '@/types';
import api from '@/services/fetcher';
import Link from 'next/link';

interface SidebarProps {
  currentUser: User;
  activeConversationId?: number;
}

export default function Sidebar({ currentUser, activeConversationId }: SidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const data = await api.get<Conversation[]>('/conversations');
        setConversations(data);
      } catch (error) {
        console.error('Failed to fetch conversations:', error);
      }
    };

    fetchConversations();
  }, []);

  // Search for users
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const data = await api.get<User[]>(`/users?search=${encodeURIComponent(searchQuery)}`);
      setUsers(data);
    } catch (error) {
      console.error('Failed to search users:', error);
    }
  };

  // Start a new conversation
  const startConversation = async (userId: number) => {
    try {
      const conversation = await api.post<Conversation>('/conversations', { userId });
      router.push(`/chat/${conversation.id}`);
      setIsSearching(false);
      setSearchQuery('');
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
  };

  // Create a new group
  const createGroup = async () => {
    // This would typically open a modal to select users and name the group
    alert('Group creation would be implemented here');
  };

  // Format conversation name
  const getConversationName = (conversation: Conversation) => {
    if (conversation.isGroup) {
      return conversation.name || 'Group Chat';
    }

    const otherUser = conversation.participants.find(
      (participant) => participant.id !== currentUser.id
    );
    return otherUser ? otherUser.username : 'Unknown User';
  };

  // Get last message preview
  const getLastMessagePreview = (conversation: Conversation) => {
    if (!conversation.lastMessage) {
      return 'No messages yet';
    }
    
    const sender = conversation.participants.find(
      (participant) => participant.id === conversation.lastMessage?.senderId
    );
    
    const isSelf = conversation.lastMessage.senderId === currentUser.id;
    const senderName = isSelf ? 'You' : (sender?.username || 'Unknown');
    
    return `${senderName}: ${conversation.lastMessage.content.substring(0, 30)}${
      conversation.lastMessage.content.length > 30 ? '...' : ''
    }`;
  };

  return (
    <div className="h-full w-1/3 border-r border-gray-300 flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 bg-gray-100 flex justify-between items-center">
        <div className="font-bold">WhatsApp Clone</div>
        <div className="flex space-x-2">
          <button 
            onClick={createGroup}
            className="p-2 bg-green-500 text-white rounded-full"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-1a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v1h-3zM4.75 12.094A5.973 5.973 0 004 15v1H1v-1a3 3 0 013.75-2.906z" />
            </svg>
          </button>
          <button 
            onClick={() => api.post('/auth/logout', {}).then(() => router.push('/'))}
            className="p-2 bg-red-500 text-white rounded-full"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm11 3a1 1 0 10-2 0v6.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 10-1.414-1.414L14 12.586V6z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-300">
        <div className="relative">
          <input
            type="text"
            placeholder="Search or start a new chat"
            className="w-full p-2 pl-10 border border-gray-300 rounded-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>

      {/* Search Results */}
      {isSearching && (
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 text-sm text-gray-500">Search Results</div>
          {users.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No users found</div>
          ) : (
            users.map((user) => (
              <div
                key={user.id}
                className="p-4 border-b border-gray-200 flex items-center hover:bg-gray-100 cursor-pointer"
                onClick={() => startConversation(user.id)}
              >
                <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center mr-3">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-medium">{user.username}</div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Conversations List */}
      {!isSearching && (
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No conversations yet</div>
          ) : (
            conversations.map((conversation) => (
              <Link
                key={conversation.id}
                href={`/chat/${conversation.id}`}
                className={`block p-4 border-b border-gray-200 hover:bg-gray-100 ${
                  activeConversationId === conversation.id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center mr-3">
                    {conversation.isGroup ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-1a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v1h-3zM4.75 12.094A5.973 5.973 0 004 15v1H1v-1a3 3 0 013.75-2.906z" />
                      </svg>
                    ) : (
                      getConversationName(conversation).charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <div className="font-medium">{getConversationName(conversation)}</div>
                      {conversation.lastMessage && (
                        <div className="text-xs text-gray-500">
                          {new Date(conversation.lastMessage.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 truncate">
                      {getLastMessagePreview(conversation)}
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
} 