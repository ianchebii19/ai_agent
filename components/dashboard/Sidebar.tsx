'use client'; // Ensure this is a Client Component if using Next.js

import { api } from '@/convex/_generated/api';
import { useNavigation } from '@/lib/NavigationProvider';
import { useMutation, useQuery } from 'convex/react';
import { useRouter } from 'next/navigation';
import React from 'react'; // Example icons
import { Button } from '../ui/button';
import { Id } from '@/convex/_generated/dataModel'; // Import Id type
import ChatRow from './ChatRow';

// Define the ChatRow component (assuming it exists)


const Sidebar = () => {
  const router = useRouter();
  const { closeMobileNav, isMobileNavOpen } = useNavigation();
  const chats = useQuery(api.chats.listChats); // Corrected API query
  const deleteChat = useMutation(api.chats.deleteChat);
  const createChat = useMutation(api.chats.createChat);

  const handleCreateNewChat = async () => {
    const chatId = await createChat({ title: 'New Chat' });
    router.push(`/dashboard/chat/${chatId}`);
    closeMobileNav();
  };

  const handleDeleteChat = async (id: Id<'chats'>) => {
    await deleteChat({ id });
    if (window.location.pathname.includes(id)) {
      router.push('/dashboard');
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isMobileNavOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={closeMobileNav}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 w-64 bg-white shadow-md z-50 transform transition-transform duration-300 ease-in-out ${
          isMobileNavOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:relative`}
      >
        <div className="flex flex-col items-center py-4 space-y-4">
          {/* Logo or Branding */}
          <div className="text-lg font-bold text-gray-800">AI</div>

          {/* Navigation Links */}
          <nav className="flex flex-col space-y-3 w-full px-4">
            <Button
              className="p-2 mt-4 text-white bg-amber-700 hover:text-amber-600 hover:bg-gray-100 rounded-md transition duration-300 flex items-center space-x-2"
              title="Home"
              onClick={handleCreateNewChat}
            >
              <span>+ New Chat</span>
            </Button>

            <div className="flex-1 overflow-auto space-y-2 scrollbar-thin scrollbar-thumb-gray-300">
              {chats?.map((chat) => (
                <ChatRow key={chat._id} chat={chat} onDelete={handleDeleteChat} />
              ))}
            </div>
          </nav>
        </div>
      </div>
    </>
  );
};

export default Sidebar;