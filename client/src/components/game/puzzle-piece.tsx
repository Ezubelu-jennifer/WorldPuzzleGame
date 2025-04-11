import React, { useEffect, useRef, RefObject, useState } from "react";
import { useDrag } from "@/hooks/useDrag";
import { RegionPiece } from "@shared/schema";
import { cn } from "@/lib/utils";
import { getSvgDataById } from "@/data/svg-map-data";
import { getViewBoxFromSVG } from "@/data/svg-parser";

interface PuzzlePieceProps {
  region: RegionPiece;
  onDrop: (id: number, x: number, y: number) => boolean;
  containerRef: RefObject<HTMLDivElement>;
  snapToPosition?: boolean;
  isTrayPiece?: boolean;
}

export function PuzzlePiece({ 
  region, 
  onDrop, 
  containerRef,
  snapToPosition = false,
  isTrayPiece = false 
}: PuzzlePieceProps) {
  const pieceRef = useRef<HTMLDivElement>(null);
  const [svgPathData, setSvgPathData] = useState<string | null>(null);
  const [viewBox, setViewBox] = useState<string>("0 0 100 100");
  
  // Initialize position
  const initialX = region.currentX || (isTrayPiece ? 0 : Math.random() * 100);
  const initialY = region.currentY || (isTrayPiece ? 0 : Math.random() * 100);

  // Try to get the actual SVG path for this region from the SVG data
  useEffect(() => {
    // Determine country ID from the region ID pattern
    const countryId = region.id <= 36 ? 1 : 2; // Nigeria (1-36), Kenya (37+)
    const svgData = getSvgDataById(countryId);
    
    if (svgData) {
      // Set viewBox from SVG
      const extractedViewBox = getViewBoxFromSVG(svgData);
      setViewBox(extractedViewBox);
      
      // Try to find the actual SVG path for this region
      // Convert numeric region ID to SVG ID format
      let regionSvgId = countryId === 1 
        ? `NG-${region.name}` // Nigeria prefix
        : `KE-${region.name}`; // Kenya prefix
      
      // Use regex to find the path with this ID, or fallback to using the region name
      const regexById = new RegExp(`<path[^>]*id="${regionSvgId}"[^>]*d="([^"]+)"`, 'i');
      const regexByName = new RegExp(`<path[^>]*title="${region.name}"[^>]*d="([^"]+)"`, 'i');
      
      let match = svgData.match(regexById) || svgData.match(regexByName);
      
      if (match && match[1]) {
        setSvgPathData(match[1]);
      } else {
        // Fallback to the original path
        setSvgPathData(region.svgPath);
      }
    } else {
      // Fallback to the original path
      setSvgPathData(region.svgPath);
    }
  }, [region.id, region.name, region.svgPath]);

  // Use our custom drag hook
  const { isDragging, position, setPosition, dragHandlers } = useDrag({
    initialPosition: { x: initialX, y: initialY },
    onDragStart: () => {
      // Start dragging logic
    },
    onDragEnd: (finalPosition) => {
      // Calculate position relative to container
      if (containerRef.current && pieceRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const pieceRect = pieceRef.current.getBoundingClientRect();
        
        const relativeX = finalPosition.x - containerRect.left;
        const relativeY = finalPosition.y - containerRect.top;
        
        // Check if piece should be placed in the correct position
        const isPlaced = onDrop(region.id, relativeX, relativeY);
        
        if (isPlaced && snapToPosition) {
          // If it's placed and we want to snap, set to the correct position
          setPosition({ x: region.correctX, y: region.correctY });
        }
      }
    }
  });

  // If the piece is placed correctly and snapToPosition is true, position it correctly
  useEffect(() => {
    if (region.isPlaced && snapToPosition) {
      setPosition({ x: region.correctX, y: region.correctY });
    }
  }, [region.isPlaced, snapToPosition, region.correctX, region.correctY, setPosition]);

  // Determine piece size based on whether it's in the tray or on the board
  const pieceSize = isTrayPiece ? 80 : 120;

  return (
    <div
      ref={pieceRef}
      className={cn(
        "absolute transition-transform",
        isDragging ? "z-10 scale-105" : "",
        region.isPlaced ? "cursor-default" : "cursor-move",
        isTrayPiece ? "inline-block" : ""
      )}
      style={{ 
        top: `${position.y}px`, 
        left: `${position.x}px`,
        opacity: region.isPlaced ? 0.9 : 1,
        transform: isDragging ? "scale(1.05)" : "scale(1)",
        transition: "transform 0.1s ease, opacity 0.3s ease",
        width: `${pieceSize}px`,
        height: `${pieceSize}px`
      }}
      {...dragHandlers}
    >
      <svg 
        viewBox={viewBox} 
        className="w-full h-full" 
        style={{ overflow: 'visible' }}
      >
        <path 
          d={svgPathData || region.svgPath} 
          fill={region.isPlaced ? region.fillColor : "#ef4444"} // Red for unplaced pieces
          stroke={region.strokeColor}
          strokeWidth="2"
          style={{ filter: isDragging ? 'drop-shadow(0px 4px 8px rgba(0,0,0,0.3))' : 'none' }}
        />
        <text 
          x="50%" 
          y="50%" 
          textAnchor="middle" 
          dominantBaseline="middle"
          fill={region.isPlaced ? "#ffffff" : "#ffffff"} 
          fontSize={isTrayPiece ? "10" : "12"}
          fontWeight="bold"
          style={{ 
            filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.5))',
            textShadow: '0 1px 2px rgba(0,0,0,0.5)'
          }}
        >
          {region.name}
        </text>
      </svg>
    </div>
  );
}
