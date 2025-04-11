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
      <div className="border-2 rounded-lg bg-gray-100 p-3 h-32 animate-pulse">
        <div className="h-20 bg-gray-200 rounded"></div>
      </div>
    );
  }

  // Filter for unplaced pieces
  const unplacedPieces = gameState.regions.filter(region => !region.isPlaced);
  
  return (
    <div 
      ref={trayRef}
      className="border-2 rounded-lg bg-gray-100 p-3 h-32 overflow-x-auto whitespace-nowrap"
    >
      <div className="inline-flex space-x-2 py-1">
        {unplacedPieces.map(region => (
          <div 
            key={region.id}
            className="tray-piece inline-block h-20 w-20 bg-blue-100 rounded-md shadow-sm hover:shadow-md transition-shadow"
          >
            <PuzzlePiece
              region={region}
              onDrop={onPieceDrop}
              containerRef={trayRef}
              isTrayPiece
            />
          </div>
        ))}
        
        {unplacedPieces.length === 0 && (
          <div className="flex items-center justify-center w-full h-20 text-gray-500">
            All pieces have been placed!
          </div>
        )}
      </div>
    </div>
  );
}
