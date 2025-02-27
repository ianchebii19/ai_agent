'use client';
import React from 'react';
import { Button } from '../ui/button';
import { IoMdMenu } from 'react-icons/io';
import { UserButton } from '@clerk/clerk-react';
import { useNavigation } from '@/lib/NavigationProvider';
// Import the custom hook

function Header() {
  const { setIsMobileNavOpen, isMobileNavOpen } = useNavigation();

  return (
    <div className="border-b border-gray-200/50 shadow-md bg-white/80 backdrop-blur-sm top-0 z-50 sticky">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left side: Menu button and title */}
        <div className="flex items-center">
          <Button
            className="text-amber-800 font-bold bg-gray-100 text-5xl px-4 py-2 rounded-md hover:bg-amber-300 transition duration-300"
            onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
          >
            <IoMdMenu />
          </Button>
          <div className="px-4 py-2 text-xl font-semibold text-gray-800">
            Chat with AI
          </div>
        </div>

        {/* Right side: User button */}
        <div>
          <UserButton />
        </div>
      </div>
    </div>
  );
}

export default Header;