import { useRef, useState, useEffect, RefObject } from "react";

interface Position {
  x: number;
  y: number;
}

interface UseDropParams {
  onDrop?: (position: Position) => void;
}

export function useDrop({ onDrop }: UseDropParams = {}) {
  const dropRef = useRef<HTMLDivElement>(null);
  const [isOver, setIsOver] = useState(false);

  useEffect(() => {
    // We check in the useDrag's onDragEnd if the position is within this drop zone
    // This is why we're not adding event listeners here
  }, []);

  const checkIsOver = (x: number, y: number): boolean => {
    if (!dropRef.current) return false;

    const rect = dropRef.current.getBoundingClientRect();
    return (
      x >= rect.left &&
      x <= rect.right &&
      y >= rect.top &&
      y <= rect.bottom
    );
  };

  const handleDrop = (position: Position) => {
    if (checkIsOver(position.x, position.y) && onDrop) {
      // Calculate position relative to drop zone
      if (dropRef.current) {
        const rect = dropRef.current.getBoundingClientRect();
        const relativePosition = {
          x: position.x - rect.left,
          y: position.y - rect.top,
        };
        onDrop(relativePosition);
      }
    }
  };

  return {
    dropRef,
    isOver,
    handleDrop,
    checkIsOver
  };
}
