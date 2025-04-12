import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useGame } from "@/context/game-context";
import { GameInfoPanel } from "@/components/game/game-info-panel";
import { PuzzleBoard } from "@/components/game/puzzle-board";
import { PiecesTray } from "@/components/game/pieces-tray";
import { HowToPlayModal } from "@/components/modals/how-to-play-modal";
import { SuccessModal } from "@/components/modals/success-modal";
import { initialCountries } from "@/data/countries";

interface GameScreenProps {
  countryId: number;
}

export function GameScreen({ countryId }: GameScreenProps) {
  const { gameState, initializeGame, placePiece, useHint, resetGame } = useGame();
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  
  // Fetch country data
  const { data: country, isLoading: countryLoading } = useQuery({
    queryKey: [`/api/countries/${countryId}`],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/countries/${countryId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch country data");
        }
        return await response.json();
      } catch (error) {
        console.warn("Using initial data as fallback:", error);
        // Fallback to initial data
        return initialCountries.find(c => c.id === countryId) || null;
      }
    }
  });

  // Initialize game with country data
  useEffect(() => {
    if (country) {
      initializeGame(country.id, country.name);
    }
  }, [country, initializeGame]);

  // Handle piece drop
  const handlePieceDrop = (pieceId: number, x: number, y: number): boolean => {
    return placePiece(pieceId, x, y);
  };

  // Handle using a hint
  const handleUseHint = () => {
    useHint();
  };

  // Handle restarting the game
  const handleRestart = () => {
    resetGame();
    setGameStarted(false);
  };

  // Show help modal
  const handleHelp = () => {
    setShowHowToPlay(true);
  };

  // Start the game
  const handleStart = () => {
    setGameStarted(true);
  };

  if (countryLoading || !country) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-t-transparent border-primary rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading puzzle...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header with country name and difficulty - matching the screenshot exactly */}
      <div className="bg-green-700 py-3 px-4 text-white flex justify-between items-center">
        <h1 className="text-xl font-bold">{country.name} Puzzle - Easy</h1>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleHelp}
            className="text-white hover:text-green-200 transition"
            aria-label="Help"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
            </svg>
          </button>
          <button 
            onClick={handleRestart}
            className="text-white hover:text-green-200 transition"
            aria-label="Restart"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>
        </div>
      </div>

      {/* Game progress indicator */}
      <div className="bg-gray-100 px-4 py-2 flex justify-between items-center">
        <p className="text-sm font-medium">
          {gameState?.placedPieces.length || 0}/{gameState?.regions.length || (country.id === 1 ? 37 : 47)} {country.id === 1 ? 'States' : 'Counties'}
        </p>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleUseHint}
            className="text-emerald-700 hover:text-emerald-900 transition flex items-center gap-1 text-sm font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
            </svg>
            Hint ({3 - (gameState?.hintsUsed || 0)})
          </button>
        </div>
      </div>

      {/* Pieces Tray - Horizontal strip at top */}
      <div className="bg-gray-50 border-b overflow-x-auto py-3 px-2">
        <PiecesTray onPieceDrop={handlePieceDrop} />
      </div>
      
      {/* Main Game Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 bg-white">
        <PuzzleBoard 
          countryId={country.id} 
          countryName={country.name}
          outlinePath={country.outlinePath}
          onStart={handleStart}
        />
      </div>
      
      {/* Footer - exactly like in the screenshot */}
      <div className="bg-gray-100 p-2 text-center text-sm text-gray-600">
        <p className="text-green-800">Memorize the Map of {country.name}</p>
        {!gameStarted && <p className="text-xs text-gray-500">Starting puzzle in a moment...</p>}
      </div>
      
      {/* Modals */}
      <HowToPlayModal isOpen={showHowToPlay} onClose={() => setShowHowToPlay(false)} />
      <SuccessModal isOpen={gameState?.isCompleted || false} />
    </div>
  );
}
