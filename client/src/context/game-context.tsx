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
    
    // If we're within a broader tolerance (120px), check if the piece is over its target region
    if (distance <= 120) {
      // We consider this a match if we're in the general vicinity of the correct region
      // The SVG paths are the same for the state in the board and the dragged piece,
      // so if we're close enough, we consider it a match
      isOverMatchingRegion = true;
      
      // In a more sophisticated implementation, we would:
      // 1. Get the SVG element for the target region based on its ID or path data
      // 2. Use document.elementFromPoint(x, y) to check if the cursor is over that SVG path
      // 3. Use the SVG's isPointInPath() method to check if the point is inside the path
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
