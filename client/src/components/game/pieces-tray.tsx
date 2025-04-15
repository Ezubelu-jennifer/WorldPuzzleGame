import React, { useRef, useEffect, useState } from "react";
import { useGame } from "@/context/game-context";
import { StatePiece } from "@/components/game/new-state-piece";
import { RegionThumbnail } from "@/components/region-thumbnail";
import { getSvgDataById } from "@/data/svg-map-data";
import { extractNigeriaRegions, extractKenyaRegions } from "@/data/svg-parser";
import { RegionPiece } from "@shared/schema";

interface PiecesTrayProps {
  onPieceDrop: (id: number, x: number, y: number) => boolean;
  shapeSize?: number; // Add shape size prop
}

export function PiecesTray({ onPieceDrop, shapeSize = 1.0 }: PiecesTrayProps) {
  const { gameState } = useGame();
  const trayRef = useRef<HTMLDivElement>(null);
  const [svgData, setSvgData] = useState<string>("");
  const [svgRegions, setSvgRegions] = useState<{ id: string; name: string; path: string }[]>([]);
  
  // Debug log
  console.log(`PiecesTray: Rendering with shapeSize ${shapeSize}`);
  
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

  // Only display unplaced regions in the tray
  const unplacedPieces = gameState.regions.filter(region => !region.isPlaced);
  
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
    <div className="relative min-h-[120px] border-t border-b border-gray-200 bg-gray-50">
      <div className="absolute left-0 top-1/2 -translate-y-1/2 bg-gradient-to-r from-gray-50 to-transparent w-16 h-full z-10 pointer-events-none"></div>
      <div className="absolute right-0 top-1/2 -translate-y-1/2 bg-gradient-to-l from-gray-50 to-transparent w-16 h-full z-10 pointer-events-none"></div>
      
      <div className="absolute top-1 left-2 text-xs text-gray-500">
        {gameState.placedPieces.length}/{gameState.regions.length} States
      </div>
      
      <div ref={trayRef} className="flex gap-2 overflow-x-auto py-4 px-8 min-h-[120px] whitespace-nowrap overflow-y-hidden">
        {unplacedPieces.map((region: RegionPiece, index: number) => {
        // Assign color from our palette, cycling through if needed
        const colorIndex = index % colors.length;
        const fillColor = colors[colorIndex].fill;
        const strokeColor = colors[colorIndex].stroke;
        
        // Find matching SVG region by name with more comprehensive matching
        const svgRegion = svgRegions.find(r => {
          const rNameLower = r.name.toLowerCase();
          const regionNameLower = region.name.toLowerCase();
          
          // Direct includes matching (bidirectional)
          if (rNameLower.includes(regionNameLower) || regionNameLower.includes(rNameLower)) {
            return true;
          }
          
          // Handle special case for Ebonyi (Nigeria)
          if (region.name === "Ebonyi" && (r.id === "NG-EB" || r.name.includes("Ebon"))) {
            return true;
          }
          
          // Handle other special cases for Nigeria
          if (gameState.countryId === 1) {
            if (region.name === "Federal Capital Territory" && r.id === "NG-FC") return true;
            if (region.name === "Cross River" && r.id === "NG-CR") return true;
          }
          
          // Handle special cases for Kenya counties
          if (gameState.countryId === 2) {
            // Map Trans-Nzoia county
            if ((region.name.includes("Trans") || region.name.includes("Nzoia")) && 
                (r.id === "KE-26" || r.id === "26")) {
              return true;
            }
            
            // Map Taita-Taveta county
            if ((region.name.includes("Taita") || region.name.includes("Taveta")) && 
                (r.id === "KE-06" || r.id === "06")) {
              return true;
            }
            
            // Map Tharaka-Nithi
            if ((region.name.includes("Tharaka") || region.name.includes("Nithi")) && 
                (r.id === "KE-13" || r.id === "13")) {
              return true;
            }
          }
          
          return false;
        });

        const regionWithColor = {
          ...region,
          fillColor,
          strokeColor,
        };
        
        // Don't use special handling for FCT and Nasarawa thumbnails anymore
        const forcedCircle = false; // Restore original shapes for all regions
        
        return (
          <div 
            key={region.id}
            className={`flex-shrink-0 relative w-20 h-20 rounded-md 
              ${region.isPlaced ? 'opacity-60' : ''}`}
            style={{ background: 'transparent', border: 'none' }}
          >
            {svgData && svgRegion && !forcedCircle ? (
              // Use the SVG thumbnail for the region, with direct draggable and rotatable support
              <RegionThumbnail
                svgData={svgData}
                regionId={svgRegion.id}
                regionName={region.name}
                color={fillColor}
                strokeColor={strokeColor}
                strokeWidth={1}
                width="100%"
                height="100%"
                showLabel={true}
                draggable={true}
                rotatable={true}
                onDrop={onPieceDrop}
                regionPieceId={region.id}
              />
            ) : (
              // Render directly - NO container div
              <DynamicStatePiece
                region={regionWithColor}
                onDrop={onPieceDrop}
                containerRef={trayRef}
                isTrayPiece
                shapeSize={shapeSize}
              />
            )}
            
            {/* Status indicator */}
            {/* We don't need check marks since we're now filtering out placed pieces */}
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
