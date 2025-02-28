'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { BotIcon } from 'lucide-react';
import { useUser } from '@clerk/nextjs';

interface MessageBubbleProps {
  content: string;
  isUser: boolean;
}

const formatMessage = (content: string): string => {
  content = content.replace(/\\\\/g, '\\');
  content = content.replace(/\\n/g, '\n');
  content = content.replace(/___START___\n?/g, '').replace(/\n?___END___/g, '');
  return content.trim();
};

function MessageBubble({ content, isUser }: MessageBubbleProps) {
  const { user } = useUser();

  return (
    <div
      className={`rounded-2xl px-4 py-2.5 max-w-[86%] ${
        isUser ? 'ml-auto bg-blue-600 text-white rounded-br-none' : 'mr-auto bg-white text-gray-700 rounded-bl-none'
      }`}
    >
      <div className="whitespace-pre-wrap text-[15px] leading-relaxed">
        <div dangerouslySetInnerHTML={{ __html: formatMessage(content) }} />
      </div>

      <div
        className={`absolute bottom-0 ${
          isUser ? '-right-2 translate-x-1/2 translate-y-1/2' : '-left-2 -translate-x-1/2 translate-y-1/2'
        }`}
      >
        <div
          className={`w-8 h-8 rounded-full border-2 ${
            isUser ? 'bg-white border-gray-100' : 'bg-blue-600 border-white'
          } flex items-center justify-center shadow-sm`}
        >
          {isUser ? (
            <Avatar className="h-7 w-7">
              <AvatarImage src={user?.imageUrl} />
              <AvatarFallback>
                {user?.firstName?.charAt(0)}
                {user?.lastName?.charAt(0)}
              </AvatarFallback>
            </Avatar>
          ) : (
            <BotIcon className="h-5 w-5 text-white" />
          )}
        </div>
      </div>
    </div>
  );
}

export default MessageBubble;