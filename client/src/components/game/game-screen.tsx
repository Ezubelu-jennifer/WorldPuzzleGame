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
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Game Info Panel */}
        <div className="lg:w-1/4">
          <GameInfoPanel 
            onUseHint={handleUseHint}
            onRestart={handleRestart}
            onHelp={handleHelp}
          />
        </div>
        
        {/* Game Board */}
        <div className="lg:w-3/4 flex flex-col">
          <PuzzleBoard 
            countryId={country.id} 
            countryName={country.name}
            outlinePath={country.outlinePath}
            onStart={handleStart}
          />
          
          {/* Pieces Tray */}
          <PiecesTray onPieceDrop={handlePieceDrop} />
        </div>
      </div>
      
      {/* Modals */}
      <HowToPlayModal isOpen={showHowToPlay} onClose={() => setShowHowToPlay(false)} />
      <SuccessModal isOpen={gameState?.isCompleted || false} />
    </div>
  );
}
