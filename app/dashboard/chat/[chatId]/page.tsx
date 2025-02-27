import { Id } from '@/convex/_generated/dataModel';
import React from 'react';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/convex'; // Import the correct function
import ChatInterface from '@/components/dashboard/ChatInterface';

interface ChatPageProps {
  params: {
    chatId: Id<'chats'>;
  };
}

async function ChatPage({ params }: ChatPageProps) {
  const { chatId } = params; // No need to `await` params
  const { userId } = await auth(); // No need to `await` auth()

  if (!userId) {
    redirect('/');
  }

  let initialMessages = []; // Declare `initialMessages`

  try {
    const convex = getConvexClient(); // Use the correct function name
    initialMessages = await convex.query(api.messages.list, { chatId });
  } catch (error) {
    console.error('Error querying Convex:', error);
    redirect('/dashboard');
  }

  return (
    <div className="flex-1 overflow-hidden">
      <ChatInterface chatId={chatId} initialMessages={initialMessages} />
    </div>
  );
}

export default ChatPage;