import { createContext, useContext, useState, ReactNode } from 'react';

interface DragContextProps {
  draggedPieceId: number | null;
  draggedRotation: number;
  startDrag: (piece: { pieceId: number; rotation: number }) => void;
  endDrag: () => void;
  setDraggedPieceId: (id: number | null) => void; // Add this line
  setDraggedRotation: (rotation: number) => void;


}

const DragContext = createContext<DragContextProps | undefined>(undefined);

export function DragProvider({ children }: { children: ReactNode }) {
  const [draggedPieceId, setDraggedPieceId] = useState<number | null>(null);
  const [draggedRotation, setDraggedRotation] = useState<number>(0);

  const startDrag = ({ pieceId, rotation }: { pieceId: number; rotation: number }) => {
    setDraggedPieceId(pieceId);
    setDraggedRotation(rotation);
  };

  const endDrag = () => {
    setDraggedPieceId(null);
    setDraggedRotation(0);
  };

  return (
    <DragContext.Provider value={{ draggedPieceId, draggedRotation, startDrag, endDrag,  setDraggedRotation ,setDraggedPieceId // Expose the setter directly
    }}>
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