import { useState, useRef, MouseEvent, TouchEvent, useEffect } from "react";

interface Position {
  x: number;
  y: number;
}

interface UseDragParams {
  onDragStart?: (e: MouseEvent | TouchEvent) => void;
  onDragEnd?: (position: Position, elementUnderCursor: Element | null) => void;
  onDragMove?: (position: { x: number; y: number }) => void; // <-- Add this

  initialPosition?: Position;
  dragItemId?: string | number; // Add identifier for the dragged item
}

export function useDrag({
  onDragStart,
  onDragEnd,
  onDragMove,
  initialPosition = { x: 0, y: 0 },
  dragItemId
}: UseDragParams = {}) {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState<Position>(initialPosition);
  const dragRef = useRef({
    dragging: false,
    startX: 0,
    startY: 0,
  });
  
  


  // Set up data transfer for native DnD
  useEffect(() => {
    const handleDragStart = (e: DragEvent) => {
      if (dragItemId !== undefined && e.dataTransfer) {
        e.dataTransfer.setData('pieceId', dragItemId.toString());
        e.dataTransfer.effectAllowed = 'move';
      }
    };

    const node = document.body;
    node.addEventListener('dragstart', handleDragStart);
    return () => node.removeEventListener('dragstart', handleDragStart);
  }, [dragItemId]);

  // Clean up if component unmounts mid-drag
  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  // Mouse handlers
  const handleMouseDown = (e: MouseEvent) => {
    e.preventDefault();
    dragRef.current = {
      dragging: true,
      startX: e.clientX,
      startY: e.clientY,
    };
    setIsDragging(true);
    if (onDragStart) onDragStart(e);
    
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };
// Handler for mouse move event
const handleMouseMove = (e: globalThis.MouseEvent) => {
  if (!dragRef.current.dragging) return;

  const newPosition = { x: e.clientX, y: e.clientY };
  setPosition(newPosition);

  onDragMove?.(newPosition); // 🔥 Call onDragMove here
};
 // Handler for mouse up event
const handleMouseUp = (e: globalThis.MouseEvent) => {
  if (!dragRef.current.dragging) return;
  
  finishDrag(e.clientX, e.clientY);
};

  // Touch handlers
  const handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    dragRef.current = {
      dragging: true,
      startX: touch.clientX,
      startY: touch.clientY,
    };
    setIsDragging(true);
    if (onDragStart) onDragStart(e);
    
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd);
  };

  // Handler for touch move event
const handleTouchMove = (e: globalThis.TouchEvent) => {
  if (!dragRef.current.dragging || e.touches.length !== 1) return;

  e.preventDefault();
  const touch = e.touches[0];
  const newPosition = { x: touch.clientX, y: touch.clientY };
  setPosition(newPosition);
  onDragMove?.(newPosition);
  // 🔥 Call onDragMove here
};

  // Handler for touch end event
const handleTouchEnd = (e: globalThis.TouchEvent) => {
  if (!dragRef.current.dragging) return;
  
  const touch = e.changedTouches[0];
  finishDrag(touch.clientX, touch.clientY);
};
  // Common drag finish logic
  const finishDrag = (clientX: number, clientY: number) => {
    //dragRef.current.dragging = false;
    //setIsDragging(false);
    dragRef.current = { dragging: false, startX: 0, startY: 0 };
    setIsDragging(false);
    
    // Clean up listeners
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
    document.removeEventListener("touchmove", handleTouchMove);
    document.removeEventListener("touchend", handleTouchEnd);

   
    
    if (onDragEnd) {
      const elementUnderCursor = document.elementFromPoint(clientX, clientY);
      onDragEnd({ x: clientX, y: clientY }, elementUnderCursor);

    }
  };

  return {
    isDragging,
    position,
    setPosition,
    
    dragHandlers: {
      onMouseDown: handleMouseDown,
      onTouchStart: handleTouchStart,
      draggable: true,
    },
  };
}