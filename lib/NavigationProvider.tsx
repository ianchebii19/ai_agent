'use client';
import { createContext, ReactNode, useState, useContext } from 'react';

// Define the type for the context value
type NavigationContextType = {
  isMobileNavOpen: boolean;
  setIsMobileNavOpen: (isOpen: boolean) => void;
  closeMobileNav: () => void;
};

// Create the context with a default value
const NavigationContext = createContext<NavigationContextType>({
  isMobileNavOpen: false,
  setIsMobileNavOpen: () => {},
  closeMobileNav: () => {},
});

// Define the props for the NavigationProvider component
interface NavigationProviderProps {
  children: ReactNode;
}

// Create the NavigationProvider component
export function NavigationProvider({ children }: NavigationProviderProps) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const closeMobileNav = () => setIsMobileNavOpen(false);

  const contextValue: NavigationContextType = {
    isMobileNavOpen,
    setIsMobileNavOpen,
    closeMobileNav,
  };

  return (
    <NavigationContext.Provider value={contextValue}>
      {children}
    </NavigationContext.Provider>
  );
}

// Custom hook to use the NavigationContext
export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}