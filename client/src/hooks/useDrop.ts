// useDrop.ts
import { useRef, useState, useEffect } from "react";

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
    const node = dropRef.current;
    if (!node) return;

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      setIsOver(true);
    };

    const handleDragLeave = () => {
      setIsOver(false);
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsOver(false);

      const pieceId = e.dataTransfer?.getData("pieceId");
      console.log("DROP EVENT: pieceId =", pieceId);

      if (onDrop && node&& pieceId) {
        const rect = node.getBoundingClientRect();
        onDrop({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    };

    node.addEventListener('dragover', handleDragOver);
    node.addEventListener('dragleave', handleDragLeave);
    node.addEventListener('drop', handleDrop);

    return () => {
      node.removeEventListener('dragover', handleDragOver);
      node.removeEventListener('dragleave', handleDragLeave);
      node.removeEventListener('drop', handleDrop);
    };
  }, [onDrop]);

  return {
    dropRef,
    isOver
  };
}
