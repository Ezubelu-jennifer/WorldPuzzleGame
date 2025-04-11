import React, { useRef } from "react";
import { useGame } from "@/context/game-context";
import { PuzzlePiece } from "@/components/game/puzzle-piece";

interface PiecesTrayProps {
  onPieceDrop: (id: number, x: number, y: number) => boolean;
}

export function PiecesTray({ onPieceDrop }: PiecesTrayProps) {
  const { gameState } = useGame();
  const trayRef = useRef<HTMLDivElement>(null);
  
  if (!gameState) {
    return (
      <div className="flex space-x-3 overflow-x-auto py-1 min-h-[70px] animate-pulse">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="w-16 h-16 bg-gray-200 rounded-md flex-shrink-0"></div>
        ))}
      </div>
    );
  }

  // Filter for unplaced pieces
  const unplacedPieces = gameState.regions.filter(region => !region.isPlaced);
  
  // Random vibrant colors for regions (following the red theme in screenshot)
  const colors = [
    { fill: "#ef4444", stroke: "#b91c1c" }, // red-500, red-700
    { fill: "#f87171", stroke: "#b91c1c" }, // red-400, red-700
    { fill: "#fca5a5", stroke: "#b91c1c" }, // red-300, red-700
    { fill: "#f97316", stroke: "#c2410c" }, // orange-500, orange-700
    { fill: "#fb923c", stroke: "#c2410c" }, // orange-400, orange-700
    { fill: "#ef4444", stroke: "#b91c1c" }, // red-500, red-700
    { fill: "#f87171", stroke: "#b91c1c" }, // red-400, red-700
  ];
  
  return (
    <div ref={trayRef} className="flex space-x-3 overflow-x-auto py-1 min-h-[70px]">
      {unplacedPieces.map((region, index) => {
        // Assign color from our palette, cycling through if needed
        const colorIndex = index % colors.length;
        const regionWithColor = {
          ...region,
          fillColor: colors[colorIndex].fill,
          strokeColor: colors[colorIndex].stroke,
        };
        
        return (
          <div 
            key={region.id}
            className="flex-shrink-0 relative w-16 h-16 flex items-center justify-center"
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <PuzzlePiece
                region={regionWithColor}
                onDrop={onPieceDrop}
                containerRef={trayRef}
                isTrayPiece
              />
            </div>
            <span className="text-[10px] font-bold text-center absolute bottom-1 text-white drop-shadow-md pointer-events-none z-10">
              {region.name}
            </span>
          </div>
        );
      })}
      
      {unplacedPieces.length === 0 && (
        <div className="flex items-center justify-center w-full h-16 text-gray-500">
          All pieces have been placed!
        </div>
      )}
    </div>
  );
}
