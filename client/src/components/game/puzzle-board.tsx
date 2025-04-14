import React, { useState, useEffect, useRef } from "react";
import { useGame } from "@/context/game-context";
import { useDrop } from "@/hooks/useDrop";
import { StatePiece } from "@/components/game/state-piece";
import { Button } from "@/components/ui/button";
import { getSvgDataById } from "@/data/svg-map-data";
import { getViewBoxFromSVG, extractNigeriaRegions, extractKenyaRegions } from "@/data/svg-parser";
import { CountrySvgMap } from "@/components/maps/country-svg-map";
import { useDragContext } from "@/context/drag-context";

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
  const { gameState, placePiece, useHint } = useGame();
  const { draggedPieceId } = useDragContext();
  const [gameStarted, setGameStarted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgData, setSvgData] = useState<string>("");
  const [viewBox, setViewBox] = useState<string>("0 0 400 300");
  const [highlightedRegion, setHighlightedRegion] = useState<string | null>(null);
  const [svgRegions, setSvgRegions] = useState<{ id: string; name: string; path: string }[]>([]);
  
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
      
      // Extract regions
      const extractedRegions = countryId === 1 
        ? extractNigeriaRegions(data)
        : extractKenyaRegions(data);
      setSvgRegions(extractedRegions);
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
  
  // Debug logging for drag context
  useEffect(() => {
    console.log("Current draggedPieceId:", draggedPieceId);
  }, [draggedPieceId]);
  
  // Handle region click
  const handleRegionClick = (regionId: string, regionName: string) => {
    console.log(`Clicked region: ${regionId} - ${regionName}`);
    
    // Find matching game region
    if (hasRegions && gameState) {
      // Get the matching region from gameState
      const gameRegion = gameState.regions.find(r => {
        // First try direct name match (case insensitive)
        if (r.name.toLowerCase() === regionName.toLowerCase()) {
          return true;
        }
        
        // Try to see if the game region name contains the SVG region name or vice versa
        if (regionName.toLowerCase().includes(r.name.toLowerCase()) || 
            r.name.toLowerCase().includes(regionName.toLowerCase())) {
          return true;
        }
        
        // For Nigeria, try to match state codes
        if (countryId === 1 && regionId.startsWith('NG-')) {
          // If our region name contains the short code (like AB, AD, etc.), it's a match
          const stateCode = regionId.replace('NG-', '');
          return r.name.toUpperCase().includes(stateCode);
        }
        
        // For Kenya, try to match county numbers
        if (countryId === 2 && regionId.startsWith('KE-')) {
          // If the region ID is something like KE-01, KE-02, etc.
          const countyNum = parseInt(regionId.replace('KE-', ''), 10);
          // Match if the game region has a number that matches
          return r.name.includes(String(countyNum));
        }
        
        return false;
      });
      
      if (gameRegion && !gameRegion.isPlaced) {
        console.log(`Found matching game region: ${gameRegion.name}`);
        // Trigger a hint for this region
        setHighlightedRegion(regionId);
        // Trigger hint functionality
        useHint();
      } else {
        console.log(`No matching unplaced game region found for ${regionName}`);
      }
    }
  };

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
        {/* Country Outline (using actual interactive SVG map) */}
        <div className="w-full h-full absolute top-0 left-0">
          {svgData ? (
            <CountrySvgMap
              countryId={countryId}
              countryName={countryName}
              svgData={svgData}
              highlightRegion={highlightedRegion}
              onRegionClick={handleRegionClick}
              className="w-full h-full"
              renderOverlay={
                // Render the guidance dot as an overlay within the SVG map component
                // This ensures it respects the same zoom and pan transformations
                hasRegions && draggedPieceId ? (
                  () => {
                    const draggedRegion = gameState.regions.find(
                      region => region.id === draggedPieceId && !region.isPlaced
                    );
                    
                    if (draggedRegion) {
                      // Define manual position corrections for problematic states
                      const statePositionCorrections: Record<string, {x: number, y: number}> = {
                        // The keys are lowercase state names for case-insensitive matching
                        "enugu": { x: 290, y: 483 },
                        "lagos": { x: 248, y: 542 },
                        "zamfara": { x: 218, y: 262 },
                        "taraba": { x: 355, y: 368 }
                      };
                      
                      // Let's get the centroid of each region's SVG path
                      const calculateCentroid = () => {
                        // Check for manual position corrections first
                        const stateName = draggedRegion.name.toLowerCase();
                        if (statePositionCorrections[stateName]) {
                          console.log(`Using manual position correction for ${draggedRegion.name}`);
                          return statePositionCorrections[stateName];
                        }
                        
                        // Find the SVG region data that corresponds to this game state region
                        const region = svgRegions.find(r => {
                          const regionId = r.id.toLowerCase();
                          const regionName = draggedRegion.name.toLowerCase();
                          return regionId.includes(regionName) || regionName.includes(regionId);
                        });
                        
                        if (region) {
                          console.log(`Found SVG data for region: ${draggedRegion.name}`);
                        }
                        
                        // Use the predefined coordinates from the game state
                        return {
                          x: draggedRegion.correctX,
                          y: draggedRegion.correctY
                        };
                      };
                      
                      const centroid = calculateCentroid();
                      
                      return (
                        <g key={`guidance-${draggedRegion.id}`} className="guidance-marker">
                          {/* Outer glow effect */}
                          <circle 
                            cx={centroid.x} 
                            cy={centroid.y} 
                            r="22" 
                            fill="none" 
                            stroke="rgba(255,255,255,0.5)" 
                            strokeWidth="2"
                            style={{ 
                              animation: 'pulse 2s infinite ease-in-out',
                              animationDelay: "0.3s",
                              transformOrigin: 'center center',
                              filter: 'blur(2px)'
                            }}
                          />
                          
                          {/* Pulsing outer circle */}
                          <circle 
                            cx={centroid.x} 
                            cy={centroid.y} 
                            r="16" 
                            fill="none" 
                            stroke="rgba(255,0,0,0.9)" 
                            strokeWidth="4"
                            style={{ 
                              animation: 'pulse 1.5s infinite ease-in-out',
                              transformOrigin: 'center center',
                              filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.9))'
                            }}
                          />
                          
                          {/* Inner solid dot */}
                          <circle 
                            cx={centroid.x} 
                            cy={centroid.y} 
                            r="7" 
                            fill="red" 
                            stroke="white"
                            strokeWidth="1.5"
                            style={{
                              filter: 'drop-shadow(0 0 6px white)'
                            }}
                          />
                          
                          {/* Cross hairs */}
                          <line 
                            x1={centroid.x - 20} 
                            y1={centroid.y} 
                            x2={centroid.x - 10} 
                            y2={centroid.y} 
                            stroke="rgba(255,0,0,0.7)" 
                            strokeWidth="2"
                            style={{ filter: 'drop-shadow(0 0 2px white)' }}
                          />
                          <line 
                            x1={centroid.x + 10} 
                            y1={centroid.y} 
                            x2={centroid.x + 20} 
                            y2={centroid.y} 
                            stroke="rgba(255,0,0,0.7)" 
                            strokeWidth="2"
                            style={{ filter: 'drop-shadow(0 0 2px white)' }}
                          />
                          <line 
                            x1={centroid.x} 
                            y1={centroid.y - 20} 
                            x2={centroid.x} 
                            y2={centroid.y - 10} 
                            stroke="rgba(255,0,0,0.7)" 
                            strokeWidth="2"
                            style={{ filter: 'drop-shadow(0 0 2px white)' }}
                          />
                          <line 
                            x1={centroid.x} 
                            y1={centroid.y + 10} 
                            x2={centroid.x} 
                            y2={centroid.y + 20} 
                            stroke="rgba(255,0,0,0.7)" 
                            strokeWidth="2"
                            style={{ filter: 'drop-shadow(0 0 2px white)' }}
                          />
                        </g>
                      );
                    }
                    
                    return null;
                  }
                ) : undefined
              }
            />
          ) : (
            <svg className="w-full h-full" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet">
              <path 
                d={outlinePath} 
                fill="#e5e5e5" 
                stroke="#999999"
                strokeWidth="2.5"
                style={{
                  filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.3))'
                }}
              />
            </svg>
          )}
        </div>
  
        {/* Puzzle Pieces that have been placed on the board */}
        {hasRegions && gameState.regions.map(region => 
          region.isPlaced && (
            <StatePiece
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
              Drag and place all {countryId === 1 ? 37 : 47} states of {countryName} in their correct positions on the map.
              <br/>
              <span className="text-sm mt-1 inline-block text-emerald-600">Click on an area of the map for hints!</span>
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
