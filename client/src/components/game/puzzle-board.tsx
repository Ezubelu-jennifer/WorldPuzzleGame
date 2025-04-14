import React, { useState, useEffect, useRef } from "react";
import { useGame } from "@/context/game-context";
import { useDrop } from "@/hooks/useDrop";
import { StatePiece } from "@/components/game/state-piece";
import { Button } from "@/components/ui/button";
import { getSvgDataById } from "@/data/svg-map-data";
import { getViewBoxFromSVG, extractNigeriaRegions, extractKenyaRegions } from "@/data/svg-parser";
import { CountrySvgMap } from "@/components/maps/country-svg-map";
import { useDragContext } from "@/context/drag-context";
import { calculatePathCentroid } from "../../utils/calculate-centroid";

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
                        // Nigeria States (lowercase state names for case-insensitive matching)
                        // Adding two-letter state codes as well for better matching
                        "enugu": { x: 290, y: 483 },
                        "en": { x: 290, y: 483 },
                        "lagos": { x: 232, y: 542 },
                        "la": { x: 232, y: 542 },
                        "zamfara": { x: 218, y: 262 },
                        "za": { x: 218, y: 262 },
                        "taraba": { x: 355, y: 368 },
                        "ta": { x: 355, y: 368 },
                        "kano": { x: 265, y: 256 },
                        "kn": { x: 265, y: 256 },
                        "imo": { x: 303, y: 532 },
                        "im": { x: 303, y: 532 },
                        "kwara": { x: 236, y: 405 },
                        "kw": { x: 236, y: 405 },
                        "kaduna": { x: 261, y: 313 },
                        "kd": { x: 261, y: 313 },
                        "katsina": { x: 229, y: 215 },
                        "kt": { x: 229, y: 215 },
                        "sokoto": { x: 181, y: 240 },
                        "so": { x: 181, y: 240 },
                        "plateau": { x: 308, y: 369 },
                        "pl": { x: 308, y: 369 },
                        "jigawa": { x: 291, y: 235 },
                        "ji": { x: 291, y: 235 },
                        "delta": { x: 264, y: 530 },
                        "de": { x: 264, y: 530 },
                        "ogun": { x: 228, y: 522 },
                        "og": { x: 228, y: 522 },
                        "osun": { x: 245, y: 485 },
                        "os": { x: 245, y: 485 },
                        "oyo": { x: 219, y: 468 },
                        "oy": { x: 219, y: 468 },
                        "borno": { x: 379, y: 240 },
                        "bo": { x: 379, y: 240 },
                        "yobe": { x: 333, y: 245 },
                        "yo": { x: 333, y: 245 },
                        "edo": { x: 270, y: 488 },
                        "ed": { x: 270, y: 488 },
                        "adamawa": { x: 350, y: 319 },
                        "ad": { x: 350, y: 319 },
                        "abia": { x: 304, y: 512 },
                        "ab": { x: 304, y: 512 },
                        "nasarawa": { x: 297, y: 408 },
                        "na": { x: 297, y: 408 },
                        
                        // Additional Nigeria states with fine-tuned coordinates
                        "anambra": { x: 289, y: 498 },
                        "an": { x: 289, y: 498 },
                        "bauchi": { x: 310, y: 310 },
                        "ba": { x: 310, y: 310 },
                        "bayelsa": { x: 278, y: 550 },
                        "by": { x: 278, y: 550 },
                        "benue": { x: 320, y: 420 },
                        "be": { x: 320, y: 420 },
                        "cross river": { x: 335, y: 510 },
                        "cr": { x: 335, y: 510 },
                        "ebonyi": { x: 315, y: 493 },
                        "eb": { x: 315, y: 493 },
                        "ekiti": { x: 255, y: 471 },
                        "ek": { x: 255, y: 471 },
                        "gombe": { x: 327, y: 295 },
                        "go": { x: 327, y: 295 },
                        "kebbi": { x: 182, y: 303 },
                        "ke": { x: 182, y: 303 },
                        "kogi": { x: 269, y: 435 },
                        "ko": { x: 269, y: 435 },
                        "niger": { x: 232, y: 368 },
                        "ni": { x: 232, y: 368 },
                        "ondo": { x: 250, y: 505 },
                        "on": { x: 250, y: 505 },
                        "rivers": { x: 293, y: 545 },
                        "ri": { x: 293, y: 545 },
                        "akwa ibom": { x: 319, y: 539 },
                        "ai": { x: 319, y: 539 },
                        "fct": { x: 275, y: 390 },
                        
                        // Kenya Counties with proper coordinates
                        "nairobi": { x: 571, y: 412 },
                        "na": { x: 571, y: 412 },
                        "mombasa": { x: 644, y: 502 },
                        "mo": { x: 644, y: 502 },
                        "kisumu": { x: 502, y: 407 },
                        "ki": { x: 502, y: 407 },
                        "nakuru": { x: 541, y: 381 },
                        "nk": { x: 541, y: 381 },
                        "kiambu": { x: 562, y: 395 },
                        "kb": { x: 562, y: 395 },
                        "uasin gishu": { x: 523, y: 349 },
                        "ug": { x: 523, y: 349 },
                        "machakos": { x: 587, y: 431 },
                        "ma": { x: 587, y: 431 },
                        "kilifi": { x: 640, y: 478 },
                        "kl": { x: 640, y: 478 },
                        "kajiado": { x: 560, y: 432 },
                        "kj": { x: 560, y: 432 },
                        
                        // Additional Kenya counties
                        "baringo": { x: 527, y: 351 },
                        "br": { x: 527, y: 351 },
                        "bomet": { x: 516, y: 394 },
                        "bm": { x: 516, y: 394 },
                        "bungoma": { x: 497, y: 365 },
                        "bn": { x: 497, y: 365 },
                        "busia": { x: 489, y: 385 },
                        "bs": { x: 489, y: 385 },
                        "elgeyo marakwet": { x: 528, y: 335 },
                        "em": { x: 528, y: 335 },
                        "embu": { x: 574, y: 372 },
                        "eb": { x: 574, y: 372 },
                        "garissa": { x: 622, y: 400 },
                        "ga": { x: 622, y: 400 },
                        "homa bay": { x: 488, y: 420 },
                        "hb": { x: 488, y: 420 },
                        "isiolo": { x: 580, y: 324 },
                        "is": { x: 580, y: 324 },
                        "kakamega": { x: 505, y: 377 },
                        "kk": { x: 505, y: 377 },
                        "kericho": { x: 524, y: 380 },
                        "ke": { x: 524, y: 380 },
                        "kirinyaga": { x: 562, y: 374 },
                        "kr": { x: 562, y: 374 },
                        "kwale": { x: 622, y: 515 },
                        "kw": { x: 622, y: 515 },
                        "laikipia": { x: 551, y: 350 },
                        "la": { x: 551, y: 350 },
                        "lamu": { x: 662, y: 444 },
                        "lm": { x: 662, y: 444 },
                        "mandera": { x: 664, y: 256 },
                        "mn": { x: 664, y: 256 },
                        "marsabit": { x: 585, y: 258 },
                        "mr": { x: 585, y: 258 },
                        "meru": { x: 572, y: 344 },
                        "me": { x: 572, y: 344 },
                        "migori": { x: 480, y: 437 },
                        "mg": { x: 480, y: 437 },
                        "muranga": { x: 553, y: 381 },
                        "mu": { x: 553, y: 381 },
                        "nandi": { x: 517, y: 368 },
                        "nd": { x: 517, y: 368 },
                        "narok": { x: 530, y: 424 },
                        "nr": { x: 530, y: 424 },
                        "nyamira": { x: 501, y: 392 },
                        "ny": { x: 501, y: 392 },
                        "nyandarua": { x: 540, y: 365 },
                        "nn": { x: 540, y: 365 },
                        "nyeri": { x: 557, y: 365 },
                        "ne": { x: 557, y: 365 },
                        "samburu": { x: 565, y: 295 },
                        "sm": { x: 565, y: 295 },
                        "siaya": { x: 492, y: 400 },
                        "si": { x: 492, y: 400 },
                        "taita taveta": { x: 605, y: 485 },
                        "tt": { x: 605, y: 485 },
                        "tana river": { x: 640, y: 420 },
                        "tr": { x: 640, y: 420 },
                        "tharaka nithi": { x: 575, y: 358 },
                        "tn": { x: 575, y: 358 },
                        "trans nzoia": { x: 508, y: 350 },
                        "tz": { x: 508, y: 350 },
                        "turkana": { x: 519, y: 255 },
                        "tu": { x: 519, y: 255 },
                        "vihiga": { x: 499, y: 379 },
                        "vi": { x: 499, y: 379 },
                        "wajir": { x: 640, y: 312 },
                        "wa": { x: 640, y: 312 },
                        "west pokot": { x: 508, y: 330 },
                        "wp": { x: 508, y: 330 }
                      };
                      
                      // Now use the imported centroid calculation utility
                      
                      // Let's get the centroid of each region's SVG path
                      const calculateCentroid = () => {
                        // Find the SVG region data that corresponds to this game state region
                        const region = svgRegions.find(r => {
                          const regionId = r.id.toLowerCase();
                          const regionName = draggedRegion.name.toLowerCase();
                          
                          // Try different matching patterns for better matching
                          return regionId.includes(regionName) || 
                                 regionName.includes(regionId) || 
                                 regionId.includes(regionName.substring(0, 3)) ||
                                 regionName.includes(regionId.substring(0, 3));
                        });
                        
                        if (region && region.path) {
                          try {
                            // Calculate the actual centroid based on the SVG path
                            console.log(`Calculating centroid for ${draggedRegion.name} from SVG path`);
                            const centroid = calculatePathCentroid(region.path);
                            console.log(`Calculated centroid for ${draggedRegion.name}:`, centroid);
                            return centroid;
                          } catch (error) {
                            console.error(`Error calculating centroid for ${draggedRegion.name}:`, error);
                          }
                        }
                        
                        // If SVG path calculation fails, fall back to manual corrections
                        const stateName = draggedRegion.name.toLowerCase();
                        
                        // Check if this state has a manual correction
                        if (statePositionCorrections[stateName]) {
                          console.log(`Using manual position correction for ${draggedRegion.name}:`, statePositionCorrections[stateName]);
                          return statePositionCorrections[stateName];
                        }
                        
                        // Try alternate name formats (this helps with state codes vs names)
                        const alternateNames = [
                          stateName,                                     // e.g., "lagos"
                          stateName.replace(/\s+/g, ''),                 // e.g., "federalcapitalterritory"
                          stateName.split(' ').map(p => p[0]).join(''),  // e.g., "fct" for "Federal Capital Territory"
                          `ng-${stateName.substring(0, 2)}`,             // e.g., "ng-la" for Lagos
                          `ke-${stateName.substring(0, 2)}`              // e.g., "ke-na" for Nairobi
                        ];
                        
                        // Check all alternate names for matches in the corrections
                        for (const altName of alternateNames) {
                          if (statePositionCorrections[altName]) {
                            console.log(`Using alternative name correction for ${draggedRegion.name} (${altName}):`, statePositionCorrections[altName]);
                            return statePositionCorrections[altName];
                          }
                        }
                        
                        // As a last resort, use the predefined coordinates from the game state
                        console.log(`Using default coordinates for ${draggedRegion.name}:`, {
                          x: draggedRegion.correctX,
                          y: draggedRegion.correctY
                        });
                        
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
