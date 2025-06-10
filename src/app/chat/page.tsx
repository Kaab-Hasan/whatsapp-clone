'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import api from '@/services/fetcher';
import { User } from '@/types';
import { initializeSocket } from '@/sockets/client';

export default function ChatPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Initialize Socket.IO server
    fetch('/api/socket')
      .then(res => res.json())
      .catch(err => console.error('Failed to initialize Socket.IO server:', err));

    // Get current user
    const fetchCurrentUser = async () => {
      try {
        const user = await api.get<User>('/auth/me');
        setCurrentUser(user);
        
        // Initialize socket connection
        initializeSocket();
      } catch (error) {
        console.error('Failed to fetch current user:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, [router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="flex h-screen">
      <Sidebar currentUser={currentUser} />
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-gray-700 mb-2">Welcome to WhatsApp Clone</h1>
          <p className="text-gray-500">Select a conversation or start a new one</p>
        </div>
      </div>
    </div>
  );
} 