import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { GameState, RegionPiece } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { sampleRegions } from "@/data/countries";

interface GameContextProps {
  gameState: GameState | null;
  initializeGame: (countryId: number, countryName: string) => void;
  placePiece: (pieceId: number, x: number, y: number) => boolean;
  useHint: () => void;
  resetGame: () => void;
  completeGame: () => void;
  setShapeSize: (size: number) => void; // Add ability to adjust shape size
  loading: boolean;
  error: string | null;
}

const GameContext = createContext<GameContextProps | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gameSessionId, setGameSessionId] = useState<number | null>(null);

  // Initialize a new game for a specific country
  const initializeGame = async (countryId: number, countryName: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Load regions from backend
      let regions: RegionPiece[] = [];
      
      try {
        // Try to get regions from API
        const response = await fetch(`/api/countries/${countryId}/regions`);
        if (!response.ok) {
          throw new Error("Failed to load regions");
        }
        regions = await response.json();
        
        // Debug the regions received from API
        console.log(`Loaded ${regions.length} regions for ${countryName} (ID: ${countryId})`);
        
        // Ensure all required properties are present
        regions = regions.map((region, index) => {
          // Special handling for problematic regions with fixed positions
          let specialCorrectX, specialCorrectY;
          
          if (region.name === "Federal Capital Territory" || region.name === "FCT") {
            specialCorrectX = 380;
            specialCorrectY = 370;
            console.log("Setting special position for FCT:", specialCorrectX, specialCorrectY);
          } 
          else if (region.name === "Nasarawa") {
            specialCorrectX = 404;
            specialCorrectY = 340;
            console.log("Setting special position for Nasarawa:", specialCorrectX, specialCorrectY);
          }
          else if (region.name === "Ebonyi") {
            specialCorrectX = 310;
            specialCorrectY = 515;
            console.log("Setting special position for Ebonyi:", specialCorrectX, specialCorrectY);
          }
          
          // Make sure each region has required properties
          const processedRegion: RegionPiece = {
            id: region.id,
            name: region.name,
            svgPath: region.svgPath || "",
            correctX: specialCorrectX || region.correctX || 100 + (index * 50),
            correctY: specialCorrectY || region.correctY || 100 + (index * 30),
            isPlaced: false,
            fillColor: region.fillColor || "#" + Math.floor(Math.random()*16777215).toString(16),
            strokeColor: region.strokeColor || "#333333"
          };
          
          return processedRegion;
        });
        
        // Check if Nasarawa is in the Nigeria regions
        if (countryId === 1) {
          const hasNasarawa = regions.some(r => r.name === "Nasarawa");
          console.log(`Nasarawa region ${hasNasarawa ? 'found' : 'missing'} in Nigeria data`);
        }
        
        // Make sure we have the correct number of regions
        const expectedCount = countryId === 1 ? 37 : 47;
        console.log(`Expected ${expectedCount} regions, got ${regions.length} for ${countryName}`);
        
        // If count doesn't match, add missing or remove extras
        if (regions.length !== expectedCount) {
          if (regions.length < expectedCount) {
            // Missing regions - add generic ones to match the count
            const missingCount = expectedCount - regions.length;
            console.warn(`Adding ${missingCount} generic regions to match expected count`);
            
            for (let i = 0; i < missingCount; i++) {
              const id = 1000 + regions.length + i;
              const name = countryId === 1 
                ? `Nigeria State ${regions.length + i + 1}` 
                : `Kenya County ${regions.length + i + 1}`;
              
              regions.push({
                id: id,
                name: name,
                svgPath: "",
                correctX: 150 + (i * 50),
                correctY: 150 + (i * 30),
                isPlaced: false,
                fillColor: "#" + Math.floor(Math.random()*16777215).toString(16),
                strokeColor: "#333333"
              });
            }
          } else if (regions.length > expectedCount) {
            // Too many regions - trim to expected count
            console.warn(`Trimming ${regions.length - expectedCount} excess regions`);
            regions = regions.slice(0, expectedCount);
          }
        }
      } catch (err) {
        // Fallback to sample data if API fails
        console.warn("Using sample regions data as fallback", err);
        regions = sampleRegions[countryId] || [];
        console.log(`Fallback provided ${regions.length} regions`);
      }
      
      // Create a new game session on the server
      try {
        const startTime = Date.now();
        const response = await apiRequest('POST', '/api/game-sessions', {
          countryId,
          startedAt: new Date(startTime).toISOString(),
          hintsUsed: 0,
          userId: null // Anonymous player for now
        });
        
        if (response.ok) {
          const session = await response.json();
          setGameSessionId(session.id);
        }
      } catch (err) {
        // Continue even if session creation fails
        console.warn("Failed to create game session, continuing in offline mode");
      }
      
      // Set initial game state
      const gameState: GameState = {
        countryId,
        countryName,
        regions: regions.map(r => ({ ...r, isPlaced: false })),
        placedPieces: [],
        hintsUsed: 0,
        startTime: Date.now(),
        endTime: null,
        isCompleted: false,
        score: null,
        shapeSize: 1.0 // Default shape size
      };
      
      // Set the state
      setGameState(gameState);
      
      // Final check of the data to debug
      console.log(`Game initialized with ${gameState.regions.length} regions`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initialize game");
    } finally {
      setLoading(false);
    }
  };

  // Place a piece on the board
  const placePiece = (pieceId: number, x: number, y: number): boolean => {
    if (!gameState) return false;
    
    // Find the piece
    const pieceIndex = gameState.regions.findIndex(r => r.id === pieceId && !r.isPlaced);
    if (pieceIndex === -1) return false;
    
    const piece = gameState.regions[pieceIndex];
    
    // Method 1: Check if piece is near its correct position (distance-based with dynamic tolerance)
    // Calculate distance to correct position
    const dx = x - piece.correctX;
    const dy = y - piece.correctY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Base tolerance is 60px, but we adjust it based on the piece's size
    // Smaller pieces should have a smaller tolerance to require more precision
    // Get the current shape size from game state if available or use default
    const gameSize = gameState.shapeSize || 1.0;
    
    // Dynamic tolerance calculation - inverse relationship with shape size
    // This ensures smaller shapes need more precision while larger shapes are more forgiving
    const baseTolerance = 60;
    const tolerance = baseTolerance * (1 / gameSize);
    
    const isCorrectPosition = distance <= tolerance;
    
    // Log for debugging
    console.log(`Placing piece ${piece.id} (${piece.name})`);
    console.log(`Current position: (${x.toFixed(0)}, ${y.toFixed(0)})`);
    console.log(`Correct position: (${piece.correctX.toFixed(0)}, ${piece.correctY.toFixed(0)})`);
    console.log(`Distance: ${distance.toFixed(0)}px, Tolerance: ${tolerance}px`);
    console.log(`Is correct position? ${isCorrectPosition ? 'YES ✓' : 'NO ✗'}`); 
    
    // Method 2: Check if the piece is over its matching region on the map (shape-based)
    let isOverMatchingRegion = false;
    
    // Find the target region element in the DOM
    const findRegionElement = (regionId: number): SVGPathElement | null => {
      try {
        // Try to find the corresponding region path in the SVG map
        const svgPaths = document.querySelectorAll('path[data-region-id], path[data-numeric-id], path[id], use');
        
        // Log for debugging
        console.log(`Looking for SVG path with region ID ${regionId} among ${svgPaths.length} paths/elements`);
        
        // Get the region name for better matching
        const regionName = piece.name.toLowerCase();
        
        // For Nigeria, create a code-to-id mapping
        const nigeriaCodeToId: Record<string, number> = {
          'AB': 1, 'AD': 2, 'AK': 3, 'AN': 4, 'BA': 5, 'BY': 6, 'BE': 7, 'BO': 8,
          'CR': 9, 'DE': 10, 'EB': 11, 'ED': 12, 'EK': 13, 'EN': 14, 'FC': 15, 
          'GO': 16, 'IM': 17, 'JI': 18, 'KD': 19, 'KN': 20, 'KT': 21, 'KE': 22, 
          'KO': 23, 'KW': 24, 'LA': 25, 'NA': 26, 'NI': 27, 'OG': 28, 'ON': 29, 
          'OS': 30, 'OY': 31, 'PL': 32, 'RI': 33, 'SO': 34, 'TA': 35, 'YO': 36, 
          'ZA': 37
        };
        
        // First pass: Try direct ID matching which is most reliable
        for (let i = 0; i < svgPaths.length; i++) {
          const pathElement = svgPaths[i] as SVGPathElement;
          
          // Try to match by numeric ID (maps to our database IDs)
          const numericId = pathElement.getAttribute('data-numeric-id');
          if (numericId && parseInt(numericId, 10) === regionId) {
            console.log(`✅ Found exact match by numeric ID: ${numericId}`);
            return pathElement;
          }
          
          // Try matching by SVG data-region-id attribute
          const dataRegionId = pathElement.getAttribute('data-region-id');
          if (dataRegionId) {
            // For Nigeria, check for state code
            if (dataRegionId.startsWith('NG-') && gameState?.countryId === 1) {
              const stateCode = dataRegionId.replace('NG-', '');
              const mappedId = nigeriaCodeToId[stateCode];
              if (mappedId === regionId) {
                console.log(`✅ Found match by Nigeria state code: ${stateCode} -> ID: ${mappedId}`);
                return pathElement;
              }
            }
            
            // Regular ID pattern match
            if (dataRegionId.includes(`${regionId}`)) {
              console.log(`✅ Found match by SVG ID: ${dataRegionId}`);
              return pathElement;
            }
          }
          
          // Try matching by element ID attribute
          const elementId = pathElement.id;
          if (elementId) {
            // For Nigeria, check for state code in ID
            if (elementId.startsWith('NG-') && gameState?.countryId === 1) {
              const stateCode = elementId.replace('NG-', '');
              const mappedId = nigeriaCodeToId[stateCode];
              if (mappedId === regionId) {
                console.log(`✅ Found match by element ID with Nigeria code: ${elementId}`);
                return pathElement;
              }
            }
            
            // Regular ID pattern match
            if (elementId.includes(`${regionId}`)) {
              console.log(`✅ Found match by element ID: ${elementId}`);
              return pathElement;
            }
          }
        }
        
        // Second pass: Try name-based matching (less reliable but needed for some cases)
        for (let i = 0; i < svgPaths.length; i++) {
          const pathElement = svgPaths[i] as SVGPathElement;
          
          // Try to match by data-name attribute
          const pathName = pathElement.getAttribute('data-name')?.toLowerCase();
          if (pathName && regionName && (
              pathName.includes(regionName) || 
              regionName.includes(pathName))
          ) {
            console.log(`✅ Found match by name: ${pathName} ↔ ${regionName}`);
            return pathElement;
          }
          
          // Try to match by element ID containing name or partial name
          const elementId = pathElement.id?.toLowerCase();
          if (elementId && regionName && (
              elementId.includes(regionName) ||
              regionName.includes(elementId))
          ) {
            console.log(`✅ Found match by element ID containing name: ${elementId} ↔ ${regionName}`);
            return pathElement;
          }
        }
        
        // No matches found
        console.log(`❌ No matching region element found for ID: ${regionId}, Name: ${regionName}`);
      } catch (err) {
        console.error('Error finding region element:', err);
      }
      return null;
    };
    
    // Check if the point is within a shape with the elementFromPoint method
    const isPointInShape = (x: number, y: number, targetElement: SVGPathElement): boolean => {
      try {
        // Get the element at the point
        const element = document.elementFromPoint(x, y);
        if (!element) return false;
        
        // Get the target element attributes for matching
        const targetRegionId = targetElement.getAttribute('data-region-id');
        const targetNumericId = targetElement.getAttribute('data-numeric-id');
        const targetName = targetElement.getAttribute('data-name')?.toLowerCase();
        
        // Try direct element match
        if (element === targetElement || targetElement.contains(element)) {
          console.log('Direct element match');
          return true;
        }
        
        // Try ID-based match
        if (targetNumericId && element.closest(`path[data-numeric-id="${targetNumericId}"]`)) {
          console.log('Numeric ID match');
          return true;
        }
        
        if (targetRegionId && element.closest(`path[data-region-id="${targetRegionId}"]`)) {
          console.log('Region ID match');
          return true;
        }
        
        // Try name-based match for special cases
        if (targetName && piece.name) {
          const pieceName = piece.name.toLowerCase();
          const elementName = element.getAttribute('data-name')?.toLowerCase();
          
          if (elementName && (
              elementName.includes(targetName) || 
              targetName.includes(elementName) ||
              elementName.includes(pieceName) ||
              pieceName.includes(elementName)
          )) {
            console.log('Name match');
            return true;
          }
        }
        
        return false;
      } catch (err) {
        console.error('Error checking if point is in shape:', err);
        return false;
      }
    };
    
    // First use a broader tolerance to consider if we're near the region
    if (distance <= 120) {
      try {
        // Get the SVG path element for this region
        const regionElement = findRegionElement(pieceId);
        
        if (regionElement) {
          // Check if the cursor is over this region's shape
          isOverMatchingRegion = isPointInShape(x, y, regionElement);
          console.log(`Cursor position: (${x}, ${y}) - Over matching region? ${isOverMatchingRegion}`);
        } else {
          // Fallback to distance-based matching if we can't find the shape
          isOverMatchingRegion = distance <= 60;
          console.log(`Fallback to distance matching (${distance} <= 60? ${isOverMatchingRegion})`);
        }
      } catch (err) {
        console.error('Error in shape matching:', err);
        // Fallback to distance-based matching
        isOverMatchingRegion = distance <= 60;
      }
    }
    
    // A piece is correctly placed if it's either near its correct position OR over its matching region
    const isCorrectlyPlaced = isCorrectPosition || isOverMatchingRegion;
    
    if (isCorrectlyPlaced) {
      console.log(`✅ State ${piece.name} placed correctly! Snapping to exact position.`);
      
      // Update the game state with the placed piece
      const updatedRegions = [...gameState.regions];
      updatedRegions[pieceIndex] = {
        ...piece,
        isPlaced: true,
        currentX: piece.correctX,
        currentY: piece.correctY
      };
      
      const updatedPlacedPieces = [...gameState.placedPieces, pieceId];
      
      setGameState({
        ...gameState,
        regions: updatedRegions,
        placedPieces: updatedPlacedPieces,
        // Preserve the current shape size
        shapeSize: gameState.shapeSize || 1.0
      });
      
      // Check if game is complete
      if (updatedPlacedPieces.length === gameState.regions.length) {
        completeGame();
      }
      
      return true;
    }
    
    return false;
  };

  // Use a hint to place a random piece
  const useHint = () => {
    if (!gameState) return;
    
    // Find unplaced pieces
    const unplacedPieces = gameState.regions.filter(r => !r.isPlaced);
    if (unplacedPieces.length === 0) return;
    
    // Select a random unplaced piece
    const randomIndex = Math.floor(Math.random() * unplacedPieces.length);
    const piece = unplacedPieces[randomIndex];
    
    // Update the game state
    const updatedRegions = gameState.regions.map(r => 
      r.id === piece.id 
        ? { ...r, isPlaced: true, currentX: r.correctX, currentY: r.correctY }
        : r
    );
    
    setGameState({
      ...gameState,
      regions: updatedRegions,
      placedPieces: [...gameState.placedPieces, piece.id],
      hintsUsed: gameState.hintsUsed + 1,
      // Preserve the current shape size
      shapeSize: gameState.shapeSize || 1.0
    });
    
    // Check if game is complete
    if (gameState.placedPieces.length + 1 === gameState.regions.length) {
      completeGame();
    }
  };

  // Reset the current game
  const resetGame = () => {
    if (!gameState) return;
    
    // Reset game state but keep country information and shape size
    setGameState({
      ...gameState,
      regions: gameState.regions.map(r => ({ ...r, isPlaced: false, currentX: undefined, currentY: undefined })),
      placedPieces: [],
      hintsUsed: 0,
      startTime: Date.now(),
      endTime: null,
      isCompleted: false,
      score: null,
      // Maintain the current shape size
      shapeSize: gameState.shapeSize || 1.0
    });
  };

  // Complete the game and calculate score
  const completeGame = async () => {
    if (!gameState || gameState.isCompleted) return;
    
    const endTime = Date.now();
    const timeTaken = (endTime - (gameState.startTime || endTime)) / 1000; // in seconds
    
    // Simple scoring formula: 
    // Base score + (bonus for speed) - (penalty for hints)
    const baseScore = gameState.regions.length * 100;
    const timeBonus = Math.max(0, 300 - timeTaken) * 5;
    const hintPenalty = gameState.hintsUsed * 50;
    
    const finalScore = Math.round(baseScore + timeBonus - hintPenalty);
    
    // Update game state
    setGameState({
      ...gameState,
      endTime,
      isCompleted: true,
      score: finalScore,
      // Preserve the current shape size
      shapeSize: gameState.shapeSize || 1.0
    });
    
    // Send completion to server
    if (gameSessionId) {
      try {
        await apiRequest('PUT', `/api/game-sessions/${gameSessionId}/complete`, {
          hintsUsed: gameState.hintsUsed,
          score: finalScore
        });
      } catch (err) {
        console.warn("Failed to record game completion", err);
      }
    }
  };
  
  // Update the shape size for better matching accuracy
  const setShapeSize = (size: number) => {
    if (!gameState) return;
    
    // Ensure size is within reasonable bounds
    const boundedSize = Math.max(0.5, Math.min(1.5, size));
    
    console.log(`Setting shape size to ${boundedSize}`);
    
    // Update the game state with the new shape size
    setGameState({
      ...gameState,
      shapeSize: boundedSize
    });
  };

  return (
    <GameContext.Provider
      value={{
        gameState,
        initializeGame,
        placePiece,
        useHint,
        resetGame,
        completeGame,
        setShapeSize,
        loading,
        error
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
}
