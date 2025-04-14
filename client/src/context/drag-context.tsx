import { createContext, useContext, useState, ReactNode } from 'react';

interface DragContextProps {
  draggedPieceId: number | null;
  setDraggedPieceId: (id: number | null) => void;
}

const DragContext = createContext<DragContextProps | undefined>(undefined);

export function DragProvider({ children }: { children: ReactNode }) {
  const [draggedPieceId, setDraggedPieceId] = useState<number | null>(null);

  return (
    <DragContext.Provider value={{ draggedPieceId, setDraggedPieceId }}>
      {children}
    </DragContext.Provider>
  );
}

export function useDragContext() {
  const context = useContext(DragContext);
  if (context === undefined) {
    throw new Error('useDragContext must be used within a DragProvider');
  }
  return context;
}