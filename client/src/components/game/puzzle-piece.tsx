import React, { useEffect, useRef, RefObject } from "react";
import { useDrag } from "@/hooks/useDrag";
import { RegionPiece } from "@shared/schema";
import { cn } from "@/lib/utils";

interface PuzzlePieceProps {
  region: RegionPiece;
  onDrop: (id: number, x: number, y: number) => boolean;
  containerRef: RefObject<HTMLDivElement>;
  snapToPosition?: boolean;
  isTrayPiece?: boolean;
}

export function PuzzlePiece({ 
  region, 
  onDrop, 
  containerRef,
  snapToPosition = false,
  isTrayPiece = false 
}: PuzzlePieceProps) {
  const pieceRef = useRef<HTMLDivElement>(null);
  
  // Initialize position
  const initialX = region.currentX || (isTrayPiece ? 0 : Math.random() * 100);
  const initialY = region.currentY || (isTrayPiece ? 0 : Math.random() * 100);

  // Use our custom drag hook
  const { isDragging, position, setPosition, dragHandlers } = useDrag({
    initialPosition: { x: initialX, y: initialY },
    onDragStart: () => {
      // Start dragging logic
    },
    onDragEnd: (finalPosition) => {
      // Calculate position relative to container
      if (containerRef.current && pieceRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const pieceRect = pieceRef.current.getBoundingClientRect();
        
        const relativeX = finalPosition.x - containerRect.left;
        const relativeY = finalPosition.y - containerRect.top;
        
        // Check if piece should be placed in the correct position
        const isPlaced = onDrop(region.id, relativeX, relativeY);
        
        if (isPlaced && snapToPosition) {
          // If it's placed and we want to snap, set to the correct position
          setPosition({ x: region.correctX, y: region.correctY });
        }
      }
    }
  });

  // If the piece is placed correctly and snapToPosition is true, position it correctly
  useEffect(() => {
    if (region.isPlaced && snapToPosition) {
      setPosition({ x: region.correctX, y: region.correctY });
    }
  }, [region.isPlaced, snapToPosition, region.correctX, region.correctY, setPosition]);

  return (
    <div
      ref={pieceRef}
      className={cn(
        "absolute transition-transform",
        isDragging ? "z-10 scale-105" : "",
        region.isPlaced ? "cursor-default" : "cursor-move",
        isTrayPiece ? "inline-block" : ""
      )}
      style={{ 
        top: `${position.y}px`, 
        left: `${position.x}px`,
        opacity: region.isPlaced ? 0.9 : 1,
        transform: isDragging ? "scale(1.05)" : "scale(1)",
        transition: "transform 0.1s ease, opacity 0.3s ease",
        // Adjust width and height as needed for your SVG sizes
        width: isTrayPiece ? "80px" : "auto",
        height: isTrayPiece ? "80px" : "auto"
      }}
      {...dragHandlers}
    >
      <svg 
        viewBox={`0 0 100 100`} 
        className="w-full h-full" 
      >
        <path 
          d={region.svgPath} 
          fill={region.isPlaced ? region.fillColor : "#93c5fd"}
          stroke={region.strokeColor}
          strokeWidth="2"
        />
        <text 
          x="50" 
          y="50" 
          textAnchor="middle" 
          dominantBaseline="middle"
          fill={region.isPlaced ? "#ffffff" : "#1e40af"} 
          fontSize={isTrayPiece ? "10" : "8"}
          fontWeight="bold"
        >
          {region.name}
        </text>
      </svg>
    </div>
  );
}
