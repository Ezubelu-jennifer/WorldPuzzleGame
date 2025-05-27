import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { GameState, RegionPiece } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { sampleRegions } from "@/data/countries";
import { useDragContext } from "./drag-context";

type Difficulty = "easy" | "medium" | "hard" |"very hard" | null;


interface GameContextProps {
  gameState: GameState | null;
  setGameState: React.Dispatch<React.SetStateAction<GameState | null>>
  initializeGame: (countryId: number, countryName: string) => Promise<void>;
  placePiece: (pieceId: number, x: number, y: number, rotation: number,pathData: string) => boolean;
  useHint: () => void;
  resetGame: () => void;
  completeGame: () => void;
  setShapeSize: (size: number) => void;
  loading: boolean;
  error: string | null;
  hasDropped: boolean;
  //mapregionPosition:{x:number, y:number};
  setmapregionPosition: (positions: RegionPosition[]) => void;
  //droppedRegionId: number | null;
  highlightedRegions: string[];
  setHighlightedRegions: React.Dispatch<React.SetStateAction<string[]>>;
  setDroppedItems: React.Dispatch<React.SetStateAction<{ regionId: number; position: { x: number; y: number }; pathData: string }[]>>;
  droppedItems: { regionId: number; position: { x: number; y: number };pathData: string }[];
  svgDimensions: SvgDimensions;
  setSvgDimensions: (dims: SvgDimensions) => void;
  selectedLevel: Difficulty;
  setSelectedLevel: React.Dispatch<React.SetStateAction<Difficulty>>;
  currentTarget: { id: number; name: string } | null;
  setCurrentTarget: React.Dispatch<React.SetStateAction< { id: number; name: string } | null>>;
  showPopup: boolean;
  errorPopup: ErrorPopupType;
  countdown: number;
  setCountdown: React.Dispatch<React.SetStateAction<number>>;
  
}
interface SvgDimensions {
  width: number;
  height: number;
}
type ErrorPopupType = {
  message: string;
  visible: boolean;
};


interface DroppedItem {
  regionId: number;
  position: { x: number; y: number };
  pathData: string; 
}

interface RegionPosition {
  id: string;
    name: string;
    path: string;
    position?: {
        x: number;
        y: number;
    };
}

const GameContext = createContext<GameContextProps | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gameSessionId, setGameSessionId] = useState<number | null>(null);
  const [mapregionPosition, setmapregionPosition] = useState<RegionPosition[]>([]);
  const [hasDropped, setHasDropped] = useState(false);
  //const [droppedRegionId, setDroppedRegionId] = useState<number | null>(null);
  //const [dragpathData, setDragPathData] = useState<string>("");
  const [droppedItems, setDroppedItems] = useState<DroppedItem[]>([]);
  const [svgDimensions, setSvgDimensions] = useState<SvgDimensions>({ width: 0, height: 0 });
  const [highlightedRegions, setHighlightedRegions] = useState<string[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<Difficulty>(null);

  const [currentTarget, setCurrentTarget] = useState<{ id: number; name: string } | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const { draggedPieceId, draggedRotation, } = useDragContext();
  const [errorPopup, setErrorPopup] = useState({ message: "", visible: false });
  const [countdown, setCountdown] = useState(9); // 


    
  const initializeGame = useCallback(async (countryId: number, countryName: string) => {
    setLoading(true);
    setError(null);

    try {
      let regions: RegionPiece[] = [];

      try {
        const response = await fetch(`/api/countries/${countryId}/regions`);
        if (!response.ok) throw new Error("Failed to load regions");

        regions = await response.json();

        // Adjust special cases
        regions = regions.map((region, index) => {
          const specialCoords: Record<string, { x: number; y: number }> = {
          
          };
          const special = specialCoords[region.name];

          return {
            id: region.id,
            name: region.name,
            svgPath: region.svgPath || "",
           correctX: region.correctX ?? 150 + index * 50,
           correctY: region.correctY ?? 150 + index * 30,

            isPlaced: false,
            fillColor: region.fillColor || `#${Math.floor(Math.random() * 16777215).toString(16)}`,
            strokeColor: region.strokeColor || "#333333",
            rotation: 0,
          };
        });
      } catch (apiError) {
        console.warn("Failed to fetch regions, using sample data.", apiError);
        regions = sampleRegions[countryId] || [];
      }

      // Ensure region count
      const expectedRegionCounts: Record<number, number> = {
        1: 256, // Nigeria
        2: 47, // Kenya
        3: 10, // South Africa
        4: 29, // Egypt
        5: 16, // Morocco
      };
      
      const expectedCount = expectedRegionCounts[countryId] ?? 0; // Default to 0 if not found
      if (regions.length < expectedCount) {
        for (let i = regions.length; i < expectedCount; i++) {
          regions.push({
            id: 1000 + i,
            name: `Region ${i + 1}`,
            svgPath: "",
            correctX: 150 + i * 50,
            correctY: 150 + i * 30,
            isPlaced: false,
            fillColor: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
            strokeColor: "#333333",
            rotation: 0,
          });
        }
      } else if (regions.length > expectedCount) {
        regions = regions.slice(0, expectedCount);
      }

      // Create game session
      try {
        const response = await apiRequest('POST', '/api/game-sessions', {
          countryId,
          startedAt: new Date().toISOString(),
          hintsUsed: 0,
          userId: null,
        });
        if (response.ok) {
          const session = await response.json();
          setGameSessionId(session.id);
        }
      } catch (sessionError) {
        console.warn("Session creation failed, continuing offline.", sessionError);
      }

      setGameState(prev => ({
        ...prev,
        countryId,
        countryName,
        regions,
        placedPieces: [],
        hintsUsed: 0,
        startTime: Date.now(),
        endTime: null,
        isCompleted: false,
        score: null,
        shapeSize: 1.0,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Initialization failed");
    } finally {
      setLoading(false);
    }
  }, []);

  
  useEffect(() => {
    console.log('hasDropped updated:', hasDropped);
  }, [hasDropped]);
  useEffect(() => {
    console.log("Dropped items updated:", droppedItems);
  }, [droppedItems]);

  //this use effect is used for visible popup error
  useEffect(() => {
    if (errorPopup.visible) {
      const timer = setTimeout(() => {
        setErrorPopup({ message: "", visible: false });
      }, 3000); // Hide after 3 seconds
  
      return () => clearTimeout(timer);
    }
  }, [errorPopup.visible]);
  


  const placePiece = (pieceId: number, x: number, y: number, rotation: number,pathData: string) => {
    if (!gameState) return false;
    
    console.log(`GameContext placePiece checking: pieceId=${pieceId}, adjustedPos=(${x.toFixed(2)}, ${y.toFixed(2)})`);

  
    const pieceIndex = gameState.regions.findIndex(r => r.id === pieceId && !r.isPlaced);
    if (pieceIndex === -1) return false;

    const piece = gameState.regions[pieceIndex];
    const regionName = piece.name;
    console.log("Region Name:", regionName);

     // Now, find the region in mapregionPosition based on the regionName
    const regionPosition = mapregionPosition.find(r => r.name === regionName);

    if (!regionPosition ) return false;
   // if (regionPosition) {
    console.log("Region Position:", regionPosition.position);
    // Access the position of the region in mapregionPosition
    const { x: regionX, y: regionY } = regionPosition.position || { x: 0, y: 0 };
  
    // You can use regionX, regionY to work with the position
    const dx = x - regionX;
    const dy = y - regionY;
    const distance =( Math.sqrt(dx * dx + dy * dy));

    let tolerance = (gameState.shapeSize || 1) * 250;
   
    const isWithinTolerance = distance <= tolerance;
  
    let isCorrect = false;

    switch (selectedLevel) {
      case "easy":
        // Just use distance tolerance
        isCorrect = isWithinTolerance;
        break;
  
      case "medium":
        // Check correct piece, even if dropped at wrong location
        if (pieceId !== currentTarget?.id) {
          setErrorPopup({
            message: "Wrong piece! Try placing the highlighted region.",
            visible: true,
          });
          return false;
        }
        isCorrect = isWithinTolerance;
        break;

        case "hard":
          // Check both position and rotation
          if(rotation <= 20){
            isCorrect = isWithinTolerance ;//&& isRotationCorrect;
          }
          break;

          case "very hard":
            if(rotation <= 12){
              isCorrect = isWithinTolerance ;//&& isRotationCorrect;
            }
            break;
    
        default:
          isCorrect = isWithinTolerance;
      }
      console.log(`dx: ${dx}, dy: ${dy}, distance: ${distance}, tolerance: ${tolerance}, isCorrect: ${isCorrect}`);


    if (isCorrect) {

        const updatedPiece = {
        ...piece, 
        isPlaced: true, 
        rotation, 
        correctX:regionX,
        correctY: regionY,
        
      };
      const updatedRegions = [...gameState.regions];
      updatedRegions[pieceIndex] = updatedPiece;

      setGameState({
        ...gameState,
        regions: updatedRegions,
        placedPieces: [...gameState.placedPieces, pieceId],
        
      });

    setHasDropped(true);

      setDroppedItems(prev => [
        ...prev,
        {
          regionId: pieceId,
          position: { x: regionX, y: regionY },
          pathData,
        },
      ]);
      setShowPopup(false);
      return true;
   // }
    }
    //console.log("Drop rejected - outside tolerance");
    //return false;
    else {
      setErrorPopup({
        message: selectedLevel === "hard"
          ? "Incorrect placement. Try again with correct position and rotation."
          : "Incorrect placement. Try again.",
        visible: true,
      });
  
      return false;
    }
};
  



  const useHint = () => {
    //if (!gameState) return;
    //setGameState(prev => prev ? { ...prev, hintsUsed: prev.hintsUsed + 1 } : prev);
    if (!gameState?.regions) return;

    const unplacedRegions = gameState.regions.filter(region => !region.isPlaced);

    if (unplacedRegions.length === 0) {
      setCurrentTarget(null);
      setShowPopup(false);
      alert("All pieces placed!");
      return;
    }

    const randomIndex = Math.floor(Math.random() * unplacedRegions.length);
    const selectedRegion = unplacedRegions[randomIndex];
  
    setCurrentTarget({ id: selectedRegion.id, name: selectedRegion.name });


    setShowPopup(true);
  };

  const resetGame = () => {
    if (!gameState) return;
    setGameState({
      ...gameState,
      regions: gameState.regions.map(r => ({ ...r, isPlaced: false })),
      placedPieces: [],
      hintsUsed: 0,
      startTime: Date.now(),
      endTime: null,
      isCompleted: false,
      score: null,
    });
  };

  const completeGame = () => {
    if (!gameState) return;
    setGameState({
      ...gameState,
      isCompleted: true,
      endTime: Date.now(),
      score: calculateScore(gameState),
    });
  };

  const setShapeSize = (size: number) => {
    if (!gameState) return;
    setGameState(prev => prev ? { ...prev, shapeSize: size } : prev);
  };

  const calculateScore = (state: GameState): number => {
    if (!state.startTime || !state.endTime) return 0;
  
    const totalTimeInSeconds = (state.endTime - state.startTime) / 1000;
    const penalty = state.hintsUsed * 10; // Example: 10 points per hint used
  
    const baseScore = 1000; // Max score
    const timePenalty = totalTimeInSeconds; // 1 point per second taken
  
    let score = baseScore - timePenalty - penalty;
    return Math.max(0, Math.round(score)); // Ensure score isn't negative
  };
  
  return (
    <GameContext.Provider value={{
      gameState,
      setGameState,
      initializeGame,
      placePiece,
      useHint,
      resetGame,
      completeGame,
      setShapeSize,
      hasDropped,
      svgDimensions, 
      setSvgDimensions,
      //mapregionPosition,
      setmapregionPosition,
      setDroppedItems,
      highlightedRegions,           // ✅ added
      setHighlightedRegions,  
      droppedItems,
      selectedLevel,
      setSelectedLevel,
      currentTarget,
      setCurrentTarget,
      showPopup,
      errorPopup,
      countdown,
      setCountdown,
      loading,
      error,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
}
