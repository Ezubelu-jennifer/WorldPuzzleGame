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

// Configuration for the improved guidance system - ONLY RED DOTS MODE
const ENABLE_ALL_GUIDES = false;         // When true, shows faint outlines for all states
const SHOW_ALL_POSITION_DOTS = true;     // When true, shows target dots for all unplaced regions
const HIGHLIGHT_TARGET_REGION = false;   // When true, highlights the specific target region when dragging
const SHOW_CROSSHAIR_GUIDES = false;     // When true, shows crosshair guides for precise placement
const ENHANCED_DOTS = true;              // When true, uses larger dots with white outlines
const DOTS_ONLY_MODE = true;             // When true, only shows dots with no other visual elements

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
  
  // Debug logging for drag context (disabled to reduce console noise)
  // useEffect(() => {
  //   console.log("Current draggedPieceId:", draggedPieceId);
  // }, [draggedPieceId]);
  
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
                      // First try to find a matching region in the SVG data
                      const svgRegion = findMatchingRegion(gameRegion);
                      
                      // Generate possible region codes to try for centroid lookup
                      let regionCodes: string[] = [];
                      const regionName = gameRegion.name;
                      
                      if (countryId === 1) { // Nigeria
                        // Try standard format first (NG-XX)
                        if (svgRegion && svgRegion.id) {
                          regionCodes.push(`NG-${svgRegion.id}`);
                        }
                        
                        // Try to match by first two letters of region name
                        const stateCodes = {
                          "Abia": "AB", "Adamawa": "AD", "Akwa Ibom": "AK", "Anambra": "AN",
                          "Bauchi": "BA", "Bayelsa": "BY", "Benue": "BE", "Borno": "BO",
                          "Cross River": "CR", "Delta": "DE", "Ebonyi": "EB", "Edo": "ED",
                          "Ekiti": "EK", "Enugu": "EN", "Federal Capital Territory": "FC",
                          "FCT": "FC", "Gombe": "GO", "Imo": "IM", "Jigawa": "JI",
                          "Kaduna": "KD", "Kano": "KN", "Katsina": "KT", "Kebbi": "KE", 
                          "Kogi": "KO", "Kwara": "KW", "Lagos": "LA", "Nasarawa": "NA",
                          "Niger": "NI", "Ogun": "OG", "Ondo": "ON", "Osun": "OS",
                          "Oyo": "OY", "Plateau": "PL", "Rivers": "RI", "Sokoto": "SO",
                          "Taraba": "TA", "Yobe": "YO", "Zamfara": "ZA"
                        };
                        
                        // Loop through all possible state names and try to find a match
                        for (const [stateName, code] of Object.entries(stateCodes)) {
                          if (regionName.includes(stateName) || stateName.includes(regionName)) {
                            regionCodes.push(`NG-${code}`);
                          }
                        }
                        
                        // Add generic Nigeria code as fallback
                        regionCodes.push("NG");
                      } else if (countryId === 2) { // Kenya
                        // Try standard format first (KE-XX)
                        if (svgRegion && svgRegion.id) {
                          regionCodes.push(`KE-${svgRegion.id}`);
                        }
                        
                        // Try custom format for special counties
                        if (regionName.includes("Taita") || regionName.includes("Taveta")) {
                          regionCodes.push("KE-CUSTOM-TaitaTaveta");
                        }
                        if (regionName.includes("Tharaka") || regionName.includes("Nithi")) {
                          regionCodes.push("KE-CUSTOM-Tharaka");
                        }
                        if (regionName.includes("Trans") || regionName.includes("Nzoia")) {
                          regionCodes.push("KE-CUSTOM-TransNzoia");
                        }
                        if (regionName.includes("Elgeyo") || regionName.includes("Marakwet")) {
                          regionCodes.push("KE-CUSTOM-KeiyoMarakwet");
                        }
                        
                        // Try all numbered county codes (KE-01 through KE-47)
                        for (let i = 1; i <= 47; i++) {
                          const countyCode = `KE-${i.toString().padStart(2, '0')}`;
                          regionCodes.push(countyCode);
                        }
                        
                        // Add generic Kenya code as fallback
                        regionCodes.push("KE");
                      }
                      
                      // Try to get the centroid using the region's SVG path and region codes
                      let centroid = null;
                      let pathToUse = svgRegion ? svgRegion.path : "";
                      
                      // Special case for Ebonyi
                      if (regionName === "Ebonyi") {
                        // Hardcoded centroid for Ebonyi - precisely calculated from path
                        centroid = { x: 310.0, y: 515.0 };
                        console.log("Using hardcoded centroid for Ebonyi");
                      }
                      
                      // Special case for Federal Capital Territory - USING PERFECT CIRCLE
                      if (regionName === "Federal Capital Territory" || regionName === "FCT") {
                        // Hardcoded centroid for FCT - precisely at the center of circle
                        centroid = { x: 380.0, y: 370.0 };
                        console.log("Using hardcoded centroid for FCT:", centroid.x, centroid.y);
                      }
                      
                      // Special case for Nasarawa - USING PERFECT CIRCLE
                      if (regionName === "Nasarawa") {
                        // Hardcoded centroid for Nasarawa - precisely at the center of circle
                        centroid = { x: 404.0, y: 340.0 };
                        console.log("Using hardcoded centroid for Nasarawa:", centroid.x, centroid.y);
                      }
                      
                      // If not one of the special cases, try all region codes until we find a centroid
                      if (!centroid) {
                        for (const code of regionCodes) {
                          if (pathToUse) {
                            centroid = getPathCentroid(pathToUse, code);
                            if (centroid) break;
                          }
                        }
                      }
                      
                      // If we still don't have a centroid, create a fallback based on region ID
                      if (!centroid) {
                        // Fallback centroids based on country and region ID
                        if (countryId === 1) { // Nigeria
                          // Create a grid-like distribution based on region ID
                          const id = gameRegion.id;
                          const row = Math.floor(id / 6);
                          const col = id % 6;
                          const x = 200 + col * 50;
                          const y = 200 + row * 50;
                          centroid = { x, y };
                        } else if (countryId === 2) { // Kenya
                          // Create a grid-like distribution based on region ID
                          const id = gameRegion.id;
                          const row = Math.floor((id - 100) / 7);
                          const col = (id - 100) % 7;
                          const x = 150 + col * 60;
                          const y = 300 + row * 60;
                          centroid = { x, y };
                        }
                      }

                      // Final safety check to ensure we always have a centroid
                      if (!centroid) {
                        centroid = { x: 400, y: 400 }; // Default center position as absolute last resort
                      }
                      
                      // Calculate appropriate dot size based on viewBox
                      const [, , width, height] = viewBox.split(' ').map(Number);
                      const baseDotSize = Math.min(width, height) * 0.025; // Larger dots for better visibility
                      const dotSize = isPrimary ? baseDotSize * 1.5 : baseDotSize * 1.2;
                      
                      // Set dot styles - using only red dots as per user request
                      const dotColor = "rgba(255,0,0,1)"; // Pure red for all dots
                      const outlineColor = "white"; // White outline for better contrast
                      const pulseSpeed = isPrimary ? "1.5s" : "2.5s"; // Faster pulse animation
                      const opacity = isPrimary ? 1 : 0; // Hide non-primary (secondary) dots
                      
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
                                stroke="rgba(255,255,255,0.6)" 
                                strokeWidth={dotSize * 0.5} 
                                strokeDasharray="5,5" 
                              />
                              <line 
                                x1={centroid.x} 
                                y1={0} 
                                x2={centroid.x} 
                                y2={height} 
                                stroke="rgba(255,255,255,0.6)" 
                                strokeWidth={dotSize * 0.5} 
                                strokeDasharray="5,5" 
                              />
                            </>
                          )}
                          
                          {/* Draw the dot */}
                          {/* Special rendering for FCT and Nasarawa */}
                          {(regionName === "Federal Capital Territory" || regionName === "FCT" || regionName === "Nasarawa") ? (
                            <>
                              {/* Special outer ring indicator for circular regions */}
                              <circle 
                                cx={centroid.x} 
                                cy={centroid.y} 
                                r={dotSize * 3.5} 
                                fill="none" 
                                stroke={dotColor} 
                                strokeWidth={dotSize * 0.4}
                                strokeDasharray="3,3"
                                style={{ 
                                  animation: `pulse 1.5s infinite ease-in-out`,
                                  opacity: opacity * 0.8
                                }}
                              />
                              
                              {/* Larger halo for special regions */}
                              <circle 
                                cx={centroid.x} 
                                cy={centroid.y} 
                                r={dotSize * 2.5} 
                                fill="none" 
                                stroke={outlineColor} 
                                strokeWidth={dotSize * 0.5}
                                style={{ 
                                  animation: `pulse ${pulseSpeed} infinite ease-in-out`,
                                  opacity: opacity * 0.7
                                }}
                              />
                              
                              {/* Larger white outline */}
                              <circle 
                                cx={centroid.x} 
                                cy={centroid.y} 
                                r={dotSize * 1.6} 
                                fill={outlineColor} 
                                style={{ 
                                  opacity: opacity * 0.9
                                }}
                              />
                              
                              {/* Colored center */}
                              <circle 
                                cx={centroid.x} 
                                cy={centroid.y} 
                                r={dotSize * 1.2} 
                                fill={dotColor} 
                                style={{ 
                                  filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.9))',
                                  opacity: opacity
                                }}
                              />
                              
                              {/* Label for special regions */}
                              <text
                                x={centroid.x}
                                y={centroid.y + (regionName === "Nasarawa" ? -dotSize * 3 : dotSize * 3)}
                                textAnchor="middle"
                                fill="#000000"
                                stroke="#FFFFFF"
                                strokeWidth="0.5"
                                fontSize={dotSize * 1.2}
                                fontWeight="bold"
                              >
                                {regionName === "Federal Capital Territory" ? "FCT" : regionName}
                              </text>
                            </>
                          ) : ENHANCED_DOTS ? (
                            // Standard enhanced dots for regular regions
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
                    
                    // Always show dots for all regions (both placed and unplaced)
                    if (SHOW_ALL_POSITION_DOTS) {
                      // Get all regions (including placed ones)
                      const allRegions = gameState.regions;
                      
                      // Add dots for ALL regions (both placed and unplaced)
                      allRegions
                        .filter(r => r.id !== draggedPieceId) // Don't show dot for the dragged piece (already shown)
                        .forEach(region => {
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