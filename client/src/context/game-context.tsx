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
      } catch (err) {
        // Fallback to sample data if API fails
        console.warn("Using sample regions data as fallback");
        regions = sampleRegions[countryId] || [];
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
      setGameState({
        countryId,
        countryName,
        regions: regions.map(r => ({ ...r, isPlaced: false })),
        placedPieces: [],
        hintsUsed: 0,
        startTime: Date.now(),
        endTime: null,
        isCompleted: false,
        score: null
      });
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
    const pieceIndex = gameState.regions.findIndex(r => r.id === pieceId);
    if (pieceIndex === -1) return false;
    
    const piece = gameState.regions[pieceIndex];
    
    // Check if piece is near its correct position (within 50px)
    const isCorrectPosition = 
      Math.abs(x - piece.correctX) < 50 && 
      Math.abs(y - piece.correctY) < 50;
    
    if (isCorrectPosition) {
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
        placedPieces: updatedPlacedPieces
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
      hintsUsed: gameState.hintsUsed + 1
    });
    
    // Check if game is complete
    if (gameState.placedPieces.length + 1 === gameState.regions.length) {
      completeGame();
    }
  };

  // Reset the current game
  const resetGame = () => {
    if (!gameState) return;
    
    // Reset game state but keep country information
    setGameState({
      ...gameState,
      regions: gameState.regions.map(r => ({ ...r, isPlaced: false, currentX: undefined, currentY: undefined })),
      placedPieces: [],
      hintsUsed: 0,
      startTime: Date.now(),
      endTime: null,
      isCompleted: false,
      score: null
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
      score: finalScore
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

  return (
    <GameContext.Provider
      value={{
        gameState,
        initializeGame,
        placePiece,
        useHint,
        resetGame,
        completeGame,
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
