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

  // Make sure we display ALL regions
  const allRegions = [...gameState.regions];
  // Filter for unplaced pieces that can be moved
  const unplacedPieces = allRegions.filter(region => !region.isPlaced);
  
  // Vibrant colors for regions - using a diverse color palette
  const colors = [
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
  
  return (
    <div className="relative min-h-[160px] border-t border-b border-gray-200 bg-gray-50">
      <div className="absolute left-0 top-1/2 -translate-y-1/2 bg-gradient-to-r from-gray-50 to-transparent w-10 h-full z-10 pointer-events-none"></div>
      <div className="absolute right-0 top-1/2 -translate-y-1/2 bg-gradient-to-l from-gray-50 to-transparent w-10 h-full z-10 pointer-events-none"></div>
      
      <div ref={trayRef} className="flex gap-3 overflow-x-auto py-3 px-4 min-h-[160px] whitespace-nowrap overflow-y-hidden">
        {allRegions.map((region, index) => {
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
            className={`flex-shrink-0 relative w-32 h-32 rounded-md shadow-md border-2 p-1 flex items-center justify-center 
              ${region.isPlaced ? 'bg-gray-100 opacity-60 border-gray-300' : 'bg-white cursor-grab border-blue-200 hover:border-blue-400'}`}
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
                    strokeWidth={3}
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
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs py-1 px-2 font-medium text-center rounded-b-sm truncate">
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
                <span className="text-xs font-bold text-center absolute bottom-1 text-white drop-shadow-md pointer-events-none z-10">
                  {region.name}
                </span>
              </div>
            )}
            
            {/* Status indicator */}
            {region.isPlaced && (
              <div className="absolute top-1 right-1 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-md">
                ✓
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
  );
}
