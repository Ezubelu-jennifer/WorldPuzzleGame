import { useState, useRef, MouseEvent, TouchEvent } from "react";

interface Position {
  x: number;
  y: number;
}

interface UseDragParams {
  onDragStart?: () => void;
  onDragEnd?: (position: Position, dropped: boolean) => void;
  initialPosition?: Position;
}

export function useDrag({
  onDragStart,
  onDragEnd,
  initialPosition = { x: 0, y: 0 }
}: UseDragParams = {}) {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState<Position>(initialPosition);
  const dragStartPositionRef = useRef<Position>({ x: 0, y: 0 });
  const elementStartPositionRef = useRef<Position>(initialPosition);
  const wasDraggingRef = useRef(false);

  // Reference to track when in drag operation
  const dragRef = useRef({
    dragging: false,
    dragStartClientX: 0,
    dragStartClientY: 0,
  });

  // Handler for mouse down event
  const handleMouseDown = (e: MouseEvent) => {
    e.preventDefault();
    
    // Store initial positions
    dragStartPositionRef.current = { x: e.clientX, y: e.clientY };
    elementStartPositionRef.current = { ...position };
    
    dragRef.current = {
      dragging: true,
      dragStartClientX: e.clientX,
      dragStartClientY: e.clientY,
    };
    
    setIsDragging(true);
    wasDraggingRef.current = true;
    
    if (onDragStart) {
      onDragStart();
    }
    
    // Add global event listeners
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // Handler for mouse move event
  const handleMouseMove = (e: MouseEvent | globalThis.MouseEvent) => {
    if (!dragRef.current.dragging) return;
    
    const deltaX = e.clientX - dragStartPositionRef.current.x;
    const deltaY = e.clientY - dragStartPositionRef.current.y;
    
    const newPosition = {
      x: elementStartPositionRef.current.x + deltaX,
      y: elementStartPositionRef.current.y + deltaY,
    };
    
    setPosition(newPosition);
  };

  // Handler for mouse up event
  const handleMouseUp = (e: MouseEvent | globalThis.MouseEvent) => {
    if (!dragRef.current.dragging) return;
    
    dragRef.current.dragging = false;
    setIsDragging(false);
    
    // Remove global event listeners
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
    
    // Get final position
    const deltaX = e.clientX - dragStartPositionRef.current.x;
    const deltaY = e.clientY - dragStartPositionRef.current.y;
    
    const finalPosition = {
      x: elementStartPositionRef.current.x + deltaX,
      y: elementStartPositionRef.current.y + deltaY,
    };
    
    if (onDragEnd && wasDraggingRef.current) {
      onDragEnd(finalPosition, true);
      wasDraggingRef.current = false;
    }
  };

  // Handler for touch start event
  const handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length !== 1) return;
    
    // Store initial positions
    dragStartPositionRef.current = { 
      x: e.touches[0].clientX, 
      y: e.touches[0].clientY 
    };
    elementStartPositionRef.current = { ...position };
    
    dragRef.current = {
      dragging: true,
      dragStartClientX: e.touches[0].clientX,
      dragStartClientY: e.touches[0].clientY,
    };
    
    setIsDragging(true);
    wasDraggingRef.current = true;
    
    if (onDragStart) {
      onDragStart();
    }
    
    // Add global event listeners
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd);
  };

  // Handler for touch move event
  const handleTouchMove = (e: TouchEvent | globalThis.TouchEvent) => {
    if (!dragRef.current.dragging || e.touches.length !== 1) return;
    
    e.preventDefault(); // Prevent scrolling while dragging
    
    const deltaX = e.touches[0].clientX - dragStartPositionRef.current.x;
    const deltaY = e.touches[0].clientY - dragStartPositionRef.current.y;
    
    const newPosition = {
      x: elementStartPositionRef.current.x + deltaX,
      y: elementStartPositionRef.current.y + deltaY,
    };
    
    setPosition(newPosition);
  };

  // Handler for touch end event
  const handleTouchEnd = (e: TouchEvent | globalThis.TouchEvent) => {
    if (!dragRef.current.dragging) return;
    
    dragRef.current.dragging = false;
    setIsDragging(false);
    
    // Remove global event listeners
    document.removeEventListener("touchmove", handleTouchMove);
    document.removeEventListener("touchend", handleTouchEnd);
    
    if (onDragEnd && wasDraggingRef.current) {
      // For touch, use the last known position
      onDragEnd(position, true);
      wasDraggingRef.current = false;
    }
  };

  return {
    isDragging,
    position,
    setPosition,
    dragHandlers: {
      onMouseDown: handleMouseDown,
      onTouchStart: handleTouchStart,
    },
  };
}
