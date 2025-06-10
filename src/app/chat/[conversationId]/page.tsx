'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import ChatBox from '@/components/ChatBox';
import api from '@/services/fetcher';
import { User, Conversation } from '@/types';
import { initializeSocket } from '@/sockets/client';

interface ChatPageProps {
  params: {
    conversationId: string;
  };
}

export default function ConversationPage({ params }: ChatPageProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const conversationId = parseInt(params.conversationId);

  useEffect(() => {
    // Initialize Socket.IO server
    fetch('/api/socket')
      .then(res => res.json())
      .catch(err => console.error('Failed to initialize Socket.IO server:', err));

    // Get current user and conversation
    const fetchData = async () => {
      try {
        // Get current user
        const user = await api.get<User>('/auth/me');
        setCurrentUser(user);
        
        // Initialize socket connection
        initializeSocket();

        // Get conversation
        const conversationData = await api.get<Conversation>(`/conversations/${conversationId}`);
        setConversation(conversationData);
      } catch (error: any) {
        console.error('Failed to fetch data:', error);
        setError(error.message || 'Failed to load conversation');
        
        // If conversation not found, redirect to main chat page
        if (error.status === 404) {
          router.push('/chat');
        }
      } finally {
        setLoading(false);
      }
    };

    if (!isNaN(conversationId)) {
      fetchData();
    } else {
      setError('Invalid conversation ID');
      setLoading(false);
    }
  }, [conversationId, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!currentUser || !conversation) {
    return null;
  }

  return (
    <div className="flex h-screen">
      <Sidebar currentUser={currentUser} activeConversationId={conversationId} />
      <ChatBox conversation={conversation} currentUser={currentUser} />
    </div>
  );
} 