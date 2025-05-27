import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useGame } from "@/context/game-context";
import { useGameTimer } from "@/hooks/useGameTimer"; // 👈 Import the timer hook
import { GameInfoPanel } from "@/components/game/game-info-panel";
import { PuzzleBoard } from "@/components/game/puzzle-board";
import { PiecesTray } from "@/components/game/pieces-tray";
import { HowToPlayModal } from "@/components/modals/how-to-play-modal";
import { SuccessModal } from "@/components/modals/success-modal";
import { initialCountries } from "@/data/countries";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Settings } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
//import { navigate } from "wouter/use-browser-location";
import { useLocation } from "wouter";


interface GameScreenProps {
  countryId: number;
}

export function GameScreen({ countryId }: GameScreenProps) {
  const { gameState, initializeGame, placePiece,setCountdown, useHint,setSelectedLevel, resetGame, setHighlightedRegions,setDroppedItems,selectedLevel, } = useGame();
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [showTimeUpModal, setShowTimeUpModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  const [_, navigate] = useLocation();


   // Determine if puzzle is completed
  const puzzleCompleted = gameState?.isCompleted ?? false;
  
// Use the enhanced timer hook
const {
  formattedTime,
  seconds,
  start,
  stop,
  reset,
} = useGameTimer({
  maxTime:
    selectedLevel === "easy" ? 480 : // 8 minutes
    selectedLevel === "medium" ? 480 : // 7 minutes
    selectedLevel === "hard" ? 300 : // 5 minutes

    240, // 4 minutes for hard
  isRunning: gameStarted,
  onTimeUp: () => {
    if (!puzzleCompleted) {
      setShowTimeUpModal(true);
      setTimeUp(true); //Set timeUp when time runs out

    }
  },
});

  // Update the puzzle completed effect// Stop the timer and show success modal when puzzle is completed

  useEffect(() => {
    if (puzzleCompleted) {
      stop(); // Stop the timer
      setShowSuccessModal(true);
    }
  }, [puzzleCompleted, stop]);

  
//use effect for level selection collection// Detect level from URL
  useEffect(() => {
    const url = new URL(window.location.href);
    const levelParam = url.searchParams.get("level");

    if (levelParam === "easy" || levelParam === "medium" || levelParam === "hard" || levelParam === "very hard") {
      setSelectedLevel(levelParam);
    }
  }, []);


  // for medium level popup piece name
  useEffect(() => {
    if (!gameStarted || puzzleCompleted || timeUp || selectedLevel !== "medium") return;
  
    let intervalId: NodeJS.Timeout;
    intervalId = setInterval(() => {
      setCountdown(prev => {
        if (prev === 0) {
          useHint(); // 👈 Call hint
          return 9; // Reset back to 4 seconds
        }
        return prev - 1;
      });
    }, 1000); // Tick every 1 second
  
    return () => clearInterval(intervalId);
  }, [gameStarted, puzzleCompleted, timeUp, selectedLevel, useHint]);
  


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
  const handlePieceDrop = (pieceId: number, x: number, y: number,rotation:number, pathData:string): boolean => {
    return placePiece(pieceId, x, y,rotation,pathData);
  };

  // Handle using a hint
 // const handleUseHint = () => {
   // useHint();
 // };

  // Handle restarting the game
  const handleRestart = () => {
    resetGame();
    //setGameStarted(false);
    setDroppedItems([]);
    setHighlightedRegions([]);
    reset();
    setShowSuccessModal(false); // Reset success modal state
    setShowTimeUpModal(false); // Reset time up modal state
    setCountdown(0);
    setGameStarted(true); // Force restart the timer

  };

  // Show help modal
  const handleHelp = () => {
    setShowHowToPlay(true);
  };

  // Start the game
  const handleStart = () => {
    setGameStarted(true);
  };

  type Difficulty = "easy" | "medium" | "hard" | "very hard" | null;


  const nextLevelMap: Record<Exclude<Difficulty, null>, Difficulty> = {
    easy: "medium",
    medium: "hard",
    hard: "very hard",
    "very hard": "very hard", // stays at the highest level
  };
  
  const increaseLevel = () => {
    if (selectedLevel !== null) {
      const nextLevel = nextLevelMap[selectedLevel];
      setSelectedLevel(nextLevel);
      return nextLevel; // 👈 Return it so we can use it
    }
    return null;
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
    <div className="min-h-screen flex flex-col relative">
      {/* Header with country name and difficulty */}
      <div className="bg-gradient-to-r from-emerald-700 to-emerald-600 py-3 px-4 text-white flex justify-between items-center">
        <h1 className="text-xl font-bold">{country.name} Puzzle - {selectedLevel}</h1>
        <div className="flex items-center gap-4">
        
    < div className="w-20 h-20 fixed down-10 right-6 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-700 flex items-center justify-center text-emerald-900 text-3xl font-bold animate-pulse shadow-2xl transform transition-transform duration-300 scale-105 ring-4 ring-yellow-200">
        {formattedTime}
         </div>
         
        <button onClick={() => setShowHowToPlay(true)} className="text-white hover:text-emerald-200 transition">
           {/* Help icon */}
           </button>

          <button 
            onClick={handleHelp}
            className="text-white hover:text-emerald-200 transition"
            aria-label="Help"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
            </svg>
          </button>
          <button 
            onClick={handleRestart}
            className="text-white hover:text-emerald-200 transition"
            aria-label="Restart"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>
        </div>
      </div>
     

      {showTimeUpModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div className="bg-white rounded-lg p-6 shadow-lg max-w-sm text-center">
      <h2 className="text-xl font-semibold mb-2">Time's Up!</h2>
      <p className="text-gray-700 mb-4">You ran out of time. Try again!</p>
      <button
        className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded"
        onClick={() => {
          setShowTimeUpModal(false);
          handleRestart();
        }}
      >
        Restart Puzzle
      </button>
    </div>
  </div>
)}

      {showSuccessModal && (
        <SuccessModal 
          isOpen={showSuccessModal}
          onRestart={() => {
            setShowSuccessModal(false);
            handleRestart();
          }}

          onNextLevel={() => {
            // Add your next level logic here
            const nextLevel = increaseLevel();
            if (nextLevel) {
              navigate(`/game/${countryId}?level=${nextLevel}`);
            }
            }}
        />
      )}

      {/* Hint button in top-right corner */}
      <div className="absolute top-16 right-4 z-10">
        <button 
          onClick={handleHelp}
          className="bg-white rounded-full p-2 shadow-md hover:bg-gray-100 text-emerald-700 hover:text-emerald-900 transition flex items-center gap-1"
          title="Use a hint"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
          </svg>
          <span className="text-xs font-bold">{3 - (gameState?.hintsUsed || 0)}</span>
        </button>
      </div>


         
    <div className="flex h-screen">
       
      {/* Main Game Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 bg-white">
        <PuzzleBoard 
          countryId={country.id} 
          countryName={country.name}
          outlinePath={country.outlinePath}
          onStart={handleStart}
        />
      </div>

      
      {/* Pieces Tray - vertical strip from top to down */}
      <div className="bg-gray-50 border-l overflow-y-auto py-3 px-2 w-[260px]">
      <PiecesTray 
          onPieceDrop={handlePieceDrop}
        />
      </div>
     
      
     </div>
      
      {/* Footer */}
      <div className="bg-gray-100 p-2 text-center text-sm text-gray-600">
        <p>Memorize the Map of {country.name}</p>
        {!gameStarted && <p className="text-xs text-gray-500">Starting puzzle in a moment...</p>}
      </div>
      
      {/* Settings panel */}
      <div className="fixed bottom-4 left-4 z-10">
        <Sheet>
          <SheetTrigger asChild>
            <button 
              className="bg-white rounded-full p-2 shadow-md hover:bg-gray-100 text-gray-700 hover:text-gray-900 transition"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80">
            <GameInfoPanel 
              onUseHint={handleHelp} 
              onRestart={handleRestart} 
              onHelp={handleHelp}
            />
          </SheetContent>
        </Sheet>
      </div>
      
      {/* Modals */}
      <HowToPlayModal isOpen={showHowToPlay} onClose={() => setShowHowToPlay(false)} />
      <SuccessModal isOpen={gameState?.isCompleted || false} />
    </div>
  );
}
