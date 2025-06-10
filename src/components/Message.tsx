'use client';

import { Message, User } from '@/types';

interface MessageProps {
  message: Message;
  currentUser: User;
  sender?: User;
}

export default function MessageComponent({ message, currentUser, sender }: MessageProps) {
  const isSelf = message.senderId === currentUser.id;
  const formattedTime = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className={`flex ${isSelf ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[70%] rounded-lg px-4 py-2 ${
          isSelf 
            ? 'bg-green-100 text-green-900' 
            : 'bg-white text-gray-900 border border-gray-200'
        }`}
      >
        {!isSelf && sender && (
          <div className="text-xs font-medium text-blue-600 mb-1">
            {sender.username}
          </div>
        )}
        <div className="whitespace-pre-wrap break-words">{message.content}</div>
        <div className="text-xs text-gray-500 text-right mt-1">
          {formattedTime}
        </div>
      </div>
    </div>
  );
} 