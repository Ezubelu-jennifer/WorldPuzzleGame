import React from "react";
import { Link } from "wouter";
import { Clock, ChartBar, Star, Lightbulb, RotateCcw, HelpCircle, ArrowLeft, Wand2 } from "lucide-react";
import { useGame } from "@/context/game-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useGameTimer } from "@/hooks/useGameTimer";
import { Progress } from "@/components/ui/progress";

interface GameInfoPanelProps {
  onUseHint: () => void;
  onRestart: () => void;
  onHelp: () => void;
}

export function GameInfoPanel({ onUseHint, onRestart, onHelp }: GameInfoPanelProps) {
  const { gameState } = useGame();
  
  // Set up timer that starts when gameState is available
  const { formattedTime } = useGameTimer({
    isRunning: gameState !== null && !gameState?.isCompleted,
  });
  
  if (!gameState) {
    return (
      <Card className="h-full animate-pulse">
        <CardContent className="p-4">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-4">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxHints = 3;
  const hintsLeft = maxHints - gameState.hintsUsed;
  const totalPieces = gameState.regions.length;
  const placedPieces = gameState.placedPieces.length;
  const progressPercent = totalPieces > 0 ? (placedPieces / totalPieces) * 100 : 0;
  
  // Calculate score (simple formula while game is in progress)
  const calculateCurrentScore = () => {
    if (gameState.score !== null) return gameState.score;
    
    const baseScore = placedPieces * 50;
    const hintPenalty = gameState.hintsUsed * 50;
    return Math.max(0, baseScore - hintPenalty);
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-bold text-xl text-gray-800">
            {gameState.countryName}
          </h2>
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          </Link>
        </div>
        
        <div className="space-y-4">
          {/* Timer */}
          <div className="bg-gray-100 rounded-lg p-3 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-gray-700 font-medium">Time</span>
            </div>
            <div className="font-mono font-bold text-xl">{formattedTime}</div>
          </div>
          
          {/* Progress */}
          <div className="bg-gray-100 rounded-lg p-3">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center space-x-2">
                <ChartBar className="h-4 w-4 text-gray-500" />
                <span className="text-gray-700 font-medium">Progress</span>
              </div>
              <div className="font-bold">{placedPieces}/{totalPieces}</div>
            </div>
            <Progress value={progressPercent} className="h-2.5" />
          </div>
          
          {/* Score */}
          <div className="bg-gray-100 rounded-lg p-3 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Star className="h-4 w-4 text-gray-500" />
              <span className="text-gray-700 font-medium">Score</span>
            </div>
            <div className="font-bold">{calculateCurrentScore()}</div>
          </div>
          
          {/* Hint System */}
          <div className="bg-gray-100 rounded-lg p-3">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center space-x-2">
                <Lightbulb className="h-4 w-4 text-gray-500" />
                <span className="text-gray-700 font-medium">Hints</span>
              </div>
              <div className="font-bold">{hintsLeft} left</div>
            </div>
            <Button 
              className="w-full bg-accent/90 hover:bg-accent text-white"
              onClick={onUseHint}
              disabled={hintsLeft <= 0 || gameState.isCompleted}
            >
              <Wand2 className="h-4 w-4 mr-1" />
              <span>Use Hint</span>
            </Button>
          </div>



          {/* Controls */}
          <div className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700"
              onClick={onRestart}
              disabled={gameState.isCompleted}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              <span>Restart Puzzle</span>
            </Button>
            <Button 
              variant="outline" 
              className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700"
              onClick={onHelp}
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              <span>Help</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
