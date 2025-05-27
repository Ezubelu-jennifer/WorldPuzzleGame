import React, { createContext, useContext, RefObject, useRef } from 'react';

type ScrollContextType = {
  scrollableMapContainerRef: RefObject<HTMLDivElement>;
};

const ScrollContext = createContext<ScrollContextType | undefined>(undefined);

export const useScrollContext = () => {
  const context = useContext(ScrollContext);
  if (!context) {
    throw new Error("useScrollContext must be used within ScrollProvider");
  }
  return context;
};

export const ScrollProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const scrollableMapContainerRef = useRef<HTMLDivElement>(null);

  return (
    <ScrollContext.Provider value={{ scrollableMapContainerRef }}>
      {children}
    </ScrollContext.Provider>
  );
};
