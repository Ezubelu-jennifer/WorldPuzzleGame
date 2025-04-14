import React, { useState, useEffect, useRef } from "react";
import { useGame } from "@/context/game-context";
import { useDrop } from "@/hooks/useDrop";
import { StatePiece } from "@/components/game/state-piece";
import { Button } from "@/components/ui/button";
import { getSvgDataById } from "@/data/svg-map-data";
import { getViewBoxFromSVG, extractNigeriaRegions, extractKenyaRegions } from "@/data/svg-parser";
import { CountrySvgMap } from "@/components/maps/country-svg-map";
import { useDragContext } from "@/context/drag-context";
import { getPathCentroid } from "@/utils/svg-clipper";

// Configuration for the improved guidance system
const ENABLE_ALL_GUIDES = true;          // When true, shows faint outlines for all states
const SHOW_ALL_POSITION_DOTS = true;     // When true, shows target dots for all unplaced regions
const HIGHLIGHT_TARGET_REGION = true;    // When true, highlights the specific target region when dragging
const SHOW_CROSSHAIR_GUIDES = true;      // When true, shows crosshair guides for precise placement
const ENHANCED_DOTS = true;              // When true, uses larger dots with white outlines

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
                hasRegions ? (
                  () => {
                    // Create an array to hold all guidance elements
                    const guidanceElements: React.ReactNode[] = [];
                    
                    // Get all unplaced regions
                    const unplacedRegions = gameState.regions.filter(region => !region.isPlaced);
                    
                    // If we have an actively dragged piece, find it and prioritize it
                    const draggedRegion = draggedPieceId 
                      ? gameState.regions.find(region => region.id === draggedPieceId && !region.isPlaced)
                      : null;
                      
                    // Helper function to find a matching region in the SVG for a game region
                    const findMatchingRegion = (gameRegion: any) => {
                      if (!gameRegion) return null;
                      
                      // Attempt to find a direct match by name
                      let matchingRegion = svgRegions.find(svgRegion => 
                        svgRegion.name.toLowerCase() === gameRegion.name.toLowerCase()
                      );
                      
                      // If no direct match, try for Nigeria states using state codes
                      if (!matchingRegion && countryId === 1) {
                        // Map of Nigerian state names to their IDs
                        const stateIdMap: Record<string, string> = {
                          'Abia': 'NG-AB', 'Adamawa': 'NG-AD', 'Akwa Ibom': 'NG-AK', 'Anambra': 'NG-AN',
                          'Bauchi': 'NG-BA', 'Bayelsa': 'NG-BY', 'Benue': 'NG-BE', 'Borno': 'NG-BO',
                          'Cross River': 'NG-CR', 'Delta': 'NG-DE', 'Ebonyi': 'NG-EB', 'Edo': 'NG-ED',
                          'Ekiti': 'NG-EK', 'Enugu': 'NG-EN', 'Federal Capital Territory': 'NG-FC', 
                          'FCT': 'NG-FC', 'Gombe': 'NG-GO', 'Imo': 'NG-IM', 'Jigawa': 'NG-JI', 
                          'Kaduna': 'NG-KD', 'Kano': 'NG-KN', 'Katsina': 'NG-KT', 'Kebbi': 'NG-KE', 
                          'Kogi': 'NG-KO', 'Kwara': 'NG-KW', 'Lagos': 'NG-LA', 'Nasarawa': 'NG-NA', 
                          'Niger': 'NG-NI', 'Ogun': 'NG-OG', 'Ondo': 'NG-ON', 'Osun': 'NG-OS', 
                          'Oyo': 'NG-OY', 'Plateau': 'NG-PL', 'Rivers': 'NG-RI', 'Sokoto': 'NG-SO', 
                          'Taraba': 'NG-TA', 'Yobe': 'NG-YO', 'Zamfara': 'NG-ZA'
                        };
                        
                        const stateId = stateIdMap[gameRegion.name];
                        if (stateId) {
                          matchingRegion = svgRegions.find(r => r.id === stateId);
                        }
                      }
                      
                      // If still no match, try partial name matching as a last resort
                      if (!matchingRegion) {
                        matchingRegion = svgRegions.find(r => 
                          r.name.toLowerCase().includes(gameRegion.name.toLowerCase()) || 
                          gameRegion.name.toLowerCase().includes(r.name.toLowerCase())
                        );
                      }
                      
                      return matchingRegion;
                    };
                    
                    // Function to render a guidance dot for a specific region
                    const renderGuidanceDot = (gameRegion: any, isPrimary: boolean = false) => {
                      const svgRegion = findMatchingRegion(gameRegion);
                      if (!svgRegion) return null;
                      
                      // Get the centroid from the path
                      const centroid = getPathCentroid(svgRegion.path, svgRegion.id);
                      if (!centroid) return null;
                      
                      // Calculate appropriate dot size based on viewBox
                      const [, , width, height] = viewBox.split(' ').map(Number);
                      const baseDotSize = Math.min(width, height) * 0.015;
                      const dotSize = isPrimary ? baseDotSize * 1.2 : baseDotSize * 0.8;
                      
                      // Set dot styles based on whether this is the primary (dragged) piece
                      const dotColor = isPrimary ? "rgba(255,0,0,0.9)" : "rgba(255,220,0,0.8)";
                      const outlineColor = isPrimary ? "white" : "rgba(255,255,255,0.7)";
                      const pulseSpeed = isPrimary ? "1.5s" : "3s";
                      const opacity = isPrimary ? 1 : 0.8;
                      
                      return (
                        <g key={`dot-${gameRegion.id}`} className={isPrimary ? "primary-dot" : "secondary-dot"}>
                          {/* If primary dot and crosshair is enabled, show crosshair guides */}
                          {isPrimary && SHOW_CROSSHAIR_GUIDES && (
                            <>
                              <line 
                                x1={0} 
                                y1={centroid.y} 
                                x2={width} 
                                y2={centroid.y} 
                                stroke="rgba(255,255,255,0.4)" 
                                strokeWidth={dotSize * 0.3} 
                                strokeDasharray="5,5" 
                              />
                              <line 
                                x1={centroid.x} 
                                y1={0} 
                                x2={centroid.x} 
                                y2={height} 
                                stroke="rgba(255,255,255,0.4)" 
                                strokeWidth={dotSize * 0.3} 
                                strokeDasharray="5,5" 
                              />
                            </>
                          )}
                          
                          {/* Draw the dot */}
                          {ENHANCED_DOTS ? (
                            <>
                              {/* Outer halo effect */}
                              <circle 
                                cx={centroid.x} 
                                cy={centroid.y} 
                                r={dotSize * 2} 
                                fill="none" 
                                stroke={outlineColor} 
                                strokeWidth={dotSize * 0.3}
                                style={{ 
                                  animation: `pulse ${pulseSpeed} infinite ease-in-out`,
                                  animationDelay: isPrimary ? "0s" : `${(gameRegion.id % 5) * 0.15}s`,
                                  opacity: opacity * 0.5
                                }}
                              />
                              
                              {/* White outline */}
                              <circle 
                                cx={centroid.x} 
                                cy={centroid.y} 
                                r={dotSize * 1.3} 
                                fill={outlineColor} 
                                style={{ 
                                  opacity: opacity * 0.8
                                }}
                              />
                              
                              {/* Colored center */}
                              <circle 
                                cx={centroid.x} 
                                cy={centroid.y} 
                                r={dotSize} 
                                fill={dotColor} 
                                style={{ 
                                  filter: isPrimary ? 'drop-shadow(0 0 4px rgba(255,255,255,0.7))' : 'none',
                                  opacity: opacity
                                }}
                              />
                            </>
                          ) : (
                            // Simple dot for non-enhanced mode
                            <circle 
                              cx={centroid.x} 
                              cy={centroid.y} 
                              r={dotSize} 
                              fill={dotColor} 
                              opacity={opacity}
                            />
                          )}
                        </g>
                      );
                    };
                    
                    // If region highlighting is enabled, and we have a dragged piece,
                    // highlight the target region on the map
                    if (HIGHLIGHT_TARGET_REGION && draggedRegion) {
                      const matchingRegion = findMatchingRegion(draggedRegion);
                      if (matchingRegion && matchingRegion.id) {
                        guidanceElements.push(
                          <use 
                            key={`highlight-${draggedRegion.id}`}
                            href={`#${matchingRegion.id}`} 
                            fill="rgba(255,0,0,0.15)" 
                            stroke="rgba(255,0,0,0.3)"
                            strokeWidth="1.5"
                            className="pointer-events-none"
                          />
                        );
                      }
                    }
                    
                    // If we have a dragged piece, render its guidance dot
                    if (draggedRegion) {
                      const dot = renderGuidanceDot(draggedRegion, true);
                      if (dot) guidanceElements.push(dot);
                    }
                    
                    // If we should show all dots, render dots for all unplaced regions
                    if (SHOW_ALL_POSITION_DOTS && unplacedRegions.length > 0) {
                      // Limit the number of dots to avoid performance issues
                      const MAX_DOTS = 20;
                      const regionsToShow = unplacedRegions
                        .filter(r => r.id !== draggedPieceId) // Don't show dot for the dragged piece (already shown)
                        .slice(0, MAX_DOTS);
                      
                      // Add dots for all unplaced regions
                      regionsToShow.forEach(region => {
                        const dot = renderGuidanceDot(region, false);
                        if (dot) guidanceElements.push(dot);
                      });
                    }
                    
                    // Return all guidance elements
                    if (guidanceElements.length > 0) {
                      return <g className="guidance-elements">{guidanceElements}</g>;
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