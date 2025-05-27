import React, { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { 
  Dialog, 
  DialogContent,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy } from "lucide-react";
import { useGame } from "@/context/game-context";
import { Confetti } from "@/components/ui/confetti";

interface SuccessModalProps {
  isOpen: boolean;
  onNextLevel?: () => void;
  onRestart?: () => void;
}

export function SuccessModal({ isOpen, onNextLevel, onRestart }: SuccessModalProps) {
  const { gameState, resetGame } = useGame();
  const [, navigate] = useLocation();
  /*
  // Format time
  const formatTime = (timeMs: number | null): string => {
    if (!timeMs) return "00:00";
    
    const totalSeconds = Math.floor((timeMs - (gameState?.startTime || 0)) / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  */
  // Handle going to next country
  const handleNextCountry = () => {
    // Simple implementation - just increment country ID
    // In a real app, this would navigate to a random or next ordered country
    if (gameState?.countryId) {
      navigate(`/game/${gameState.countryId + 1}`);
    } else {
      navigate("/");
    }
  };

  // Handle playing again
  const handlePlayAgain = () => {
    resetGame();
    onRestart?.();
  };

  // Handle going back to home
  const handleBackToHome = () => {
    navigate("/");
  };

  if (!gameState) return null;

  return (
    <>
      <Confetti active={isOpen} />
      <Dialog open={isOpen}>
        <DialogContent className="max-w-md">
          <div className="bg-gradient-to-r from-primary to-secondary p-6 text-center text-white -mx-6 -mt-6">
            <div className="mb-4">
              <Trophy className="h-16 w-16 text-accent mx-auto" />
            </div>
            <h2 className="font-heading font-bold text-3xl mb-2">Puzzle Complete!</h2>
            <p>You successfully assembled {gameState.countryName}!</p>
          </div>
          
           {/* Stats Section */}
          <div className="space-y-4 my-6"></div>
           <div className="flex justify-between items-center">
              <span className="text-gray-600">Score:</span>
              <span className="font-bold">{gameState.score || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Hints Used:</span>
                <span className="font-bold text-1g">{gameState.hintsUsed}/3</span>
              </div>
            
             {/* action button */}
            <DialogFooter className="flex flex-col space-y-3">
              {/* Always show Next Level if provided */}
                {onNextLevel && (
              <Button
                className="w-full bg-primary hover:bg-primary/90 text-white"
                onClick={onNextLevel}
              >
                Next Level
              </Button>
             )}

             {/* Show Next Country only if onNextLevel isn't provided */}
             {!onNextLevel && (
              <Button
                className="w-full bg-primary hover:bg-primary/90 text-white"
                onClick={handleNextCountry}
              >
                Next Country
              </Button>
            )}

              <Button 
                className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700"
                onClick={handlePlayAgain}
              >
                Play Again
              </Button>


              <Button 
                variant="ghost" 
                className="w-full text-gray-500 hover:text-gray-700"
                onClick={handleBackToHome}
              >
                Back to Countries
              </Button>
            </DialogFooter>
         
        </DialogContent>
      </Dialog>
    </>
  );
}
