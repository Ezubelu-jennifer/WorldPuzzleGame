import React, { useState, useEffect, useRef } from "react";
import { useGame } from "@/context/game-context";
import { useDrop } from "@/hooks/useDrop";
import { PuzzlePiece } from "@/components/game/puzzle-piece";
import { Button } from "@/components/ui/button";

interface PuzzleBoardProps {
  countryId: number;
  countryName: string;
  outlinePath: string;
  onStart: () => void;
}

export function PuzzleBoard({ 
  countryId, 
  countryName, 
  outlinePath,
  onStart
}: PuzzleBoardProps) {
  const { gameState, placePiece } = useGame();
  const [gameStarted, setGameStarted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Set up the drop zone for the puzzle container
  const { dropRef } = useDrop({
    onDrop: (position) => {
      // The drag and drop is handled in the PuzzlePiece component
    },
  });

  // Handle game start
  const handleStartPuzzle = () => {
    setGameStarted(true);
    onStart();
  };

  // Calculate container dimensions
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  useEffect(() => {
    // Update dimensions on mount and window resize
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  // Check if regions are available
  const hasRegions = gameState && gameState.regions && gameState.regions.length > 0;

  return (
    <div 
      ref={containerRef}
      className="bg-white rounded-xl shadow-md p-4 h-full flex flex-col"
    >
      {/* Puzzle Container */}
      <div 
        ref={dropRef}
        className="relative min-h-[500px] border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 mb-4 flex-grow flex items-center justify-center"
      >
        {/* Country Outline */}
        <div className="w-full h-full absolute top-0 left-0 pointer-events-none">
          <svg className="w-full h-full opacity-30" viewBox="0 0 400 300">
            <path 
              d={outlinePath} 
              fill="#e5e7eb" 
              stroke="#64748b" 
              strokeWidth="2"
            />
          </svg>
        </div>
        
        {/* Puzzle Pieces that have been placed on the board */}
        {hasRegions && gameState.regions.map(region => 
          region.isPlaced && (
            <PuzzlePiece
              key={region.id}
              region={region}
              snapToPosition
              containerRef={containerRef}
              onDrop={() => false} // Already placed pieces can't be moved
            />
          )
        )}
        
        {/* Start Message */}
        {!gameStarted && (
          <div className="text-center p-6 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg max-w-md z-10">
            <h3 className="font-heading font-bold text-2xl mb-3 text-gray-800">
              {countryName} Puzzle
            </h3>
            <p className="text-gray-600 mb-4">
              Drag and place the {gameState?.regions.length || '0'} regions of {countryName} in their correct positions on the map.
            </p>
            <Button 
              onClick={handleStartPuzzle}
              className="bg-primary hover:bg-primary/90 text-white font-bold py-3 px-6"
            >
              Start Puzzle
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
