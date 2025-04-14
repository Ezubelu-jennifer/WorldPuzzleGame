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
                      // Find the exact matching region on the map for the dragged piece
                      const findMatchingMapRegion = () => {
                        // First try to find the region in the SVG data by ID
                        // We'll try different matching patterns based on the region name

                        // For Nigeria, try to match by the NG- prefix + state code
                        // For Kenya, try to match by the KE- prefix + county name
                        
                        const getNigeriaStateCode = (stateName: string) => {
                          // Map of Nigerian state names to ISO codes
                          const stateCodeMap: Record<string, string> = {
                            'Abia': 'AB', 'Adamawa': 'AD', 'Akwa Ibom': 'AK', 'Anambra': 'AN',
                            'Bauchi': 'BA', 'Bayelsa': 'BY', 'Benue': 'BE', 'Borno': 'BO',
                            'Cross River': 'CR', 'Delta': 'DE', 'Ebonyi': 'EB', 'Edo': 'ED',
                            'Ekiti': 'EK', 'Enugu': 'EN', 'Federal Capital Territory': 'FC', 'FCT': 'FC',
                            'Gombe': 'GO', 'Imo': 'IM', 'Jigawa': 'JI', 'Kaduna': 'KD',
                            'Kano': 'KN', 'Katsina': 'KT', 'Kebbi': 'KE', 'Kogi': 'KO',
                            'Kwara': 'KW', 'Lagos': 'LA', 'Nasarawa': 'NA', 'Niger': 'NI',
                            'Ogun': 'OG', 'Ondo': 'ON', 'Osun': 'OS', 'Oyo': 'OY',
                            'Plateau': 'PL', 'Rivers': 'RI', 'Sokoto': 'SO', 'Taraba': 'TA',
                            'Yobe': 'YO', 'Zamfara': 'ZA'
                          };
                          
                          // Try direct lookup first
                          if (stateCodeMap[stateName]) {
                            return stateCodeMap[stateName];
                          }
                          
                          // Try case-insensitive lookup
                          const normalizedName = stateName.toLowerCase();
                          for (const [key, value] of Object.entries(stateCodeMap)) {
                            if (key.toLowerCase() === normalizedName) {
                              return value;
                            }
                          }
                          
                          // Try partial match
                          for (const [key, value] of Object.entries(stateCodeMap)) {
                            if (key.toLowerCase().includes(normalizedName) || 
                                normalizedName.includes(key.toLowerCase())) {
                              return value;
                            }
                          }
                          
                          return '';
                        };
                        
                        let matchingRegion;
                        
                        // Log available SVG regions
                        console.log(`Trying to match region '${draggedRegion.name}' (ID: ${draggedRegion.id})`);
                        
                        // Track all Nigeria state names and Kenya county names for debugging
                        const nigeriaStateNames = [
                          'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
                          'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'Federal Capital Territory', 'FCT',
                          'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi',
                          'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo',
                          'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
                        ];
                          
                        // If this is one of our problem states, log all available SVG regions for debugging
                        if (nigeriaStateNames.includes(draggedRegion.name)) {
                          console.log(`Debugging SVG regions to match with '${draggedRegion.name}':`);
                          svgRegions.forEach(r => {
                            if (r.name.toLowerCase().includes(draggedRegion.name.toLowerCase()) || 
                                draggedRegion.name.toLowerCase().includes(r.name.toLowerCase())) {
                              console.log(`- Potential match: ID="${r.id}", name="${r.name}"`);
                            }
                          });
                        }
                        
                        // First, try to find a direct name match for ANY country
                        // This is the most reliable way to match regions
                        matchingRegion = svgRegions.find(r => {
                          // Try EXACT name matching first (case insensitive)
                          return r.name.toLowerCase() === draggedRegion.name.toLowerCase();
                        });
                        
                        if (matchingRegion) {
                          console.log(`Found direct name match for ${draggedRegion.name} with SVG name: ${matchingRegion.name}`);
                        }
                        
                        // Special handling for problematic Nigerian states
                        if (!matchingRegion && countryId === 1) {
                          // First, log all available region names for debugging
                          console.log(`All available SVG regions for ${draggedRegion.name} matching:`);
                          svgRegions.forEach(r => {
                            console.log(`- Region ID: ${r.id}, Name: "${r.name}"`);
                          });
                          
                          // Direct mappings for problematic Nigerian states by explicit IDs
                          const stateIdMappings: Record<string, string> = {
                            'Imo': 'NG-IM',
                            'Lagos': 'NG-LA',
                            'Kwara': 'NG-KW',
                            'Kogi': 'NG-KO',
                            'Niger': 'NG-NI',
                            'Ogun': 'NG-OG',
                            'Ondo': 'NG-ON',
                            'Osun': 'NG-OS',
                            'Oyo': 'NG-OY',
                            'Plateau': 'NG-PL',
                            'Rivers': 'NG-RI',
                            'Gombe': 'NG-GO',
                            'Kebbi': 'NG-KE',
                            'Kaduna': 'NG-KD',
                            'Kano': 'NG-KN',
                            'Katsina': 'NG-KT',
                            'Enugu': 'NG-EN',
                            'Sokoto': 'NG-SO',
                            'Taraba': 'NG-TA',
                            'Yobe': 'NG-YO',
                            'Zamfara': 'NG-ZA'
                          };
                          
                          // Alternate names (as found in the SVG)
                          const stateNameMappings: Record<string, string> = {
                            'Imo': 'Imo State',
                            'Lagos': 'Lagos State',
                            'Kwara': 'Kwara State',
                            'Kogi': 'Kogi State',
                            'Niger': 'Niger State',
                            'Ogun': 'Ogun State',
                            'Ondo': 'Ondo State',
                            'Osun': 'Osun State',
                            'Oyo': 'Oyo State',
                            'Plateau': 'Plateau State',
                            'Rivers': 'Rivers State',
                            'Gombe': 'Gombe State',
                            'Kebbi': 'Kebbi State',
                            'Kaduna': 'Kaduna State',
                            'Kano': 'Kano State',
                            'Katsina': 'Katsina State',
                            'Enugu': 'Enugu State',
                            'Sokoto': 'Sokoto State', 
                            'Taraba': 'Taraba State',
                            'Yobe': 'Yobe State',
                            'Zamfara': 'Zamfara State'
                          };
                          
                          // First try direct ID matching
                          const directId = stateIdMappings[draggedRegion.name];
                          if (directId) {
                            const regionByDirectId = svgRegions.find(r => r.id === directId);
                            if (regionByDirectId) {
                              console.log(`Found match for ${draggedRegion.name} using direct ID: ${directId}`);
                              matchingRegion = regionByDirectId;
                            }
                          }
                          
                          // If we still don't have a match, try with alternate names
                          if (!matchingRegion) {
                            const alternativeName = stateNameMappings[draggedRegion.name];
                            if (alternativeName) {
                              matchingRegion = svgRegions.find(r => 
                                r.name.toLowerCase() === alternativeName.toLowerCase()
                              );
                              
                              if (matchingRegion) {
                                console.log(`Found match for ${draggedRegion.name} using alternate name: ${alternativeName}`);
                              }
                            }
                          }
                          
                          // Last resort partial matching
                          if (!matchingRegion) {
                            const partialMatches = svgRegions.filter(r => 
                              r.name.toLowerCase().includes(draggedRegion.name.toLowerCase()) || 
                              draggedRegion.name.toLowerCase().includes(r.name.toLowerCase())
                            );
                            
                            if (partialMatches.length > 0) {
                              console.log(`Found ${partialMatches.length} partial matches for ${draggedRegion.name}:`);
                              partialMatches.forEach((match, i) => {
                                console.log(`  ${i+1}. "${match.name}" (ID: ${match.id})`);
                              });
                              
                              // Use the first partial match
                              matchingRegion = partialMatches[0];
                              console.log(`Using "${matchingRegion.name}" as match for ${draggedRegion.name}`);
                            } else {
                              console.log(`No matches found for ${draggedRegion.name} in the SVG data. Using fallback coordinates.`);
                            }
                          }
                        }
                          
                        // If no direct match by name, try country-specific ID matching
                        if (!matchingRegion && countryId === 1) { // Nigeria
                          const stateCode = getNigeriaStateCode(draggedRegion.name);
                          if (stateCode) {
                            // Try to find the region with ID of "NG-XX" format
                            const regionId = `NG-${stateCode}`;
                            matchingRegion = svgRegions.find(r => r.id === regionId);
                            
                            // Log if we find a match
                            if (matchingRegion) {
                              console.log(`Found exact match for ${draggedRegion.name} with ID: ${regionId}`);
                            }
                          }
                        } else if (!matchingRegion && countryId === 2) { // Kenya
                          // Define a map of Kenya county names to their ID numbers
                          const kenyaCountyMap: Record<string, string> = {
                            'Mombasa': '01', 'Kwale': '02', 'Kilifi': '03', 'Tana River': '04',
                            'Lamu': '05', 'Taita Taveta': '06', 'Garissa': '07', 'Wajir': '08',
                            'Mandera': '09', 'Marsabit': '10', 'Isiolo': '11', 'Meru': '12',
                            'Tharaka-Nithi': '13', 'Embu': '14', 'Kitui': '15', 'Machakos': '16',
                            'Makueni': '17', 'Nyandarua': '18', 'Nyeri': '19', 'Kirinyaga': '20',
                            'Murang\'a': '21', 'Muranga': '21', // Handle apostrophe variant
                            'Kiambu': '22', 'Turkana': '23', 'West Pokot': '24', 'Samburu': '25',
                            'Trans Nzoia': '26', 'Uasin Gishu': '27', 'Elgeyo-Marakwet': '28', 
                            'Nandi': '29', 'Baringo': '30', 'Laikipia': '31', 'Nakuru': '32',
                            'Narok': '33', 'Kajiado': '34', 'Kericho': '35', 'Bomet': '36',
                            'Kakamega': '37', 'Vihiga': '38', 'Bungoma': '39', 'Busia': '40',
                            'Siaya': '41', 'Kisumu': '42', 'Homa Bay': '43', 'Migori': '44',
                            'Kisii': '45', 'Nyamira': '46', 'Nairobi': '47'
                          };
                          
                          // First try to get the county ID based on the name
                          const normalizedName = draggedRegion.name.toLowerCase().trim();
                          let countyId = '';
                          
                          // Try direct match first
                          for (const [key, value] of Object.entries(kenyaCountyMap)) {
                            if (key.toLowerCase() === normalizedName) {
                              countyId = value;
                              break;
                            }
                          }
                          
                          // If no direct match, try partial match
                          if (!countyId) {
                            for (const [key, value] of Object.entries(kenyaCountyMap)) {
                              if (key.toLowerCase().includes(normalizedName) || 
                                  normalizedName.includes(key.toLowerCase())) {
                                countyId = value;
                                break;
                              }
                            }
                          }
                          
                          // If we found a county ID, try to find the region with the corresponding ID
                          if (countyId) {
                            const regionId = `KE-${countyId}`;
                            matchingRegion = svgRegions.find(r => r.id === regionId);
                            
                            if (matchingRegion) {
                              console.log(`Found exact match for ${draggedRegion.name} with Kenya ID: ${regionId}`);
                            }
                          }
                        }
                        
                        // If we couldn't find a match by ID, try matching by name
                        if (!matchingRegion) {
                          matchingRegion = svgRegions.find(r => 
                            r.name.toLowerCase() === draggedRegion.name.toLowerCase() ||
                            r.name.toLowerCase().includes(draggedRegion.name.toLowerCase())
                          );
                        }
                        
                        // If we found a matching region in the SVG, extract path and calculate a better centroid
                        if (matchingRegion) {
                          console.log(`Found matching SVG region for ${draggedRegion.name}`);
                          
                          // Calculate the actual centroid of the SVG path, passing region ID if available
                          const centroid = getPathCentroid(matchingRegion.path, matchingRegion.id);
                          
                          if (centroid) {
                            console.log(`Using calculated centroid for ${draggedRegion.name}: (${centroid.x}, ${centroid.y})`);
                            
                            return {
                              x: centroid.x,
                              y: centroid.y,
                              id: matchingRegion.id,
                              name: matchingRegion.name,
                              found: true,
                              path: matchingRegion.path
                            };
                          }
                          
                          // Fallback to pre-calculated position if centroid calculation fails
                          return {
                            x: draggedRegion.correctX,
                            y: draggedRegion.correctY,
                            id: matchingRegion.id,
                            name: matchingRegion.name,
                            found: true
                          };
                        }
                        
                        // Fallback to using the coordinates from game state
                        return {
                          x: draggedRegion.correctX,
                          y: draggedRegion.correctY,
                          found: false
                        };
                      };
                      
                      const matchedRegion = findMatchingMapRegion();
                      
                      return (
                        <g key={`guidance-${draggedRegion.id}`} className="guidance-marker">
                          {/* Highlight the actual matching region on the SVG map if we found a match */}
                          {/* This appears first (at the bottom of the stack) */}
                          {matchedRegion.found && matchedRegion.id && (
                            <use 
                              href={`#${matchedRegion.id}`} 
                              fill="rgba(255,0,0,0.15)" 
                              stroke="rgba(255,0,0,0.3)"
                              strokeWidth="1.5"
                              className="pointer-events-none"
                            />
                          )}
                          
                          {/* Outer glow effect */}
                          <circle 
                            cx={matchedRegion.x} 
                            cy={matchedRegion.y} 
                            r="22" 
                            fill="none" 
                            stroke="rgba(255,255,255,0.5)" 
                            strokeWidth="2"
                            style={{ 
                              animation: 'pulse 2s infinite ease-in-out',
                              animationDelay: "0.3s",
                              transformOrigin: 'center center',
                              filter: 'blur(2px)',
                              pointerEvents: "none"
                            }}
                          />
                          
                          {/* Pulsing outer circle */}
                          <circle 
                            cx={matchedRegion.x} 
                            cy={matchedRegion.y} 
                            r="16" 
                            fill="none" 
                            stroke="rgba(255,0,0,0.9)" 
                            strokeWidth="4"
                            style={{ 
                              animation: 'pulse 1.5s infinite ease-in-out',
                              transformOrigin: 'center center',
                              filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.9))',
                              pointerEvents: "none"
                            }}
                          />
                          
                          {/* Cross hairs */}
                          <line 
                            x1={matchedRegion.x - 20} 
                            y1={matchedRegion.y} 
                            x2={matchedRegion.x - 10} 
                            y2={matchedRegion.y} 
                            stroke="rgba(255,0,0,0.7)" 
                            strokeWidth="2"
                            style={{ 
                              filter: 'drop-shadow(0 0 2px white)',
                              pointerEvents: "none"
                            }}
                          />
                          <line 
                            x1={matchedRegion.x + 10} 
                            y1={matchedRegion.y} 
                            x2={matchedRegion.x + 20} 
                            y2={matchedRegion.y} 
                            stroke="rgba(255,0,0,0.7)" 
                            strokeWidth="2"
                            style={{ 
                              filter: 'drop-shadow(0 0 2px white)',
                              pointerEvents: "none"
                            }}
                          />
                          <line 
                            x1={matchedRegion.x} 
                            y1={matchedRegion.y - 20} 
                            x2={matchedRegion.x} 
                            y2={matchedRegion.y - 10} 
                            stroke="rgba(255,0,0,0.7)" 
                            strokeWidth="2"
                            style={{ 
                              filter: 'drop-shadow(0 0 2px white)',
                              pointerEvents: "none"
                            }}
                          />
                          <line 
                            x1={matchedRegion.x} 
                            y1={matchedRegion.y + 10} 
                            x2={matchedRegion.x} 
                            y2={matchedRegion.y + 20} 
                            stroke="rgba(255,0,0,0.7)" 
                            strokeWidth="2"
                            style={{ 
                              filter: 'drop-shadow(0 0 2px white)',
                              pointerEvents: "none"
                            }}
                          />
                          
                          {/* Inner solid dot - This is drawn LAST so it's always on top */}
                          <circle 
                            cx={matchedRegion.x} 
                            cy={matchedRegion.y} 
                            r="8" 
                            fill="#ff3333" 
                            stroke="white"
                            strokeWidth="2"
                            style={{
                              filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.9))',
                              pointerEvents: "none",
                              zIndex: 9999 // Ensure it's on top (SVG doesn't use z-index but adding for emphasis)
                            }}
                          />
                          
                          {/* Additional dot outline to make it even more visible */}
                          <circle
                            cx={matchedRegion.x}
                            cy={matchedRegion.y}
                            r="10"
                            fill="none"
                            stroke="rgba(255,255,255,0.8)"
                            strokeWidth="2"
                            style={{
                              filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.5))',
                              pointerEvents: "none"
                            }}
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
