import React, { useRef, useEffect, useState } from "react";
import { useGame } from "@/context/game-context";
import { PuzzlePiece } from "@/components/game/puzzle-piece";
import { RegionThumbnail } from "@/components/region-thumbnail";
import { getSvgDataById } from "@/data/svg-map-data";
import { extractNigeriaRegions, extractKenyaRegions } from "@/data/svg-parser";

interface PiecesTrayProps {
  onPieceDrop: (id: number, x: number, y: number) => boolean;
}

export function PiecesTray({ onPieceDrop }: PiecesTrayProps) {
  const { gameState } = useGame();
  const trayRef = useRef<HTMLDivElement>(null);
  const [svgData, setSvgData] = useState<string>("");
  const [svgRegions, setSvgRegions] = useState<{ id: string; name: string; path: string }[]>([]);
  
  // Load SVG data for the country
  useEffect(() => {
    if (gameState && gameState.countryId) {
      const data = getSvgDataById(gameState.countryId);
      if (data) {
        setSvgData(data);
        
        // Extract regions from SVG data
        const extractedRegions = gameState.countryId === 1 
          ? extractNigeriaRegions(data)
          : extractKenyaRegions(data);
        setSvgRegions(extractedRegions);
      }
    }
  }, [gameState?.countryId]);
  
  if (!gameState) {
    return (
      <div className="flex space-x-3 overflow-x-auto py-1 min-h-[70px] animate-pulse">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="w-16 h-16 bg-gray-200 rounded-md flex-shrink-0"></div>
        ))}
      </div>
    );
  }

  // Filter for unplaced pieces
  const unplacedPieces = gameState.regions.filter(region => !region.isPlaced);
  
  // Random vibrant colors for regions (following the red theme in screenshot)
  const colors = [
    { fill: "#ef4444", stroke: "#b91c1c" }, // red-500, red-700
    { fill: "#f87171", stroke: "#b91c1c" }, // red-400, red-700
    { fill: "#fca5a5", stroke: "#b91c1c" }, // red-300, red-700
    { fill: "#f97316", stroke: "#c2410c" }, // orange-500, orange-700
    { fill: "#fb923c", stroke: "#c2410c" }, // orange-400, orange-700
    { fill: "#ef4444", stroke: "#b91c1c" }, // red-500, red-700
    { fill: "#f87171", stroke: "#b91c1c" }, // red-400, red-700
  ];
  
  return (
    <div ref={trayRef} className="flex space-x-3 overflow-x-auto py-1 min-h-[80px]">
      {unplacedPieces.map((region, index) => {
        // Assign color from our palette, cycling through if needed
        const colorIndex = index % colors.length;
        const fillColor = colors[colorIndex].fill;
        const strokeColor = colors[colorIndex].stroke;
        
        // Find matching SVG region by name
        const svgRegion = svgRegions.find(r => 
          r.name.toLowerCase().includes(region.name.toLowerCase()) || 
          region.name.toLowerCase().includes(r.name.toLowerCase())
        );

        const regionWithColor = {
          ...region,
          fillColor,
          strokeColor,
        };
        
        return (
          <div 
            key={region.id}
            className="flex-shrink-0 relative w-20 h-20 bg-white rounded-md shadow-sm border border-gray-200 p-1 flex items-center justify-center"
          >
            {svgData && svgRegion ? (
              // Use the SVG thumbnail for the region
              <div className="w-full h-full relative">
                <div className="absolute inset-0">
                  <RegionThumbnail
                    svgData={svgData}
                    regionId={svgRegion.id}
                    regionName={region.name}
                    color={fillColor}
                    strokeColor={strokeColor}
                    strokeWidth={2}
                    width="100%"
                    height="100%"
                    showLabel={false}
                  />
                </div>
                
                {/* Overlay the puzzle piece for drag-and-drop functionality */}
                <div className="absolute inset-0 opacity-0">
                  <PuzzlePiece
                    region={regionWithColor}
                    onDrop={onPieceDrop}
                    containerRef={trayRef}
                    isTrayPiece
                  />
                </div>
                
                {/* Region name label */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] py-1 px-2 font-medium text-center rounded-b-sm truncate">
                  {region.name}
                </div>
              </div>
            ) : (
              // Fallback to regular puzzle piece
              <div className="absolute inset-0 flex items-center justify-center">
                <PuzzlePiece
                  region={regionWithColor}
                  onDrop={onPieceDrop}
                  containerRef={trayRef}
                  isTrayPiece
                />
                <span className="text-[10px] font-bold text-center absolute bottom-1 text-white drop-shadow-md pointer-events-none z-10">
                  {region.name}
                </span>
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
  );
}
