import React, { useState, useEffect, useRef } from "react";
import { useGame } from "@/context/game-context";
import { useDrop } from "@/hooks/useDrop";
import { PuzzlePiece } from "@/components/game/puzzle-piece";
import { Button } from "@/components/ui/button";
import { getSvgDataById } from "@/data/svg-map-data";
import { getViewBoxFromSVG } from "@/data/svg-parser";
import { CountrySvgMap } from "@/components/maps/country-svg-map";

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
  const [svgData, setSvgData] = useState<string>("");
  const [viewBox, setViewBox] = useState<string>("0 0 400 300");
  
  // Set up the drop zone for the puzzle container
  const { dropRef } = useDrop({
    onDrop: (position) => {
      // The drag and drop is handled in the PuzzlePiece component
    },
  });

  // Get SVG data for this country
  useEffect(() => {
    const data = getSvgDataById(countryId);
    if (data) {
      setSvgData(data);
      const extractedViewBox = getViewBoxFromSVG(data);
      setViewBox(extractedViewBox);
    }
  }, [countryId]);

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
      className="w-full max-w-3xl mx-auto h-full flex flex-col"
    >
      {/* Puzzle Container */}
      <div 
        ref={dropRef}
        className="relative h-[500px] flex items-center justify-center flex-grow"
      >
        {/* Country Outline (using actual SVG map data as black silhouette) */}
        <div className="w-full h-full absolute top-0 left-0 pointer-events-none">
          {svgData ? (
            <div className="w-full h-full bg-transparent">
              <svg className="w-full h-full" viewBox={viewBox} preserveAspectRatio="xMidYMid meet">
                <g fill="black" stroke="none">
                  {/* Extract only the path data from the SVG without IDs or other attributes */}
                  {svgData.match(/<path[^>]*d="([^"]+)"/g)?.map((pathMatch, index) => {
                    const dMatch = pathMatch.match(/d="([^"]+)"/);
                    const dAttr = dMatch ? dMatch[1] : '';
                    return (
                      <path
                        key={`outline-${index}`}
                        d={dAttr}
                        fill="black"
                        stroke="none"
                      />
                    );
                  })}
                </g>
              </svg>
            </div>
          ) : (
            <svg className="w-full h-full" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet">
              <path 
                d={outlinePath} 
                fill="black" 
                stroke="none" 
              />
            </svg>
          )}
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
          <div className="text-center p-6 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg max-w-md z-10">
            <h3 className="font-heading font-bold text-2xl mb-3 text-gray-800">
              Memorize the Map of {countryName}
            </h3>
            <p className="text-gray-600 mb-4">
              Drag and place the {gameState?.regions.length || '0'} states of {countryName} in their correct positions on the map.
            </p>
            <Button 
              onClick={handleStartPuzzle}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6"
            >
              Start Puzzle
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
