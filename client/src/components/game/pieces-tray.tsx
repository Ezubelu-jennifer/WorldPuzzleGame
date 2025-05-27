import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { useGame } from "@/context/game-context";
import { RegionThumbnail } from "@/components/region-thumbnail";
import { getSvgDataById } from "@/data/svg-map-data";
import { extractWorldRegions, } from "@/data/svg-parser";
import type { RegionPiece } from "@shared/schema";
import { useDragContext } from "@/context/drag-context";

interface PiecesTrayProps {
  onPieceDrop: (
    id: number, 
    x: number,
    y: number, 
    rotation: number,
    pathData:string
  ) => boolean; // make this rotation parameter to be in game
}

const COLORS = [
  { fill: "#ef4444", stroke: "#b91c1c" }, // red
  { fill: "#f97316", stroke: "#c2410c" }, // orange
  { fill: "#eab308", stroke: "#a16207" }, // yellow
  { fill: "#22c55e", stroke: "#15803d" }, // green
  { fill: "#06b6d4", stroke: "#0e7490" }, // cyan
  { fill: "#0ea5e9", stroke: "#0369a1" }, // light blue
  { fill: "#6366f1", stroke: "#4338ca" }, // indigo
  { fill: "#8b5cf6", stroke: "#6d28d9" }, // purple
  { fill: "#d946ef", stroke: "#a21caf" }, // pink
  { fill: "#f43f5e", stroke: "#be123c" }, // rose
];

interface RegionMatchParams {
  regionName: string;
  svgRegionName: string;
  countryId: number;
  svgRegionId: string;
}
type RegionType = {
  id: string;
  name: string;
  path: string;
};



//help me check this match region
const matchesRegion = ({ regionName, svgRegionName, countryId, svgRegionId }: RegionMatchParams): boolean => {
  const nameLower = regionName.toLowerCase().trim();
  const svgNameLower = svgRegionName.toLowerCase().trim();
  
  // Direct name matching
  if (svgNameLower.includes(nameLower) || nameLower.includes(svgNameLower)) {
    return true;
  }
   return false
}


export function PiecesTray({ onPieceDrop }: PiecesTrayProps) {
  const { gameState,completeGame,selectedLevel,setGameState} = useGame();
  const trayRef = useRef<HTMLDivElement>(null);
  const [svgData, setSvgData] = useState<string>("");
  const [svgRegions, setSvgRegions] = useState<Array<{ id: string; name: string; path: string }>>([]);
  const { startDrag } = useDragContext();

  const [rotations, setRotations] = useState<Record<number, number>>({});



  const regionExtractors: Record<number, (svgData: string) => RegionType[]> = {
    1: extractWorldRegions,
   // 2: extractKenyaRegions,
   
    // Add more countries as needed
  };
  
  // Load SVG data
  useEffect(() => {
    if (!gameState?.countryId) return;

    const data = getSvgDataById(gameState.countryId);
    if (!data) return;

    setSvgData(data);
    const extractor = regionExtractors[gameState.countryId];
  if (extractor) {
    setSvgRegions(extractor(data));
  } else {
    console.warn(`No extractor found for countryId ${gameState.countryId}`);
    setSvgRegions([]); // or keep previous, or show fallback
  }
}, [gameState?.countryId]);


 // Handle game completion
 useEffect(() => {
  if (gameState && !gameState.isCompleted) {
    const unplaced = gameState.regions.filter(region => !region.isPlaced);
    if (unplaced.length === 0) {
      completeGame();
    }
  }
}, [gameState?.regions, completeGame, gameState]);



const handleDragStart = useCallback(
  (piece: RegionPiece) => {
    const currentRotation =
      //selectedLevel === "hard" ? rotations[piece.id] || 0 : 0;
      
    (selectedLevel === "hard" || selectedLevel === "very hard") ? rotations[piece.id] || 0 : 0;

    startDrag({
      pieceId: piece.id,
      rotation: currentRotation,
    });
  },
  [startDrag, rotations, selectedLevel]
);

// Add a ref to track initialization
const initialized = useRef(false);

// Initialize random rotations for hard level - UPDATED
useEffect(() => {
  if (!gameState || !setGameState || initialized.current) return;

  const newRotationsState: Record<number, number> = {};
  let needsUpdate = false;

  const updatedRegions = gameState.regions.map(region => {
    let rotation = region.rotation || 0;
    //if (selectedLevel === "hard" && !region.isPlaced) {
   if ((selectedLevel === "hard" || selectedLevel === "very hard") && !region.isPlaced) {

      if (!region.rotation) { // Only set if no existing rotation
        rotation = 30 * Math.floor(Math.random() * 12);
        needsUpdate = true;
      }
    } //else if (region.rotation !== 0) { // Reset for non-hard levels
    else if ((selectedLevel !== "hard" && selectedLevel !== "very hard") && region.rotation !== 0){
      rotation = 0;
      needsUpdate = true;
    }
    
    newRotationsState[region.id] = rotation;
    return {...region, rotation};
  });
  if (needsUpdate) {
    setGameState({
      ...gameState,
      regions: updatedRegions
    });
  }

  setRotations(newRotationsState);
  initialized.current = true;

// Only run when level changes or gameState changes
}, [gameState, selectedLevel, setGameState]); 

// Reset initialized ref when gameState changes
useEffect(() => {
  initialized.current = false;
}, [gameState?.regions]);



 // Update handleRotate function
 const handleRotate = useCallback((pieceId: number) => {
 // if (selectedLevel !== "hard") return;
 if (selectedLevel !== "hard" && selectedLevel !== "very hard") return;


  const newRotation = (rotations[pieceId] + 12) % 360;
  //console.log("placeid:", pieceId, "newrotation:", newRotation);

  // Update local rotations state
  setRotations(prev => ({
    ...prev,
    [pieceId]: newRotation,
  }));

  // Update global game state
  if (gameState && setGameState) {
    const updatedRegions = gameState.regions.map(region =>
      region.id === pieceId ? { ...region, rotation: newRotation } : region
    );
    setGameState({ ...gameState, regions: updatedRegions });
  }
}, [rotations, gameState, setGameState, selectedLevel]);


  if (!gameState) {
    return (
      <div className="flex space-x-3 overflow-x-auto py-1 min-h-[70px] animate-pulse">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="w-16 h-16 bg-gray-200 rounded-md flex-shrink-0" />
        ))}
      </div>
    );
  }

  const unplacedPieces = gameState.regions.filter(region => !region.isPlaced);
 // console.log('unplacepiece:',unplacedPieces);
  const pieceSize = 100 * (gameState.shapeSize || 1.0); // 100 instead of 90

  return (
    <div className="flex h-full">
    {/* Main content can go here if needed */}
    <div className="flex-1">{/* Map or game area */}</div>

    {/* Right-side vertical tray */}
    <div className="relative w-[280px] min-h-full border-l border-gray-200 bg-gray-50">

       {/* Top & Bottom gradient overlays */}
       <div className="absolute top-0 left-0 w-full h-6 bg-gradient-to-b from-gray-50 to-transparent z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-full h-6 bg-gradient-to-t from-gray-50 to-transparent z-10 pointer-events-none" />
     
     {/* States counter */}
      <div className="absolute top-1 left-2 text-xs text-gray-300 z-20">

        {gameState.placedPieces.length}/{gameState.regions.length} States
      </div>

      <div ref={trayRef} 
        className="flex flex-col gap-3 overflow-y-auto h-full py-8 px-2"
        >
        {unplacedPieces.map((region, index) => {
          const colorIndex = index % COLORS.length;
          const { fill: fillColor, stroke: strokeColor } = COLORS[colorIndex];

          const svgRegion = svgRegions.find(r => 
            matchesRegion({
              regionName: region.name,
              svgRegionName: r.name,
              countryId: gameState.countryId,
              svgRegionId: r.id
            })
          );
          //console.log('unplacepiece:',svgRegion?.name);
         // console.log('regionName: ', region.name);


          return (
            <div
              key={region.id}
              id={`piece-${region.id}`}
              className="flex-shrink-0 relative rounded-lg  p-3 bg-white  border border-gray-300"
              style={{ 
                width: `${pieceSize+150}px`,
                height: `${pieceSize+150}px`,
                //transform: selectedLevel === "hard" ? `rotate(${rotations[region.id] || 0}deg)` : undefined,
              }}
              draggable
              onDragStart={() => handleDragStart(region)}
              
             
            >
  
            {(selectedLevel === "hard" || selectedLevel === "very hard") && (
            <button
              className="absolute top-0 right-0 z-10 p-1 text-xs bg-white rounded-full shadow-sm -translate-y-1/2 translate-x-1/2 hover:bg-gray-100"
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handleRotate(region.id);
              }}
            >
              ↻
            </button>
          )}
              
              {svgData && svgRegion ? (
                <RegionThumbnail
                  svgData={svgData}
                  regionId={svgRegion.id}
                  regionName={region.name}
                  color={fillColor}
                  strokeColor={strokeColor}
                  strokeWidth={1}
                  width={pieceSize+100}
                  height={pieceSize+100}
                  showLabel
                  draggable
                  onDrop={onPieceDrop}
                  rotatable={selectedLevel === "hard" || selectedLevel === "very hard"}
                  initialRotation={rotations[region.id] || 0} // Use the state managed by PiecesTray
                  onRotate={(newRot) => handleRotate(region.id)}
                  regionPieceId={region.id}
                  shapeSize={gameState.shapeSize}
                  //style={{ transform: `rotate(${region.rotation}deg)` }}
                />
              ) : (
                <div
                  className="absolute transition-transform"
                  style={{ 
                    transform: `rotate(${rotations[region.id] || 0}deg)`,
                    width: `${pieceSize}px`,
                    height: `${pieceSize}px`,
                    // Add some basic styling for the fallback to be visible
                    backgroundColor: fillColor || '#cccccc',
                    border: `1px solid ${strokeColor || '#aaaaaa'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    color: '#555555'
                  }}
                >
                  {/* Fallback piece rendering */}
                  {region.name.substring(0,3)} {/* Show a short name as fallback content */}

                </div>
              )}
            </div>
            
          );
        })}

        {unplacedPieces.length === 0 && (
          <div className="flex items-center justify-center w-full h-16 text-gray-500">
            All pieces have been placed!
          </div>
        )}
      </div>
    </div>
    </div>

  );
}